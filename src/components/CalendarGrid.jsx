import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useState } from 'react';
import { categoryColor } from '../utils/categories';
import { isoFromDate, monthMatrix } from '../utils/dates';

const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function CalendarGrid({ events, onCreateEvent, onEditEvent, onMoveEvent, onOpenDay, categories }) {
  const [referenceDate, setReferenceDate] = useState(new Date());
  const [hoveredDate, setHoveredDate] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const cells = monthMatrix(referenceDate);
  const today = isoFromDate(new Date());
  const monthLabel = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' }).format(referenceDate);

  // Group events by ISO date so each calendar cell can render category dots quickly.
  const eventsByDay = events.reduce((map, event) => {
    map[event.date] = [...(map[event.date] || []), event];
    return map;
  }, {});

  function moveMonth(offset) {
    setReferenceDate((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  }

  function resetMonth() {
    setReferenceDate(new Date());
  }

  return (
    <div
      className="select-none"
      onMouseLeave={() => {
        setHoveredDate('');
        setIsDragging(false);
      }}
      onMouseUp={() => setIsDragging(false)}
    >
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-ion/65">Calendar</p>
          <h2 className="mt-1 text-3xl font-semibold text-white">{monthLabel}</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => moveMonth(-1)}
            className="grid h-10 w-10 place-items-center rounded-[8px] border border-white/10 bg-slate-950/42 text-white/70 transition hover:border-cyan-200/32 hover:text-cyan-100"
            aria-label="Previous month"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={resetMonth}
            className="rounded-[8px] border border-cyan-200/14 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-100 transition hover:border-cyan-200/34"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => moveMonth(1)}
            className="grid h-10 w-10 place-items-center rounded-[8px] border border-white/10 bg-slate-950/42 text-white/70 transition hover:border-cyan-200/32 hover:text-cyan-100"
            aria-label="Next month"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium uppercase tracking-[0.14em] text-white/48">
        {weekdays.map((day) => (
          <div key={day} className="py-2">
            {day}
          </div>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-7 gap-3">
        {cells.map((date, index) => {
          const iso = date ? isoFromDate(date) : '';
          const dayEvents = eventsByDay[iso] || [];
          const isToday = iso === today;
          const showCreate = date && onCreateEvent && hoveredDate === iso;

          return (
            <div
              key={date ? iso : `empty-${index}`}
              onClick={() => {
                if (!date) return;
                onOpenDay?.(iso);
              }}
              onMouseDown={() => {
                if (!date) return;
                setIsDragging(true);
                setHoveredDate(iso);
              }}
              onMouseEnter={() => {
                if (!date) return;
                setHoveredDate(iso);
              }}
              onDragOver={(event) => {
                if (!date || !onMoveEvent) return;
                event.preventDefault();
                setHoveredDate(iso);
              }}
              onDrop={(event) => {
                if (!date || !onMoveEvent) return;
                event.preventDefault();
                const eventId = event.dataTransfer.getData('text/plain');
                if (eventId) onMoveEvent(eventId, iso);
                setIsDragging(false);
              }}
              className={`group relative min-h-28 overflow-hidden rounded-[8px] border p-3 transition duration-200 ${
                date
                  ? isToday
                    ? 'border-cyan-200/55 bg-cyan-300/12 shadow-glow'
                    : 'border-white/9 bg-slate-950/34 hover:border-cyan-200/30 hover:bg-cyan-300/8'
                  : 'border-white/4 bg-white/[0.025]'
              }`}
            >
              {date && (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <span className={`grid h-8 w-8 place-items-center rounded-[8px] text-sm font-semibold ${isToday ? 'bg-cyan-200 text-slate-950' : 'text-white/82'}`}>
                      {date.getDate()}
                    </span>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onCreateEvent?.(iso);
                      }}
                      className={`grid h-8 w-8 place-items-center rounded-[8px] border border-cyan-200/24 bg-slate-950/68 text-cyan-100 shadow-glow transition ${
                        showCreate ? 'scale-100 opacity-100' : 'scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100'
                      }`}
                      aria-label={`Add event on ${iso}`}
                    >
                      <Plus size={17} />
                    </button>
                  </div>
                  <div className="mt-4 space-y-2">
                    {dayEvents.slice(0, 3).map((event) => (
                      <button
                        type="button"
                        key={event.id}
                        draggable
                        onDragStart={(dragEvent) => {
                          dragEvent.dataTransfer.setData('text/plain', event.id);
                          dragEvent.dataTransfer.effectAllowed = 'move';
                        }}
                        onClick={(clickEvent) => {
                          clickEvent.stopPropagation();
                          onEditEvent?.(event);
                        }}
                        className="flex min-w-0 cursor-grab items-center gap-2 rounded-[6px] bg-white/[0.055] px-2 py-1.5 text-left transition hover:bg-cyan-300/10 active:cursor-grabbing"
                      >
                        <span
                          className="h-2 w-2 shrink-0 rounded-full shadow-glow"
                          style={{ backgroundColor: categoryColor(event.category, categories) }}
                        />
                        <span className="truncate text-xs text-white/72">
                          {event.name}
                        </span>
                      </button>
                    ))}
                    {dayEvents.length > 3 && (
                      <p className="pl-1 text-xs text-cyan-100/70">+{dayEvents.length - 3} more</p>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
