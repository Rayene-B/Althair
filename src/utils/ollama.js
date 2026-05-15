import { daysUntil, formatDate, urgencyLabel } from './dates';

const DEPLOYED_AI_URL = '/api/ai';
const OLLAMA_CHAT_URL = '/ollama/api/chat';

function compactEvents(events) {
  return events
    .map((event) => {
      const daysLeft = daysUntil(event.date);
      return {
        name: event.name,
        date: formatDate(event.date),
        dateIso: event.date,
        time: event.time || '',
        daysLeft,
        status: daysLeft < 0 ? 'overdue' : 'upcoming',
        urgency: urgencyLabel(event.date),
        priority: daysLeft <= 3 ? 'urgent' : daysLeft <= 14 ? 'soon' : 'later',
        category: event.category,
        description: event.description || '',
      };
    })
    .sort((a, b) => a.daysLeft - b.daysLeft);
}

function compactTasks(tasks) {
  return tasks.map((task) => ({
    name: task.name,
    date: task.date ? formatDate(task.date) : '',
    dateIso: task.date || '',
    daysLeft: task.date ? daysUntil(task.date) : null,
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
  const importantDates = compactEvents(events);
  const scheduleTasks = compactTasks(tasks);

  return {
    user: 'Rayene',
    currentDate: new Date().toLocaleDateString('en-GB', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }),
    contextRules: {
      importantDatesMeaning: 'Important dates are event/deadline records from the Calendar & Dates section.',
      scheduleTasksMeaning: 'Schedule tasks are routine tasks from the Schedule/Timetable section.',
      dateQuestionRule:
        'If the user asks for important dates, urgent dates, upcoming dates, deadlines, or date updates, answer from importantDates only. Do not include scheduleTasks unless the user explicitly asks for tasks, schedule, timetable, routine, or chores.',
      upcomingRule: 'Upcoming means daysLeft is 0 or greater. Exclude overdue items unless the user explicitly asks for overdue items.',
      urgentRule: 'Urgent important dates are upcoming importantDates with priority "urgent" or daysLeft between 0 and 3 inclusive.',
      completenessRule: 'When listing urgent or upcoming important dates, include every matching important date from the provided context, not just examples.',
    },
    completionPercentage: completion,
    savedCategories: categories || {},
    importantDates,
    urgentUpcomingImportantDates: importantDates.filter((event) => event.daysLeft >= 0 && event.daysLeft <= 3),
    upcomingImportantDates: importantDates.filter((event) => event.daysLeft >= 0),
    overdueImportantDates: importantDates.filter((event) => event.daysLeft < 0),
    scheduleTasks,
    goals: compactGoals(goals),
  };
}

export function buildSystemPrompt(context) {
  return `You are Althair, Rayene's personal organisation assistant.
Help with planning, deadlines, schedules, priorities, goals, and productivity.
Use the app context below as the source of truth.

Data boundaries:
- "importantDates" are calendar/deadline records.
- "scheduleTasks" are routine timetable tasks.
- If the user asks for important dates, urgent dates, upcoming dates, deadlines, or date updates, answer from importantDates only.
- Do not include scheduleTasks in an important-date answer unless the user explicitly asks for tasks, schedule, timetable, or routine.
- Upcoming means daysLeft >= 0. Exclude overdue items unless the user asks for overdue items.
- Urgent means upcoming importantDates with daysLeft from 0 to 3 inclusive.
- Include all matching importantDates in the context. Do not silently leave matching dates out.

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
  const asksForTasks = /task|schedule|timetable|routine|chores?/.test(latestMessage);
  const asksForOverdue = /overdue|late|missed/.test(latestMessage);
  const asksForUrgentDates = /urgent|soon|priority|prioritise|prioritize/.test(latestMessage) && /date|deadline|event|upcoming/.test(latestMessage);
  const asksForDates = /date|deadline|event|upcoming/.test(latestMessage);
  const importantDates = asksForUrgentDates
    ? [...(context.urgentUpcomingImportantDates || [])]
    : [...(context.upcomingImportantDates || [])];
  const datesToList = asksForOverdue
    ? [...(context.overdueImportantDates || []), ...importantDates]
    : importantDates;
  const openTasks = (context.scheduleTasks || []).filter((task) => !task.completed);
  const completedTasks = (context.scheduleTasks || []).filter((task) => task.completed).length;
  const goals = context.goals || [];
  const wantsUpdate = /update|upcoming|task|date|deadline|schedule|today|week|priority|prioritise|prioritize|goal/.test(latestMessage);

  if (!wantsUpdate) {
    return `I cannot reach Gemma/Ollama from this deployed Vercel site yet.

To make it run here, expose Ollama with a private tunnel and set OLLAMA_BASE_URL in Vercel. I can still use your saved Althair data for quick planning summaries here.`;
  }

  if (asksForDates && !asksForTasks) {
    return `Important date update for ${context.user}:

Important dates:
${listItems(
  datesToList,
  (event) => `- ${event.name} - ${event.date}${event.time ? ` at ${event.time}` : ''} (${event.urgency})`,
  asksForUrgentDates ? 'No urgent upcoming important dates saved.' : 'No upcoming important dates saved.',
)}

Schedule tasks excluded because you asked about dates, not schedule tasks.`;
  }

  return `Quick update for ${context.user}:

Important dates:
${listItems(
  datesToList,
  (event) => `- ${event.name} - ${event.date}${event.time ? ` at ${event.time}` : ''} (${event.urgency})`,
  'No upcoming important dates saved.',
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
  return status === 404 || status === 405 || status === 502 || status === 503 || errorOrStatus instanceof TypeError;
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
