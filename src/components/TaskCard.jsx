import { Check, Pencil, Save, X } from 'lucide-react';
import { useState } from 'react';
import { categoryColor } from '../utils/categories';
import { formatDate } from '../utils/dates';
import Button from './Button';
import FormField from './FormField';
import SelectInput from './SelectInput';
import TextInput from './TextInput';

export default function TaskCard({ task, onToggle, onUpdate, categories, categoryOptions = [] }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task);

  function startEditing() {
    setDraft(task);
    setEditing(true);
  }

  function updateField(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function submit(event) {
    event.preventDefault();
    if (!draft.name.trim()) return;
    onUpdate(draft);
    setEditing(false);
  }

  if (editing) {
    return (
      <form onSubmit={submit} className="rounded-[8px] border border-ion/25 bg-void/65 p-4 shadow-glow">
        <div className="grid gap-3 md:grid-cols-2">
          <FormField label="Name">
            <TextInput value={draft.name} onChange={(event) => updateField('name', event.target.value)} />
          </FormField>
          <FormField label="Category">
            <SelectInput value={draft.category} onChange={(event) => updateField('category', event.target.value)}>
              {categoryOptions.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </SelectInput>
          </FormField>
          <FormField label="Date optional">
            <TextInput type="date" value={draft.date || ''} onChange={(event) => updateField('date', event.target.value)} />
          </FormField>
          <FormField label="Time">
            <TextInput type="time" value={draft.time || ''} onChange={(event) => updateField('time', event.target.value)} />
          </FormField>
          <FormField label="Duration">
            <TextInput value={draft.duration || ''} onChange={(event) => updateField('duration', event.target.value)} />
          </FormField>
          <FormField label="Frequency">
            <SelectInput value={draft.frequency || 'Daily'} onChange={(event) => updateField('frequency', event.target.value)}>
              <option>Daily</option>
              <option>Weekly</option>
              <option>Monthly</option>
            </SelectInput>
          </FormField>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => setEditing(false)} className="inline-flex items-center gap-2">
            <X size={16} />
            Cancel
          </Button>
          <Button type="submit" className="inline-flex items-center gap-2">
            <Save size={16} />
            Save
          </Button>
        </div>
      </form>
    );
  }

  return (
    <article className="flex items-center gap-4 rounded-[8px] border border-white/8 bg-void/55 p-4 shadow-glow">
      <button
        onClick={() => onToggle(task.id)}
        aria-label={`Mark ${task.name} ${task.completed ? 'incomplete' : 'complete'}`}
        className={`grid h-10 w-10 shrink-0 place-items-center rounded-[8px] border transition ${
          task.completed ? 'border-ion/60 bg-ion/18 text-ion' : 'border-white/15 bg-white/6 text-transparent hover:text-white/50'
        }`}
      >
        <Check size={18} />
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className={`text-sm font-semibold ${task.completed ? 'text-white/48 line-through' : 'text-white'}`}>
            {task.name}
          </h3>
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: categoryColor(task.category, categories) }} />
        </div>
        <p className="mt-1 text-xs text-white/58">
          {task.date ? `${formatDate(task.date)} / ` : ''}
          {task.time || 'Any time'} / {task.duration || 'Flexible'} / {task.frequency}
        </p>
      </div>
      <button
        type="button"
        onClick={startEditing}
        aria-label={`Edit ${task.name}`}
        className="grid h-10 w-10 shrink-0 place-items-center rounded-[8px] border border-white/12 bg-white/6 text-white/58 transition hover:border-ion/35 hover:bg-ion/12 hover:text-ion"
      >
        <Pencil size={17} />
      </button>
    </article>
  );
}
