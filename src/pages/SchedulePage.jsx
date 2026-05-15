import { useState } from 'react';
import Button from '../components/Button';
import Card from '../components/Card';
import FormField from '../components/FormField';
import SelectInput from '../components/SelectInput';
import TaskCard from '../components/TaskCard';
import TextInput from '../components/TextInput';
import { categoryOptionsFrom } from '../utils/categories';

const emptyTask = {
  name: '',
  date: '',
  category: 'Work',
  time: '',
  duration: '',
  frequency: 'Daily',
};

export default function SchedulePage({ tasks, addTask, toggleTask, updateTask, completion, onNavigate, categories }) {
  const [form, setForm] = useState(emptyTask);
  const [view, setView] = useState('Weekly');
  const categoryOptions = categoryOptionsFrom(categories);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function submit(event) {
    event.preventDefault();
    if (!form.name.trim()) return;
    addTask({ ...form, name: form.name.trim() });
    setForm(emptyTask);
  }

  const completeCount = tasks.filter((task) => task.completed).length;

  return (
    <div className="space-y-6">
      <Card className="dashboard-hero px-7 py-6">
        <p className="text-xs uppercase tracking-[0.22em] text-cyan-200/75">Task orbit</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Schedule / Timetable</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-white/62">
          Build your routine, switch planning views, and track completion without leaving the timetable.
        </p>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[280px_1fr_360px]">
      <Card title="Create New Task" className="surface-card min-h-[680px]">
        <form onSubmit={submit} className="space-y-4">
          <FormField label="Name">
            <TextInput value={form.name} onChange={(event) => updateField('name', event.target.value)} placeholder="Task name" />
          </FormField>
          <FormField label="Category">
            <SelectInput value={form.category} onChange={(event) => updateField('category', event.target.value)}>
              {categoryOptions.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </SelectInput>
          </FormField>
          <FormField label="Date optional">
            <TextInput type="date" value={form.date} onChange={(event) => updateField('date', event.target.value)} />
          </FormField>
          <FormField label="Time">
            <TextInput type="time" value={form.time} onChange={(event) => updateField('time', event.target.value)} />
          </FormField>
          <FormField label="Duration">
            <TextInput value={form.duration} onChange={(event) => updateField('duration', event.target.value)} placeholder="45 min" />
          </FormField>
          <FormField label="Frequency">
            <SelectInput value={form.frequency} onChange={(event) => updateField('frequency', event.target.value)}>
              <option>Daily</option>
              <option>Weekly</option>
              <option>Monthly</option>
            </SelectInput>
          </FormField>
          <Button type="submit" className="w-full">
            Add task
          </Button>
        </form>

        <div className="mt-8 space-y-3 rounded-[8px] border border-white/8 bg-slate-950/34 p-4">
          {['Daily', 'Weekly', 'Monthly'].map((option) => (
            <Button
              key={option}
              type="button"
              variant={view === option ? 'active' : 'ghost'}
              onClick={() => setView(option)}
              className="w-full"
            >
              {option} View
            </Button>
          ))}
        </div>
      </Card>

      <Card title="Schedule/Timetable" className="surface-card min-h-[680px]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <span className="text-sm text-white/62">{view} view</span>
          <span className="rounded-full bg-ion/10 px-3 py-1 text-xs text-ion">{tasks.length} tasks</span>
        </div>
        <div className="thin-scrollbar max-h-[570px] space-y-3 overflow-auto rounded-[8px] border border-white/8 bg-slate-950/34 p-3 pr-2">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onToggle={toggleTask}
              onUpdate={updateTask}
              categories={categories}
              categoryOptions={categoryOptions}
            />
          ))}
        </div>
      </Card>

      <div className="space-y-6">
        <Card title="Tasks Complete" className="surface-card min-h-[320px]">
          <div className="grid h-48 place-items-center rounded-[8px] border border-emerald-300/16 bg-emerald-300/[0.09]">
            <div className="text-center">
              <p className="text-5xl font-semibold text-white">{completion}%</p>
              <p className="mt-2 text-sm text-white/60">
                {completeCount} of {tasks.length} complete
              </p>
            </div>
          </div>
        </Card>

        <Card
          title="Performance Analytics"
          className="surface-card min-h-[334px]"
          action={<Button onClick={() => onNavigate('analytics')} variant="ghost">Open</Button>}
        >
          <div className="space-y-4 rounded-[8px] border border-cyan-200/14 bg-slate-950/36 p-5">
            <div className="h-3 overflow-hidden rounded-full bg-void/80">
              <div className="h-full rounded-full bg-ion shadow-glow" style={{ width: `${completion}%` }} />
            </div>
            <p className="text-sm text-white/62">Your current completion rate is based on all stored tasks.</p>
          </div>
        </Card>
      </div>
      </div>
    </div>
  );
}
