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
