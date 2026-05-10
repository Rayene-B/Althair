import { formatDate, urgencyLabel } from './dates';

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
  return `You are Althair, Rayene's local personal organisation assistant.
You run locally through Ollama and should help with planning, deadlines, schedules, priorities, and productivity.
Use the app context below as the source of truth. If the user asks about tasks, events, deadlines, completion, or schedule planning, use this data directly.
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
  const wantsUpdate = /update|upcoming|task|date|deadline|schedule|today|week|priority|prioritise|prioritize/.test(latestMessage);

  if (!wantsUpdate) {
    return `I cannot reach your local Gemma/Ollama model from this deployed Vercel site, because Ollama only runs on your computer.

I can still use your saved Althair data for quick planning summaries here. Ask for an update on tasks, dates, deadlines, goals, or your schedule.`;
  }

  return `Quick update for ${context.user}:

Important dates:
${listItems(
  upcomingDates,
  (event) => `- ${event.name} — ${event.date}${event.time ? ` at ${event.time}` : ''} (${event.urgency})`,
  'No important dates saved yet.',
)}

Open tasks:
${listItems(
  openTasks,
  (task) => `- ${task.name} — ${task.date ? `${task.date}, ` : ''}${task.time || 'Any time'} / ${task.frequency}`,
  'No open tasks saved yet.',
)}

Goals:
${listItems(
  goals,
  (goal) => `- ${goal.title} — due ${goal.deadline}`,
  'No goals saved yet.',
)}

Completion: ${context.completionPercentage}% (${completedTasks} completed task${completedTasks === 1 ? '' : 's'}).

For full Gemma responses, run Althair locally with Ollama running. On Vercel, this fallback can summarize your saved planner data but cannot call your computer's local model.`;
}

function shouldUseDeployedFallback(errorOrStatus) {
  const status = typeof errorOrStatus === 'number' ? errorOrStatus : errorOrStatus?.status;
  return status === 404 || status === 405 || errorOrStatus instanceof TypeError;
}

export async function askOllama({ model, messages, context }) {
  let response;
  try {
    response = await fetch(OLLAMA_CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        stream: false,
        messages: [
          {
            role: 'system',
            content: buildSystemPrompt(context),
          },
          ...messages,
        ],
      }),
    });
  } catch (error) {
    if (shouldUseDeployedFallback(error)) return deployedFallbackResponse(messages, context);
    throw error;
  }

  if (!response.ok) {
    const detail = await response.text();
    if (shouldUseDeployedFallback(response.status)) return deployedFallbackResponse(messages, context);
    throw new Error(detail || `Ollama request failed with ${response.status}`);
  }

  const data = await response.json();
  return data.message?.content?.trim() || 'I could not generate a response.';
}
