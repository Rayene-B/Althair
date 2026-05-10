import { todayIso } from '../utils/dates';

const today = todayIso();

export const defaultEvents = [
  {
    id: 'event-1',
    name: 'Project checkpoint',
    date: today,
    category: 'Work',
    description: 'Review current priorities and blockers.',
  },
  {
    id: 'event-2',
    name: 'Course deadline',
    date: '2026-05-12',
    category: 'Study',
    description: 'Submit module notes and practice set.',
  },
  {
    id: 'event-3',
    name: 'Gym assessment',
    date: '2026-05-21',
    category: 'Health',
    description: 'Track progress and update routine.',
  },
];

export const defaultTasks = [
  {
    id: 'task-1',
    name: 'Plan the day',
    category: 'Personal',
    time: '08:30',
    duration: '20 min',
    frequency: 'Daily',
    completed: true,
  },
  {
    id: 'task-2',
    name: 'Deep work session',
    category: 'Work',
    time: '10:00',
    duration: '2 hrs',
    frequency: 'Daily',
    completed: false,
  },
  {
    id: 'task-3',
    name: 'Study review',
    category: 'Study',
    time: '18:00',
    duration: '45 min',
    frequency: 'Weekly',
    completed: false,
  },
];
