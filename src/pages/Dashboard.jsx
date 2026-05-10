import { CalendarDays, Clock3 } from 'lucide-react';
import AIAskPanel from '../components/AIAskPanel';
import Button from '../components/Button';
import Card from '../components/Card';
import EventCard from '../components/EventCard';
import { categoryColor } from '../utils/categories';
import { formatDate, isoFromDate, monthMatrix, urgencyLabel } from '../utils/dates';

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function DashboardCalendarPreview({ events, categories }) {
  const cells = monthMatrix(new Date()).slice(0, 35);
  const eventsByDay = events.reduce((map, event) => {
    map[event.date] = [...(map[event.date] || []), event];
    return map;
  }, {});

  return (
    <div className="grid h-full grid-cols-7 gap-2 rounded-[8px] border border-white/8 bg-slate-950/38 p-3">
      {cells.map((date, index) => {
        const iso = date ? isoFromDate(date) : '';
        const dayEvents = eventsByDay[iso] || [];

        return (
          <div
            key={date ? iso : `preview-empty-${index}`}
            className="flex min-h-10 flex-col justify-between rounded-[6px] border border-white/8 bg-white/[0.055] p-1.5 transition hover:border-ion/30 hover:bg-ion/10"
          >
            <span className="text-[10px] leading-none text-white/58">{date ? date.getDate() : ''}</span>
            <div className="flex gap-1">
              {dayEvents.slice(0, 2).map((event) => (
                <span
                  key={event.id}
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: categoryColor(event.category, categories) }}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function FeaturedEvent({ event, categories }) {
  if (!event) {
    return (
      <div className="rounded-[8px] border border-white/8 bg-slate-950/38 p-5 text-sm text-white/60">
        No important dates yet.
      </div>
    );
  }

  return (
    <div className="rounded-[8px] border border-cyan-200/18 bg-gradient-to-br from-cyan-400/14 via-white/[0.055] to-fuchsia-400/10 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-cyan-200/70">Next signal</p>
          <h3 className="mt-2 text-lg font-semibold text-white">{event.name}</h3>
        </div>
        <span className="rounded-full border border-white/10 bg-slate-950/45 px-3 py-1 text-xs text-cyan-100">
          {urgencyLabel(event.date)}
        </span>
      </div>
      <p className="mt-3 text-sm text-white/64">{formatDate(event.date)}</p>
      <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/8">
        <div
          className="h-full rounded-full"
          style={{
            width: '68%',
            background: `linear-gradient(90deg, ${categoryColor(event.category, categories)}, rgba(98, 215, 255, 0.45))`,
          }}
        />
      </div>
    </div>
  );
}

export default function Dashboard({ events, tasks, goals, categories, completion, onNavigate }) {
  const completedTasks = tasks.filter((task) => task.completed).length;
  const nextTasks = tasks.slice(0, 3);

  return (
    <div className="space-y-5">
      <Card className="dashboard-hero px-7 py-6">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-cyan-200/75">Personal orbit</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">{greeting()}, Rayene!</h1>
          </div>
          <div className="flex flex-wrap gap-2 text-sm text-white/64">
            <span className="rounded-full border border-cyan-300/14 bg-cyan-300/8 px-3 py-1">{events.length} dates</span>
            <span className="rounded-full border border-emerald-300/14 bg-emerald-300/8 px-3 py-1">{completedTasks}/{tasks.length} tasks</span>
            <span className="rounded-full border border-amber-300/14 bg-amber-300/8 px-3 py-1">{completion}% complete</span>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1fr_1.05fr_1fr]">
        <Card
          title="Calendar preview"
          className="orbit-hover surface-card min-h-[350px]"
          onClick={() => onNavigate('calendar')}
        >
          <div className="mb-4 flex items-center gap-3 text-sm text-white/66">
            <CalendarDays size={18} className="text-cyan-200" />
            <span>Month overview</span>
          </div>
          <div className="h-[240px]">
            <DashboardCalendarPreview events={events} categories={categories} />
          </div>
        </Card>

        <Card
          title="Calendar & Important Dates"
          className="orbit-hover surface-card min-h-[350px]"
          onClick={() => onNavigate('calendar')}
        >
          <div className="thin-scrollbar max-h-[258px] space-y-3 overflow-auto pr-1">
            {events.length ? (
              events.map((event) => (
                <EventCard key={event.id} event={event} categories={categories} />
              ))
            ) : (
              <FeaturedEvent event={null} categories={categories} />
            )}
          </div>
          <Button onClick={(event) => { event.stopPropagation(); onNavigate('calendar'); }} variant="ghost" className="mt-4 w-full">
            Open calendar
          </Button>
        </Card>

        <Card
          title="Weekly Schedule"
          className="orbit-hover surface-card min-h-[350px]"
          onClick={() => onNavigate('schedule')}
        >
          <div className="mb-4 rounded-[8px] border border-emerald-300/16 bg-emerald-300/[0.09] p-4">
            <div className="mb-3 flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-emerald-100"><Clock3 size={17} /> Weekly flow</span>
              <span className="text-white/58">{completion}% complete</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-950/60">
              <div className="h-full rounded-full bg-gradient-to-r from-emerald-300 to-cyan-300" style={{ width: `${completion}%` }} />
            </div>
          </div>
          <div className="space-y-3">
            {nextTasks.map((task) => (
              <div key={task.id} className="rounded-[8px] border border-white/8 bg-slate-950/34 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className={`truncate text-sm font-semibold ${task.completed ? 'text-white/48 line-through' : 'text-white'}`}>
                      {task.name}
                    </h3>
                    <p className="mt-1 text-xs text-white/58">
                      {task.time || 'Any time'} / {task.duration || 'Flexible'} / {task.frequency}
                    </p>
                  </div>
                  <span
                    className="h-3 w-3 shrink-0 rounded-full shadow-glow"
                    style={{ backgroundColor: categoryColor(task.category, categories) }}
                  />
                </div>
              </div>
            ))}
          </div>
          <Button onClick={(event) => { event.stopPropagation(); onNavigate('schedule'); }} variant="ghost" className="mt-4 w-full">
            Open schedule
          </Button>
        </Card>
      </div>

      <Card className="search-dock p-4">
        <AIAskPanel events={events} tasks={tasks} goals={goals} categories={categories} completion={completion} />
      </Card>
    </div>
  );
}
