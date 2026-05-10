function buildSystemPrompt(context) {
  return `You are Althair, Rayene's personal organisation assistant.
Help with planning, deadlines, schedules, priorities, goals, and productivity.
Use the app context below as the source of truth. If the user asks about tasks, events, deadlines, completion, goals, or schedule planning, use this data directly.
Be concise, practical, and specific. Do not claim you changed app data unless the user explicitly does it in the UI.

Althair context:
${JSON.stringify(context, null, 2)}`;
}

function normaliseBaseUrl(url) {
  return String(url || '').replace(/\/+$/, '');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed.' });
  }

  const baseUrl = normaliseBaseUrl(process.env.OLLAMA_BASE_URL);
  if (!baseUrl) {
    return res.status(503).json({
      message: 'OLLAMA_BASE_URL is not configured.',
    });
  }

  const { model, messages = [], context = {}, stream = false } = req.body || {};
  const selectedModel = process.env.OLLAMA_MODEL || model || 'gemma3:latest';

  try {
    const response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.OLLAMA_API_KEY ? { Authorization: `Bearer ${process.env.OLLAMA_API_KEY}` } : {}),
      },
      body: JSON.stringify({
        model: selectedModel,
        stream,
        messages: [
          {
            role: 'system',
            content: buildSystemPrompt(context),
          },
          ...messages.filter((message) => message.role !== 'system'),
        ],
      }),
    });

    const detail = await response.text();
    if (!response.ok) {
      return res.status(response.status).send(detail || 'Ollama request failed.');
    }

    return res.status(200).send(detail);
  } catch (error) {
    return res.status(502).json({
      message: `Could not reach Ollama at ${baseUrl}.`,
      detail: error.message,
    });
  }
}
