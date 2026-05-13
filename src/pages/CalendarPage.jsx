import { X } from 'lucide-react';
import { useState } from 'react';
import Button from '../components/Button';
import CalendarGrid from '../components/CalendarGrid';
import Card from '../components/Card';
import CategoryManager from '../components/CategoryManager';
import EventCard from '../components/EventCard';
import FormField from '../components/FormField';
import SelectInput from '../components/SelectInput';
import SidebarPanel from '../components/SidebarPanel';
import TaskCard from '../components/TaskCard';
import TextArea from '../components/TextArea';
import TextInput from '../components/TextInput';
import { categoryOptionsFrom } from '../utils/categories';
import { daysUntil, formatDate } from '../utils/dates';

function emptyCalendarEvent(date = '') {
  return {
    name: '',
    date,
    time: '',
    category: 'Personal',
    description: '',
  };
}

export default function CalendarPage({ events, tasks, addEvent, updateEvent, removeEvent, moveEvent, toggleTask, categories, addCategory, removeCategory }) {
  const [selectedDate, setSelectedDate] = useState('');
  const [dayDetailDate, setDayDetailDate] = useState('');
  const [editingEventId, setEditingEventId] = useState('');
  const [form, setForm] = useState(emptyCalendarEvent());
  const categoryOptions = categoryOptionsFrom(categories);
  const isEditing = Boolean(editingEventId);
  const upcomingEvents = events.filter((event) => daysUntil(event.date) >= 0);
  const passedEvents = events.filter((event) => daysUntil(event.date) < 0);

  function openCreateEvent(date) {
    setSelectedDate(date);
    setEditingEventId('');
    setForm(emptyCalendarEvent(date));
  }

  function openEditEvent(event) {
    setSelectedDate(event.date);
    setEditingEventId(event.id);
    setForm({
      name: event.name || '',
      date: event.date || '',
      time: event.time || '',
      category: event.category || 'Personal',
      description: event.description || '',
    });
  }

  function closeCreateEvent() {
    setSelectedDate('');
    setEditingEventId('');
    setForm(emptyCalendarEvent());
  }

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function submit(event) {
    event.preventDefault();
    if (!form.name.trim() || !form.date) return;
    if (isEditing) {
      updateEvent({ ...form, id: editingEventId, name: form.name.trim() });
    } else {
      addEvent({ ...form, name: form.name.trim() });
    }
    closeCreateEvent();
  }

  return (
    <div className="space-y-6">
      <Card className="dashboard-hero px-7 py-6">
        <p className="text-xs uppercase tracking-[0.22em] text-cyan-200/75">Orbital calendar</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Calendar</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-white/62">
          Calendar and important dates now live together. Add events from any day, then edit them from the grid or side panel.
        </p>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
      <Card className="surface-card min-h-[720px]">
        <CalendarGrid
          events={events}
          onCreateEvent={openCreateEvent}
          onEditEvent={openEditEvent}
          onMoveEvent={moveEvent}
          onOpenDay={setDayDetailDate}
          categories={categories}
        />
        <div className="mt-8 flex flex-wrap items-center gap-4 rounded-[8px] border border-white/8 bg-slate-950/34 p-4">
          <span className="text-sm text-white/60">Category key</span>
          {Object.entries(categories).map(([name, color]) => (
            <span key={name} className="flex items-center gap-2 text-xs text-white/64">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
              {name}
            </span>
          ))}
        </div>
      </Card>

      <SidebarPanel title="Important dates" className="surface-card min-h-[720px]">
        <div className="thin-scrollbar max-h-[628px] space-y-6 overflow-auto pr-1">
          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-xs uppercase tracking-[0.18em] text-cyan-100/70">Upcoming</h3>
              <span className="rounded-full border border-cyan-200/14 bg-cyan-300/8 px-2.5 py-1 text-xs text-cyan-100/72">
                {upcomingEvents.length}
              </span>
            </div>
            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <EventCard key={event.id} event={event} categories={categories} onEdit={openEditEvent} onDelete={removeEvent} />
              ))}
              {!upcomingEvents.length && (
                <p className="rounded-[8px] border border-white/8 bg-slate-950/34 p-4 text-sm text-white/56">No upcoming events.</p>
              )}
            </div>
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-xs uppercase tracking-[0.18em] text-white/46">Passed</h3>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-white/52">
                {passedEvents.length}
              </span>
            </div>
            <div className="space-y-3">
              {passedEvents.map((event) => (
                <EventCard key={event.id} event={event} categories={categories} onEdit={openEditEvent} onDelete={removeEvent} />
              ))}
              {!passedEvents.length && (
                <p className="rounded-[8px] border border-white/8 bg-slate-950/34 p-4 text-sm text-white/56">No passed events yet.</p>
              )}
            </div>
          </section>
        </div>
      </SidebarPanel>
      </div>

      {dayDetailDate && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/90 px-4 backdrop-blur-md">
          <Card className="surface-card w-full max-w-3xl border-cyan-200/24 !bg-slate-950/95 shadow-[0_24px_80px_rgba(0,0,0,0.58)]">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-cyan-200/70">Day overview</p>
                <h2 className="mt-2 text-3xl font-semibold text-white">{formatDate(dayDetailDate)}</h2>
              </div>
              <button
                type="button"
                onClick={() => setDayDetailDate('')}
                className="grid h-9 w-9 place-items-center rounded-[8px] border border-white/10 bg-slate-950/42 text-white/62 transition hover:border-cyan-200/28 hover:text-white"
                aria-label="Close day overview"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">Events</h3>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      const date = dayDetailDate;
                      setDayDetailDate('');
                      openCreateEvent(date);
                    }}
                  >
                    Add event
                  </Button>
                </div>
                <div className="space-y-3">
                  {events.filter((event) => event.date === dayDetailDate).map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      categories={categories}
                      onEdit={(item) => { setDayDetailDate(''); openEditEvent(item); }}
                      onDelete={removeEvent}
                    />
                  ))}
                  {!events.some((event) => event.date === dayDetailDate) && (
                    <p className="rounded-[8px] border border-white/8 bg-white/[0.04] p-4 text-sm text-white/56">No events on this day.</p>
                  )}
                </div>
              </section>

              <section>
                <h3 className="mb-3 text-sm font-semibold text-white">Tasks</h3>
                <div className="space-y-3">
                  {tasks.filter((task) => task.date === dayDetailDate).map((task) => (
                    <TaskCard key={task.id} task={task} onToggle={toggleTask} categories={categories} />
                  ))}
                  {!tasks.some((task) => task.date === dayDetailDate) && (
                    <p className="rounded-[8px] border border-white/8 bg-white/[0.04] p-4 text-sm text-white/56">No dated tasks on this day.</p>
                  )}
                </div>
              </section>
            </div>
          </Card>
        </div>
      )}

      {selectedDate && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/72 px-4 backdrop-blur-sm">
          <Card className="surface-card w-full max-w-lg border-cyan-200/22">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-cyan-200/70">
                  {isEditing ? 'Edit calendar event' : 'Add calendar event'}
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">{formatDate(form.date || selectedDate)}</h2>
              </div>
              <button
                type="button"
                onClick={closeCreateEvent}
                className="grid h-9 w-9 place-items-center rounded-[8px] border border-white/10 bg-slate-950/42 text-white/62 transition hover:border-cyan-200/28 hover:text-white"
                aria-label="Close add event form"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={submit} className="space-y-4">
              <FormField label="Title">
                <TextInput
                  value={form.name}
                  onChange={(event) => updateField('name', event.target.value)}
                  placeholder="Event title"
                  autoFocus
                />
              </FormField>
              <div className="grid gap-4 sm:grid-cols-3">
                <FormField label="Date">
                  <TextInput
                    type="date"
                    value={form.date}
                    onChange={(event) => {
                      updateField('date', event.target.value);
                      setSelectedDate(event.target.value);
                    }}
                  />
                </FormField>
                <FormField label="Time optional">
                  <TextInput
                    type="time"
                    value={form.time}
                    onChange={(event) => updateField('time', event.target.value)}
                  />
                </FormField>
                <FormField label="Category">
                  <SelectInput value={form.category} onChange={(event) => updateField('category', event.target.value)}>
                    {categoryOptions.map((category) => (
                      <option key={category}>{category}</option>
                    ))}
                  </SelectInput>
                </FormField>
              </div>
              <FormField label="Description optional">
                <TextArea
                  value={form.description}
                  onChange={(event) => updateField('description', event.target.value)}
                  placeholder="Notes, location, or context"
                />
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
              <div className="flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={closeCreateEvent}>
                  Cancel
                </Button>
                <Button type="submit" disabled={!form.name.trim()} className="disabled:cursor-not-allowed disabled:opacity-50">
                  {isEditing ? 'Save changes' : 'Add event'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
