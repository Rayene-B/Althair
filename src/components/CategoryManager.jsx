import { useState } from 'react';
import { X } from 'lucide-react';
import Button from './Button';
import TextInput from './TextInput';

const colorChoices = ['#62d7ff', '#c7ff2e', '#ff5fa2', '#a78bfa', '#fbbf24', '#34d399', '#fb7185', '#38bdf8'];

export default function CategoryManager({ categories, onAddCategory, onRemoveCategory, selectedCategory, onSelectCategory }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(colorChoices[0]);

  function saveCategory() {
    const trimmed = name.trim();
    if (!trimmed) return;
    onAddCategory(trimmed, color);
    onSelectCategory?.(trimmed);
    setName('');
  }

  return (
    <div className="space-y-4 rounded-[8px] border border-white/8 bg-slate-950/30 p-4">
      <div className="flex flex-wrap gap-2">
        {Object.entries(categories).map(([category, categoryColor]) => (
          <button
            type="button"
            key={category}
            onClick={() => onSelectCategory?.(category)}
            className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition ${
              selectedCategory === category
                ? 'border-cyan-200/44 bg-cyan-300/12 text-cyan-50'
                : 'border-white/10 bg-white/[0.04] text-white/62 hover:text-white'
            }`}
          >
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: categoryColor }} />
            {category}
            <span
              role="button"
              tabIndex={0}
              onClick={(event) => {
                event.stopPropagation();
                onRemoveCategory(category);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  event.stopPropagation();
                  onRemoveCategory(category);
                }
              }}
              className="rounded-full p-0.5 text-white/42 hover:bg-white/10 hover:text-white"
              aria-label={`Remove ${category}`}
            >
              <X size={12} />
            </span>
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <TextInput
          value={name}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              saveCategory();
            }
          }}
          placeholder="New category"
        />
        <div className="flex items-center gap-2 rounded-[8px] border border-white/10 bg-slate-950/55 px-3">
          {colorChoices.map((choice) => (
            <button
              type="button"
              key={choice}
              onClick={() => setColor(choice)}
              className={`h-5 w-5 rounded-full ${color === choice ? 'ring-2 ring-white/80 ring-offset-2 ring-offset-slate-950' : ''}`}
              style={{ backgroundColor: choice }}
              aria-label={`Use ${choice}`}
            />
          ))}
        </div>
        <Button type="button" onClick={saveCategory}>Save</Button>
      </div>
    </div>
  );
}
