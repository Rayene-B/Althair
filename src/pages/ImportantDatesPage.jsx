import { useState } from 'react';
import Button from '../components/Button';
import Card from '../components/Card';
import CategoryManager from '../components/CategoryManager';
import EventCard from '../components/EventCard';
import FormField from '../components/FormField';
import SelectInput from '../components/SelectInput';
import TextArea from '../components/TextArea';
import TextInput from '../components/TextInput';
import { categoryOptionsFrom } from '../utils/categories';
import { todayIso } from '../utils/dates';

const emptyEvent = {
  name: '',
  date: todayIso(),
  category: 'Personal',
  description: '',
};

export default function ImportantDatesPage({ events, addEvent, categories, addCategory, removeCategory }) {
  const [form, setForm] = useState(emptyEvent);
  const categoryOptions = categoryOptionsFrom(categories);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function submit(event) {
    event.preventDefault();
    if (!form.name.trim() || !form.date) return;
    addEvent({ ...form, name: form.name.trim() });
    setForm(emptyEvent);
  }

  return (
    <div className="space-y-6">
      <Card className="dashboard-hero px-7 py-6">
        <p className="text-xs uppercase tracking-[0.22em] text-cyan-200/75">Deadline radar</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Important Upcoming Dates</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-white/62">
          Create dates and let Althair sort them by proximity and priority.
        </p>
      </Card>
      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <Card title="Create new date/event" className="surface-card min-h-[560px]">
          <form onSubmit={submit} className="space-y-4">
            <FormField label="Name">
              <TextInput value={form.name} onChange={(event) => updateField('name', event.target.value)} placeholder="Exam, meeting, birthday..." />
            </FormField>
            <FormField label="Date">
              <TextInput type="date" value={form.date} onChange={(event) => updateField('date', event.target.value)} />
            </FormField>
            <FormField label="Category">
              <SelectInput value={form.category} onChange={(event) => updateField('category', event.target.value)}>
                {categoryOptions.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </SelectInput>
            </FormField>
            <FormField label="Saved categories">
              <CategoryManager
                categories={categories}
                selectedCategory={form.category}
                onSelectCategory={(category) => updateField('category', category)}
                onAddCategory={addCategory}
                onRemoveCategory={removeCategory}
              />
            </FormField>
            <FormField label="Description">
              <TextArea value={form.description} onChange={(event) => updateField('description', event.target.value)} placeholder="Optional context" />
            </FormField>
            <Button type="submit" className="w-full">
              Add event
            </Button>
          </form>
        </Card>

        <Card title="Events displayed by urgency of deadline/date" className="surface-card min-h-[560px]">
          <div className="thin-scrollbar grid max-h-[476px] gap-3 overflow-auto pr-1">
            {events.map((event) => (
              <EventCard key={event.id} event={event} categories={categories} />
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
