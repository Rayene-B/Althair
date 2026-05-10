import { Check } from 'lucide-react';
import { categoryColor } from '../utils/categories';
import { formatDate } from '../utils/dates';

export default function TaskCard({ task, onToggle, categories }) {
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
    </article>
  );
}
