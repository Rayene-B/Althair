# Althair

Althair is a local-first personal organisation dashboard built with React, Vite, and Tailwind CSS.

## Features

- Calendar and important dates
- Schedule and task completion tracking
- Goals with deadlines, progress bars, and dated updates
- Local account login backed by a JSON database
- Local Ollama/Gemma assistant through the dashboard ask bar

## Run Locally

Install dependencies:

```bash
npm install
```

Start the app and local API:

```bash
npm run dev
```

If Windows PowerShell cannot find `npm`, use:

```powershell
$env:Path = 'C:\Program Files\nodejs;' + $env:Path
& 'C:\Program Files\nodejs\npm.cmd' run dev
```

The app runs at `http://127.0.0.1:5173`.

## Local Data

User accounts and app data are stored locally in `server/data/`. That folder is ignored by Git so private local data is not uploaded.

## Gemma/Ollama on Vercel

The deployed Vercel app cannot call `localhost` on your computer. To use your local Gemma model from the deployed site, expose Ollama through a secure tunnel and add this Vercel environment variable:

```text
OLLAMA_BASE_URL=https://your-tunnel-url
```

Optional:

```text
OLLAMA_MODEL=gemma3:latest
OLLAMA_API_KEY=your-tunnel-auth-token
```

Without `OLLAMA_BASE_URL`, the app uses a built-in planning summary fallback.
