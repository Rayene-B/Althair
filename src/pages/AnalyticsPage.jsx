import { useMemo, useState } from 'react';
import Button from '../components/Button';
import Card from '../components/Card';
import SelectInput from '../components/SelectInput';
import SidebarPanel from '../components/SidebarPanel';
import { categoryOptionsFrom } from '../utils/categories';

const filters = ['This Week', 'This Month', 'This Year', 'All Time'];

function buildCurvePath(points) {
  if (points.length < 2) return '';

  return points.reduce((path, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`;

    const previous = points[index - 1];
    const controlOffset = (point.x - previous.x) / 2;
    return `${path} C ${previous.x + controlOffset} ${previous.y}, ${point.x - controlOffset} ${point.y}, ${point.x} ${point.y}`;
  }, '');
}

function ProgressLineChart({ bars, selectedCompletion }) {
  const width = 960;
  const height = 470;
  const padding = 58;
  const values = bars.map((bar) => bar.percentage);
  const fallbackValues = [12, 24, 38, 52, 68, selectedCompletion || 76];
  const chartValues = values.some((value) => value > 0) ? values : fallbackValues;
  const labels = values.some((value) => value > 0) ? bars.map((bar) => bar.item) : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Now'];

  const points = chartValues.map((value, index) => {
    const x = padding + (index * (width - padding * 2)) / (chartValues.length - 1 || 1);
    const y = height - padding - (Math.min(value, 100) / 100) * (height - padding * 2);
    return { x, y, value, label: labels[index] };
  });

  const linePath = buildCurvePath(points);
  const fillPath = `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

  return (
    <div className="rounded-[8px] border border-cyan-200/16 bg-gradient-to-br from-slate-950/62 via-cyan-950/18 to-amber-950/12 p-6 shadow-glow">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-cyan-200/70">Curve line graph</p>
          <h3 className="mt-2 text-3xl font-semibold text-white">{selectedCompletion}% selected completion</h3>
        </div>
        <div className="rounded-full border border-emerald-300/18 bg-emerald-300/10 px-3 py-1 text-xs text-emerald-100">
          live local data
        </div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="h-[460px] w-full overflow-visible">
        <defs>
          <linearGradient id="lineGradient" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="52%" stopColor="#62d7ff" />
            <stop offset="100%" stopColor="#fbbf24" />
          </linearGradient>
          <linearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#62d7ff" stopOpacity="0.26" />
            <stop offset="100%" stopColor="#62d7ff" stopOpacity="0" />
          </linearGradient>
          <filter id="lineGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {[0, 20, 40, 60, 80, 100].map((tick) => {
          const y = height - padding - (tick / 100) * (height - padding * 2);
          return (
            <g key={tick}>
              <line x1={padding} x2={width - padding} y1={y} y2={y} stroke="rgba(255,255,255,0.085)" />
              <text
                x={18}
                y={y + 5}
                fill="rgba(255,255,255,0.86)"
                fontSize="15"
                fontWeight="600"
                stroke="rgba(7,5,26,0.9)"
                strokeWidth="4"
                paintOrder="stroke"
              >
                {tick}%
              </text>
            </g>
          );
        })}

        <path d={fillPath} fill="url(#areaGradient)" />
        <path d={linePath} fill="none" stroke="url(#lineGradient)" strokeLinecap="round" strokeWidth="6" filter="url(#lineGlow)" />

        {points.map((point) => (
          <g key={point.label}>
            <circle cx={point.x} cy={point.y} r="8" fill="#07051a" stroke="#62d7ff" strokeWidth="3.5" />
            <text
              x={point.x}
              y={point.y - 20}
              textAnchor="middle"
              fill="rgba(255,255,255,0.95)"
              fontSize="16"
              fontWeight="700"
              stroke="rgba(7,5,26,0.9)"
              strokeWidth="5"
              paintOrder="stroke"
            >
              {point.value}%
            </text>
            <text
              x={point.x}
              y={height - 16}
              textAnchor="middle"
              fill="rgba(255,255,255,0.82)"
              fontSize="15"
              fontWeight="600"
              stroke="rgba(7,5,26,0.9)"
              strokeWidth="4"
              paintOrder="stroke"
            >
              {point.label.slice(0, 6)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

export default function AnalyticsPage({ tasks, completion, categories }) {
  const [filter, setFilter] = useState('This Week');
  const [category, setCategory] = useState('All');
  const categoryOptions = categoryOptionsFrom(categories);

  const filteredTasks = useMemo(() => {
    if (category === 'All') return tasks;
    return tasks.filter((task) => task.category === category);
  }, [category, tasks]);

  const filteredCompletion = filteredTasks.length
    ? Math.round((filteredTasks.filter((task) => task.completed).length / filteredTasks.length) * 100)
    : 0;

  // Category bars compare completion across the user's stored task categories.
  const bars = categoryOptions.map((item) => {
    const categoryTasks = tasks.filter((task) => task.category === item);
    const percentage = categoryTasks.length
      ? Math.round((categoryTasks.filter((task) => task.completed).length / categoryTasks.length) * 100)
      : 0;
    return { item, percentage };
  });

  return (
    <div className="space-y-6">
      <Card className="dashboard-hero px-7 py-6">
        <p className="text-xs uppercase tracking-[0.22em] text-cyan-200/75">Performance signal</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Performance Analytics</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-white/62">
          Track completion patterns with a larger flow graph and category-level progress.
        </p>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[250px_1fr_300px]">
        <SidebarPanel title="Based on:" className="surface-card min-h-[720px]">
          <div className="space-y-3 rounded-[8px] border border-white/8 bg-slate-950/34 p-3">
            {filters.map((option) => (
              <Button
                key={option}
                variant={filter === option ? 'active' : 'ghost'}
                onClick={() => setFilter(option)}
                className="w-full"
              >
                {option}
              </Button>
            ))}
          </div>

          <div className="mt-10 rounded-[8px] border border-cyan-200/12 bg-slate-950/34 p-4">
            <p className="mb-4 text-center text-sm text-white/70">All OR Categories Selected:</p>
            <SelectInput value={category} onChange={(event) => setCategory(event.target.value)}>
              <option>All</option>
              {categoryOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </SelectInput>
          </div>
        </SidebarPanel>

        <Card className="surface-card min-h-[720px]">
          <div className="flex h-full min-h-[650px] flex-col justify-center">
            <div className="mb-6">
              <p className="text-xs uppercase tracking-[0.2em] text-ion/65">{filter}</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">{category} progress</h2>
              <p className="mt-2 text-sm text-white/58">
                Curved progress graph comparing completion across categories.
              </p>
            </div>

            <div className="space-y-6">
              <ProgressLineChart bars={bars} selectedCompletion={filteredCompletion} />

              <div className="grid gap-3 md:grid-cols-2">
              {bars.map((bar) => (
                <div key={bar.item} className="grid grid-cols-[90px_1fr_42px] items-center gap-3 text-sm">
                  <span className="text-white/58">{bar.item}</span>
                  <div className="h-3 overflow-hidden rounded-full bg-white/7">
                    <div className="h-full rounded-full bg-gradient-to-r from-emerald-300 to-cyan-300" style={{ width: `${bar.percentage}%` }} />
                  </div>
                  <span className="text-right text-white/62">{bar.percentage}%</span>
                </div>
              ))}
              </div>
            </div>
          </div>
        </Card>

        <SidebarPanel title="AI Summary" className="surface-card min-h-[720px]">
          <div className="space-y-4">
            <div className="min-h-[260px] rounded-[8px] border border-emerald-300/16 bg-emerald-300/[0.09] p-5">
              <h3 className="text-sm font-medium text-white">What's going well</h3>
              <p className="mt-4 text-sm leading-6 text-white/68">
                You have a {completion}% overall completion rate. Completed tasks are building a clear baseline for your routine.
              </p>
            </div>
            <div className="min-h-[260px] rounded-[8px] border border-amber-300/16 bg-amber-300/10 p-5">
              <h3 className="text-sm font-medium text-white">What could go better + tips</h3>
              <p className="mt-4 text-sm leading-6 text-white/68">
                Keep the schedule focused. Move unfinished tasks into shorter blocks and group similar categories together.
              </p>
            </div>
          </div>
        </SidebarPanel>
      </div>
    </div>
  );
}
