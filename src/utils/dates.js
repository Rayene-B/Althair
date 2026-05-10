export function todayIso() {
  return isoFromDate(new Date());
}

export function formatDate(date) {
  if (!date) return 'No date';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${date}T12:00:00`));
}

export function daysUntil(date) {
  const start = new Date(`${todayIso()}T00:00:00`);
  const end = new Date(`${date}T00:00:00`);
  return Math.ceil((end - start) / 86400000);
}

export function priorityForDate(date) {
  const diff = daysUntil(date);
  if (diff <= 3) return 'urgent';
  if (diff <= 14) return 'soon';
  return 'later';
}

export function urgencyLabel(date) {
  const diff = daysUntil(date);
  if (diff < 0) return `${Math.abs(diff)}d overdue`;
  if (diff === 0) return 'today';
  if (diff === 1) return 'tomorrow';
  return `${diff}d left`;
}

export function monthMatrix(reference = new Date()) {
  const year = reference.getFullYear();
  const month = reference.getMonth();
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];

  for (let i = 0; i < offset; i += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(year, month, day));
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

export function isoFromDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
