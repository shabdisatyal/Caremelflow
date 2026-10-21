export const ITEMS_KEY = 'caremel_calendar_items';
export const RESET_SECONDS = 300;
export const SHOWED_UP_WINDOW_MS = 6 * 60 * 60 * 1000;

export const MOODS = ['Overwhelmed', 'Anxious', 'Tired', 'Bored', 'Frozen', 'Low'];
export const REASONS = [
  'I do not know where to begin',
  'It feels too big',
  'I am too tired',
  'I keep getting distracted',
  'I am afraid of doing it badly',
  'I just do not feel like it',
];
export const TIPS = {
  'I do not know where to begin': 'Open it and write down only the first step. Nothing else.',
  'It feels too big': 'Do the first two minutes of it. You can stop after that.',
  'I am too tired': 'Pick the smallest version of this and give it five minutes.',
  'I keep getting distracted': 'Put your phone out of reach, then start the timer.',
  'I am afraid of doing it badly': 'Aim for a messy first pass. You will fix it later.',
  'I just do not feel like it': 'You do not need to feel ready. Start for two minutes.',
};

// Solid backdrop behind every popup. Change this one value to recolor them all.
export const OVERLAY_COLOR = '#B0C4D4';

export const KIND_LABEL = { task: 'Task', deadline: 'Deadline', test: 'Test' };
export const KIND_WEIGHT = { task: 1, deadline: 2, test: 3 };
export const TAG_COLORS = [
  'color-mix(in srgb, var(--accent) 50%, transparent)',
  'color-mix(in srgb, var(--dots) 45%, transparent)',
  'color-mix(in srgb, var(--button) 25%, transparent)',
  'color-mix(in srgb, var(--accent) 30%, var(--dots))',
  'color-mix(in srgb, var(--button) 15%, var(--accent))',
];