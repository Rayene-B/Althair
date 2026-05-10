import { formatDate, urgencyLabel } from './dates';

const DEPLOYED_AI_URL = '/api/ai';
const OLLAMA_CHAT_URL = '/ollama/api/chat';

function compactEvents(events) {
  return events.map((event) => ({
    name: event.name,
    date: formatDate(event.date),
    time: event.time || '',
    urgency: urgencyLabel(event.date),
    category: event.category,
    description: event.description || '',
  }));
}

function compactTasks(tasks) {
  return tasks.map((task) => ({
    name: task.name,
    date: task.date ? formatDate(task.date) : '',
    category: task.category,
    time: task.time || 'Any time',
    duration: task.duration || 'Flexible',
    frequency: task.frequency,
    completed: task.completed,
  }));
}

function compactGoals(goals = []) {
  return goals.map((goal) => ({
    title: goal.title,
    deadline: formatDate(goal.deadline),
    description: goal.description || '',
    updates: (goal.updates || []).map((update) => ({
      text: update.text,
      createdAt: formatDate(update.createdAt?.slice(0, 10)),
    })),
  }));
}

export function buildLifeOsContext({ events, tasks, goals, categories, completion }) {
  return {
    user: 'Rayene',
    currentDate: new Date().toLocaleDateString('en-GB', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }),
    completionPercentage: completion,
    savedCategories: categories || {},
    importantDates: compactEvents(events),
    tasks: compactTasks(tasks),
    goals: compactGoals(goals),
  };
}

export function buildSystemPrompt(context) {
  return `You are Althair, Rayene's personal organisation assistant.
Help with planning, deadlines, schedules, priorities, goals, and productivity.
Use the app context below as the source of truth. If the user asks about tasks, events, deadlines, completion, goals, or schedule planning, use this data directly.
Be concise, practical, and specific. Do not claim you changed app data unless the user explicitly does it in the UI.

Althair context:
${JSON.stringify(context, null, 2)}`;
}

function listItems(items, formatter, emptyText) {
  if (!items.length) return `- ${emptyText}`;
  return items.slice(0, 6).map(formatter).join('\n');
}

function deployedFallbackResponse(messages, context) {
  const latestMessage = messages.at(-1)?.content?.toLowerCase() || '';
  const upcomingDates = [...(context.importantDates || [])];
  const openTasks = (context.tasks || []).filter((task) => !task.completed);
  const completedTasks = (context.tasks || []).filter((task) => task.completed).length;
  const goals = context.goals || [];
  const wantsUpdate = /update|upcoming|task|date|deadline|schedule|today|week|priority|prioritise|prioritize|goal/.test(latestMessage);

  if (!wantsUpdate) {
    return `I cannot reach Gemma/Ollama from this deployed Vercel site yet.

To make it run here, expose Ollama with a private tunnel and set OLLAMA_BASE_URL in Vercel. I can still use your saved Althair data for quick planning summaries here.`;
  }

  return `Quick update for ${context.user}:

Important dates:
${listItems(
  upcomingDates,
  (event) => `- ${event.name} - ${event.date}${event.time ? ` at ${event.time}` : ''} (${event.urgency})`,
  'No important dates saved yet.',
)}

Open tasks:
${listItems(
  openTasks,
  (task) => `- ${task.name} - ${task.date ? `${task.date}, ` : ''}${task.time || 'Any time'} / ${task.frequency}`,
  'No open tasks saved yet.',
)}

Goals:
${listItems(
  goals,
  (goal) => `- ${goal.title} - due ${goal.deadline}`,
  'No goals saved yet.',
)}

Completion: ${context.completionPercentage}% (${completedTasks} completed task${completedTasks === 1 ? '' : 's'}).

For full Gemma responses on Vercel, set OLLAMA_BASE_URL to a secure public tunnel for your Ollama server.`;
}

function shouldTryFallback(errorOrStatus) {
  const status = typeof errorOrStatus === 'number' ? errorOrStatus : errorOrStatus?.status;
  return status === 404 || status === 405 || status === 503 || errorOrStatus instanceof TypeError;
}

async function requestChat(url, { model, messages, context }) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      stream: false,
      context,
      messages: [
        {
          role: 'system',
          content: buildSystemPrompt(context),
        },
        ...messages,
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    const error = new Error(detail || `Ollama request failed with ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return response.json();
}

export async function askOllama({ model, messages, context }) {
  try {
    const data = await requestChat(DEPLOYED_AI_URL, { model, messages, context });
    return data.message?.content?.trim() || data.content?.trim() || 'I could not generate a response.';
  } catch (error) {
    if (!shouldTryFallback(error)) throw error;
  }

  try {
    const data = await requestChat(OLLAMA_CHAT_URL, { model, messages, context });
    return data.message?.content?.trim() || data.content?.trim() || 'I could not generate a response.';
  } catch (error) {
    if (shouldTryFallback(error)) return deployedFallbackResponse(messages, context);
    throw error;
  }
}
