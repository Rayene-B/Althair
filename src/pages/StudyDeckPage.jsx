import { useEffect, useMemo, useState } from 'react';
import { Check, Pause, Play, Plus, RotateCcw, TimerReset } from 'lucide-react';
import Button from '../components/Button';
import Card from '../components/Card';
import TextInput from '../components/TextInput';

function clampMinutes(value, fallback) {
  const minutes = Number(value);
  if (!Number.isFinite(minutes)) return fallback;
  return Math.min(Math.max(Math.round(minutes), 1), 180);
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export default function StudyDeckPage({ studyDeck, setStudyDeck }) {
  const [activeTab, setActiveTab] = useState('pomodoro');
  const [activeTaskId, setActiveTaskId] = useState(studyDeck.tasks[0]?.id || '');
  const [taskName, setTaskName] = useState('');
  const [mode, setMode] = useState('study');
  const [isRunning, setIsRunning] = useState(false);

  const settings = studyDeck.settings || { studyMinutes: 25, breakMinutes: 5 };
  const studySeconds = clampMinutes(settings.studyMinutes, 25) * 60;
  const breakSeconds = clampMinutes(settings.breakMinutes, 5) * 60;
  const [secondsLeft, setSecondsLeft] = useState(studySeconds);

  const activeTask = useMemo(
    () => studyDeck.tasks.find((task) => task.id === activeTaskId) || studyDeck.tasks[0],
    [activeTaskId, studyDeck.tasks],
  );

  const completedPomodoros = studyDeck.tasks.reduce((total, task) => total + (Number(task.pomodoros) || 0), 0);
  const activePomodoros = Number(activeTask?.pomodoros) || 0;
  const duration = mode === 'study' ? studySeconds : breakSeconds;
  const progress = duration ? ((duration - secondsLeft) / duration) * 100 : 0;

  useEffect(() => {
    if (!activeTask && studyDeck.tasks[0]) {
      setActiveTaskId(studyDeck.tasks[0].id);
    }
  }, [activeTask, studyDeck.tasks]);

  useEffect(() => {
    if (isRunning) return;
    setSecondsLeft(mode === 'study' ? studySeconds : breakSeconds);
  }, [breakSeconds, isRunning, mode, studySeconds]);

  function updateSettings(field, value) {
    setStudyDeck((current) => ({
      ...current,
      settings: {
        ...(current.settings || {}),
        [field]: clampMinutes(value, field === 'studyMinutes' ? 25 : 5),
      },
    }));
  }

  function addTask(event) {
    event.preventDefault();
    const title = taskName.trim();
    if (!title) return;

    const task = {
      id: crypto.randomUUID(),
      title,
      pomodoros: 0,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    setStudyDeck((current) => ({
      ...current,
      tasks: [task, ...(current.tasks || [])],
    }));
    setActiveTaskId(task.id);
    setTaskName('');
    setMode('study');
    setSecondsLeft(studySeconds);
    setIsRunning(false);
  }

  function selectTask(taskId, shouldStart = true) {
    setActiveTaskId(taskId);
    setMode('study');
    setSecondsLeft(studySeconds);
    setIsRunning(shouldStart);
  }

  function completeStudyPomodoro() {
    if (!activeTask) return;
    const completedAt = new Date();
    const startedAt = new Date(completedAt.getTime() - studySeconds * 1000);
    const session = {
      id: crypto.randomUUID(),
      taskId: activeTask.id,
      taskTitle: activeTask.title,
      startedAt: startedAt.toISOString(),
      completedAt: completedAt.toISOString(),
      studyMinutes: clampMinutes(settings.studyMinutes, 25),
    };

    setStudyDeck((current) => ({
      ...current,
      tasks: (current.tasks || []).map((task) =>
        task.id === activeTask.id ? { ...task, pomodoros: (Number(task.pomodoros) || 0) + 1 } : task,
      ),
      sessions: [session, ...(current.sessions || [])],
    }));
  }

  function toggleTaskComplete(taskId) {
    setStudyDeck((current) => ({
      ...current,
      tasks: (current.tasks || []).map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task,
      ),
    }));
  }

  function resetTimer() {
    setIsRunning(false);
    setMode('study');
    setSecondsLeft(studySeconds);
  }

  useEffect(() => {
    if (!isRunning) return undefined;
    const interval = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current > 1) return current - 1;

        if (mode === 'study') {
          completeStudyPomodoro();
          setMode('break');
          return breakSeconds;
        }

        setMode('study');
        return studySeconds;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [breakSeconds, isRunning, mode, studySeconds]);

  return (
    <div className="space-y-6">
      <Card className="dashboard-hero px-7 py-6">
        <p className="text-xs uppercase tracking-[0.22em] text-cyan-200/75">Study deck</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Pomodoro Focus</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-white/62">
          Select a study task, run focused sessions, and keep study-only minutes ready for analytics.
        </p>
      </Card>

      <div className="flex gap-2 overflow-x-auto rounded-[8px] border border-white/8 bg-orbit/80 p-2 shadow-card">
        <Button
          variant={activeTab === 'pomodoro' ? 'active' : 'ghost'}
          onClick={() => setActiveTab('pomodoro')}
          className="inline-flex items-center gap-2"
        >
          <TimerReset size={16} />
          Pomodoro
        </Button>
      </div>

      {activeTab === 'pomodoro' && (
        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <Card className="surface-card min-h-[620px]">
            <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
              <div className="flex min-h-[520px] flex-col items-center justify-center text-center">
                <div className="mb-6 inline-flex rounded-[8px] border border-white/10 bg-slate-950/42 p-1">
                  {['study', 'break'].map((item) => (
                    <button
                      key={item}
                      onClick={() => {
                        setMode(item);
                        setIsRunning(false);
                        setSecondsLeft(item === 'study' ? studySeconds : breakSeconds);
                      }}
                      className={`rounded-[8px] px-4 py-2 text-sm font-medium capitalize transition ${
                        mode === item ? 'bg-ion/18 text-ion' : 'text-white/58 hover:bg-white/7 hover:text-white'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>

                <div
                  className="grid h-72 w-72 place-items-center rounded-full border border-cyan-200/18 bg-slate-950/50 shadow-glow"
                  style={{
                    background: `conic-gradient(rgba(98, 215, 255, 0.58) ${progress}%, rgba(255, 255, 255, 0.07) 0)`,
                  }}
                >
                  <div className="grid h-[16.5rem] w-[16.5rem] place-items-center rounded-full bg-[#09071f]">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-white/48">{mode} timer</p>
                      <p className="mt-3 text-6xl font-semibold text-white">{formatTime(secondsLeft)}</p>
                      <p className="mt-3 max-w-52 truncate text-sm text-white/58">
                        {activeTask?.title || 'Add a task to begin'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex flex-wrap justify-center gap-3">
                  <Button
                    onClick={() => activeTask && setIsRunning((current) => !current)}
                    disabled={!activeTask}
                    className="inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {isRunning ? <Pause size={16} /> : <Play size={16} />}
                    {isRunning ? 'Pause' : 'Start'}
                  </Button>
                  <Button variant="ghost" onClick={resetTimer} className="inline-flex items-center gap-2">
                    <RotateCcw size={16} />
                    Reset
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-[8px] border border-white/10 bg-slate-950/34 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-ion/65">Session lengths</p>
                  <div className="mt-4 grid gap-3">
                    <label className="block text-sm text-white/68">
                      Study minutes
                      <TextInput
                        type="number"
                        min="1"
                        max="180"
                        value={settings.studyMinutes}
                        onChange={(event) => updateSettings('studyMinutes', event.target.value)}
                        className="mt-2"
                      />
                    </label>
                    <label className="block text-sm text-white/68">
                      Break minutes
                      <TextInput
                        type="number"
                        min="1"
                        max="180"
                        value={settings.breakMinutes}
                        onChange={(event) => updateSettings('breakMinutes', event.target.value)}
                        className="mt-2"
                      />
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-[8px] border border-emerald-300/16 bg-emerald-300/[0.09] p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-emerald-100/62">Total</p>
                    <p className="mt-2 text-3xl font-semibold text-white">{completedPomodoros}</p>
                  </div>
                  <div className="rounded-[8px] border border-cyan-200/16 bg-cyan-300/[0.08] p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-cyan-100/62">Selected</p>
                    <p className="mt-2 text-3xl font-semibold text-white">{activePomodoros}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card title="Tasks" className="surface-card min-h-[620px]">
            <form onSubmit={addTask} className="flex gap-2">
              <TextInput
                value={taskName}
                onChange={(event) => setTaskName(event.target.value)}
                placeholder="Add a study task"
              />
              <Button className="grid aspect-square place-items-center px-3" aria-label="Add task">
                <Plus size={17} />
              </Button>
            </form>

            <div className="thin-scrollbar mt-5 max-h-[490px] space-y-3 overflow-y-auto pr-1">
              {studyDeck.tasks.length === 0 && (
                <div className="rounded-[8px] border border-dashed border-white/12 p-5 text-sm leading-6 text-white/58">
                  Add your first task, then select it to start a pomodoro.
                </div>
              )}

              {studyDeck.tasks.map((task) => {
                const active = task.id === activeTask?.id;
                return (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => selectTask(task.id)}
                    className={`w-full rounded-[8px] border p-4 text-left transition ${
                      active
                        ? 'border-ion/35 bg-ion/12 text-white'
                        : 'border-white/8 bg-slate-950/30 text-white/76 hover:border-white/16 hover:bg-white/7'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className={`truncate text-sm font-medium ${task.completed ? 'text-white/42 line-through' : ''}`}>
                          {task.title}
                        </p>
                        <p className="mt-2 text-xs text-white/48">{Number(task.pomodoros) || 0} pomodoros completed</p>
                      </div>
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(event) => {
                          event.stopPropagation();
                          toggleTaskComplete(task.id);
                        }}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            event.stopPropagation();
                            toggleTaskComplete(task.id);
                          }
                        }}
                        className={`grid h-7 w-7 shrink-0 place-items-center rounded-[8px] border ${
                          task.completed ? 'border-emerald-300/35 bg-emerald-300/18 text-emerald-100' : 'border-white/12 text-white/38'
                        }`}
                        aria-label={`Mark ${task.title} complete`}
                      >
                        {task.completed && <Check size={15} />}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
