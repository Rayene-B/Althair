import { Pencil } from 'lucide-react';
import { categoryColor } from '../utils/categories';
import { formatDate, priorityForDate, urgencyLabel } from '../utils/dates';

const priorityStyles = {
  urgent: 'border-red-400/55 bg-red-500/12 text-red-100',
  soon: 'border-amber-300/45 bg-amber-300/12 text-amber-100',
  later: 'border-ion/30 bg-white/6 text-white/85',
};

export default function EventCard({ event, categories, onEdit }) {
  const priority = priorityForDate(event.date);

  return (
    <article className={`rounded-[8px] border p-4 ${priorityStyles[priority]}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-white">{event.name}</h3>
          <p className="mt-1 text-xs text-white/65">
            {formatDate(event.date)}
            {event.time ? ` at ${event.time}` : ''}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded-full bg-black/25 px-2.5 py-1 text-xs">{urgencyLabel(event.date)}</span>
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(event)}
              className="grid h-8 w-8 place-items-center rounded-[8px] border border-white/10 bg-black/18 text-white/58 transition hover:border-cyan-200/30 hover:text-cyan-100"
              aria-label={`Edit ${event.name}`}
            >
              <Pencil size={14} />
            </button>
          )}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs text-white/70">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: categoryColor(event.category, categories) }} />
        {event.category}
      </div>
      {event.description && <p className="mt-3 text-xs leading-5 text-white/62">{event.description}</p>}
    </article>
  );
}
