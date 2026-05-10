export const categories = {
  Work: '#62d7ff',
  Study: '#c7ff2e',
  Health: '#ff5fa2',
  Personal: '#a78bfa',
  Finance: '#fbbf24',
  Social: '#34d399',
};

export const categoryOptions = Object.keys(categories);

export function categoryColor(category, categoryMap = categories) {
  return categoryMap[category] || '#a78bfa';
}

export function categoryOptionsFrom(categoryMap = categories) {
  return Object.keys(categoryMap);
}
