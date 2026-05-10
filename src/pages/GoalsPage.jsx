import { useMemo, useState } from 'react';
import { ChevronDown, PenLine, Target } from 'lucide-react';
import Button from '../components/Button';
import Card from '../components/Card';
import FormField from '../components/FormField';
import TextArea from '../components/TextArea';
import TextInput from '../components/TextInput';
import { formatDate, todayIso } from '../utils/dates';

const emptyGoal = {
  title: '',
  deadline: todayIso(),
  description: '',
};

const goalGradients = [
  'from-cyan-300 via-blue-300 to-violet-300',
  'from-emerald-300 via-teal-300 to-cyan-300',
  'from-fuchsia-300 via-rose-300 to-amber-300',
  'from-lime-300 via-emerald-300 to-sky-300',
  'from-indigo-300 via-purple-300 to-pink-300',
  'from-amber-300 via-orange-300 to-red-300',
];

function monthsUntil(deadline) {
  const now = new Date();
  const end = new Date(`${deadline}T12:00:00`);
  return (end.getFullYear() - now.getFullYear()) * 12 + (end.getMonth() - now.getMonth());
}

function progressForGoal(goal) {
  const start = new Date(goal.createdAt || new Date().toISOString()).getTime();
  const end = new Date(`${goal.deadline}T23:59:59`).getTime();
  const now = Date.now();
  if (end <= start) return 100;
  return Math.min(100, Math.max(0, Math.round(((now - start) / (end - start)) * 100)));
}

function daysToDeadline(deadline) {
  const today = new Date(`${todayIso()}T00:00:00`).getTime();
  const end = new Date(`${deadline}T00:00:00`).getTime();
  return Math.ceil((end - today) / 86400000);
}

function GoalTimeline({ goals }) {
  const sortedGoals = [...goals].sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

  return (
    <Card title="Deadline timeline" className="surface-card">
      {sortedGoals.length ? (
        <div className="space-y-5">
          {sortedGoals.map((goal, index) => {
            const progress = progressForGoal(goal);
            const daysLeft = daysToDeadline(goal.deadline);
            const gradient = goalGradients[index % goalGradients.length];

            return (
              <div key={goal.id} className="rounded-[8px] border border-white/8 bg-slate-950/36 p-4">
                <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-white">{goal.title}</h3>
                    <p className="mt-1 text-xs text-white/52">Due {formatDate(goal.deadline)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-white">{progress}%</p>
                    <p className="text-xs text-cyan-100/62">
                      {daysLeft < 0 ? `${Math.abs(daysLeft)} days overdue` : `${daysLeft} days left`}
                    </p>
                  </div>
                </div>

                <div className="relative h-5 overflow-hidden rounded-full border border-white/10 bg-slate-950/72 shadow-inner">
                  <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[length:8.333%_100%] opacity-35" />
                  <div
                    className={`relative h-full rounded-full bg-gradient-to-r ${gradient} shadow-[0_0_24px_rgba(125,211,252,0.26)] transition-all duration-500`}
                    style={{ width: `${progress}%` }}
                  />
                  <div
                    className="absolute top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/40 bg-white/90 shadow-[0_0_24px_rgba(255,255,255,0.24)]"
                    style={{ left: `${progress}%` }}
                    aria-hidden="true"
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="rounded-[8px] border border-white/8 bg-slate-950/34 p-5 text-sm text-white/58">
          Create a goal to see its time-to-deadline progress here.
        </p>
      )}
    </Card>
  );
}

function GoalCard({ goal, onEdit, onAddUpdate, onUpdateUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const [updateText, setUpdateText] = useState('');
  const [editingUpdateId, setEditingUpdateId] = useState('');
  const [editingUpdateText, setEditingUpdateText] = useState('');
  const progress = progressForGoal(goal);

  function submitUpdate(event) {
    event.preventDefault();
    onAddUpdate(goal.id, updateText);
    setUpdateText('');
  }

  function beginEditUpdate(update) {
    setEditingUpdateId(update.id);
    setEditingUpdateText(update.text);
  }

  function submitUpdateEdit(event) {
    event.preventDefault();
    onUpdateUpdate(goal.id, editingUpdateId, editingUpdateText);
    setEditingUpdateId('');
    setEditingUpdateText('');
  }

  return (
    <article className="rounded-[8px] border border-white/8 bg-slate-950/36 p-4">
      <button type="button" onClick={() => setExpanded((current) => !current)} className="w-full text-left">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="truncate text-lg font-semibold text-white">{goal.title}</h3>
            <p className="mt-1 text-sm text-white/56">Due {formatDate(goal.deadline)}</p>
          </div>
          <ChevronDown size={18} className={`mt-1 shrink-0 text-cyan-100 transition ${expanded ? 'rotate-180' : ''}`} />
        </div>
        <p className="mt-3 line-clamp-2 text-sm leading-6 text-white/62">{goal.description || 'No description yet.'}</p>
        <div className="mt-4">
          <div className="mb-2 flex justify-between text-xs text-white/50">
            <span>Time progress</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/8">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-300 via-cyan-300 to-amber-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </button>

      {expanded && (
        <div className="mt-5 space-y-4 border-t border-white/8 pt-4">
          <div className="flex justify-end">
            <Button type="button" variant="ghost" onClick={() => onEdit(goal)} className="flex items-center gap-2">
              <PenLine size={15} />
              Edit goal
            </Button>
          </div>
          <form onSubmit={submitUpdate} className="space-y-3">
            <TextArea
              value={updateText}
              onChange={(event) => setUpdateText(event.target.value)}
              placeholder="Add a sentence about this goal..."
              className="min-h-20"
            />
            <Button type="submit" disabled={!updateText.trim()} className="disabled:cursor-not-allowed disabled:opacity-50">
              Save sentence
            </Button>
          </form>
          <div className="space-y-3">
            {(goal.updates || []).slice().reverse().map((update) => (
              <div key={update.id} className="rounded-[8px] border border-white/8 bg-white/[0.04] p-3">
                {editingUpdateId === update.id ? (
                  <form onSubmit={submitUpdateEdit} className="space-y-3">
                    <TextArea
                      value={editingUpdateText}
                      onChange={(event) => setEditingUpdateText(event.target.value)}
                      className="min-h-20"
                    />
                    <div className="flex gap-2">
                      <Button type="submit" disabled={!editingUpdateText.trim()} className="disabled:cursor-not-allowed disabled:opacity-50">
                        Save sentence
                      </Button>
                      <Button type="button" variant="ghost" onClick={() => setEditingUpdateId('')}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <>
                    <p className="text-sm leading-6 text-white/72">{update.text}</p>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <p className="text-xs text-cyan-100/60">{formatDate(update.createdAt.slice(0, 10))}</p>
                      <button
                        type="button"
                        onClick={() => beginEditUpdate(update)}
                        className="text-xs text-white/48 transition hover:text-cyan-100"
                      >
                        Edit
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}

function GoalSection({ title, goals, onEdit, onAddUpdate, onUpdateUpdate }) {
  return (
    <Card title={title} className="surface-card">
      <div className="space-y-4">
        {goals.length ? (
          goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onEdit={onEdit}
              onAddUpdate={onAddUpdate}
              onUpdateUpdate={onUpdateUpdate}
            />
          ))
        ) : (
          <p className="rounded-[8px] border border-white/8 bg-slate-950/34 p-5 text-sm text-white/58">No goals here yet.</p>
        )}
      </div>
    </Card>
  );
}

export default function GoalsPage({ goals, addGoal, updateGoal, addGoalUpdate, updateGoalUpdate }) {
  const [form, setForm] = useState(emptyGoal);
  const [editingId, setEditingId] = useState('');

  const groupedGoals = useMemo(() => {
    const sorted = [...goals].sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
    return {
      shortTerm: sorted.filter((goal) => monthsUntil(goal.deadline) <= 12),
      longTerm: sorted.filter((goal) => monthsUntil(goal.deadline) > 12),
    };
  }, [goals]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function resetForm() {
    setForm(emptyGoal);
    setEditingId('');
  }

  function editGoal(goal) {
    setEditingId(goal.id);
    setForm({
      title: goal.title,
      deadline: goal.deadline,
      description: goal.description || '',
    });
  }

  function submit(event) {
    event.preventDefault();
    if (!form.title.trim() || !form.deadline) return;

    if (editingId) {
      const existing = goals.find((goal) => goal.id === editingId);
      updateGoal({ ...existing, ...form, title: form.title.trim() });
    } else {
      addGoal({ ...form, title: form.title.trim() });
    }
    resetForm();
  }

  return (
    <div className="space-y-6">
      <Card className="dashboard-hero px-7 py-6">
        <p className="text-xs uppercase tracking-[0.22em] text-cyan-200/75">Goal trajectory</p>
        <h1 className="mt-2 flex items-center gap-3 text-3xl font-semibold text-white">
          <Target className="text-cyan-100" size={28} />
          Goals
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-white/62">
          Create goals, track deadline progress, and save dated notes as your thinking evolves.
        </p>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <Card title={editingId ? 'Edit goal' : 'Create goal'} className="surface-card">
          <form onSubmit={submit} className="space-y-4">
            <FormField label="Goal">
              <TextInput value={form.title} onChange={(event) => updateField('title', event.target.value)} placeholder="Build portfolio, finish course..." />
            </FormField>
            <FormField label="Deadline">
              <TextInput type="date" value={form.deadline} onChange={(event) => updateField('deadline', event.target.value)} />
            </FormField>
            <FormField label="Description">
              <TextArea value={form.description} onChange={(event) => updateField('description', event.target.value)} placeholder="Why this matters, what success looks like..." />
            </FormField>
            <div className="flex gap-3">
              {editingId && (
                <Button type="button" variant="ghost" onClick={resetForm} className="flex-1">
                  Cancel
                </Button>
              )}
              <Button type="submit" className="flex-1">
                {editingId ? 'Save goal' : 'Create goal'}
              </Button>
            </div>
          </form>
        </Card>

        <div className="grid gap-6 2xl:grid-cols-2">
          <GoalSection
            title="Short-term goals"
            goals={groupedGoals.shortTerm}
            onEdit={editGoal}
            onAddUpdate={addGoalUpdate}
            onUpdateUpdate={updateGoalUpdate}
          />
          <GoalSection
            title="Long-term goals"
            goals={groupedGoals.longTerm}
            onEdit={editGoal}
            onAddUpdate={addGoalUpdate}
            onUpdateUpdate={updateGoalUpdate}
          />
        </div>
      </div>

      <GoalTimeline goals={goals} />
    </div>
  );
}
