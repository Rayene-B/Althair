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

export async function askOllama({ model, messages, context }) {
  const response = await fetch(OLLAMA_CHAT_URL, {
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

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Ollama request failed with ${response.status}`);
  }

  const data = await response.json();
  return data.message?.content?.trim() || 'I could not generate a response.';
}
