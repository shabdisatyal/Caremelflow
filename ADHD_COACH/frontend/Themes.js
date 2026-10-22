// Each theme sets the same CSS variables, so components only ever use var(--name).
// Colors come from your palette screenshots (hex estimated by eye).

export const DEFAULT_THEME = 'caremel';
export const THEME_STORAGE_KEY = 'caremel_theme';

export const SEASONS = ['default', 'spring', 'summer', 'autumn', 'winter'];

export const THEMES = {
 
  caremel: {
    label: 'Caremel',
    season: 'default',
    vars: {
      '--accent': '#c2bdaf',
      '--panel': '#FFFFFF',
      '--bg': '#F2EEE3',
      '--button': '#505C30',
      '--ink': '#F2EEE3',
      '--text': '#505C30',
      '--dots': '#D6CBAA',
    },
  },

  // ---------- spring ----------
  blossom: {
    label: 'Blossom',
    season: 'spring',
    vars: {
      '--bg': '#FDF7DC',
      '--panel': '#F8DCDD',
      '--accent': '#96A474',
      '--button': '#96A474',
      '--ink': '#3F3030', // derived
      '--text': '#3F3030', // derived
      '--dots': '#D3A4A4',
    },
  },
  
  garden: {
    label: 'Garden',
    season: 'spring',
    vars: {
      '--bg': '#F2E0B8',
      '--panel': '#FFFFFF',
      '--accent': '#B0CD91',
      '--button': '#3F5F32',
      '--ink': '#F2E0B8',
      '--text': '#3F5F32',
      '--dots': '#F0C3B0',
    },
  },
 

 
  // ---------- autumn ----------
  
  forest: {
    label: 'Forest',
    season: 'autumn',
    vars: {
      '--bg': '#E8E2B0',
      '--panel': '#FFFFFF',
      '--accent': '#DE832F',
      '--button': '#3A5849',
      '--ink': '#E8E2B0',
      '--text': '#302A16',
      '--dots': '#DE832F',
    },
  },
  cocoa: {
    label: 'Cocoa',
    season: 'autumn',
    vars: {
      '--bg': '#EFE3CE',
      '--panel': '#FFFFFF',
      '--accent': '#CDD887',
      '--button': '#85624A',
      '--ink': '#EFE3CE',
      '--text': '#4A3426', // derived
      '--dots': '#A08064',
    },
  },


 
};

// Writes a theme's variables onto <html> and remembers the choice.
export function applyTheme(id) {
  const theme = THEMES[id] || THEMES[DEFAULT_THEME];
  const root = document.documentElement;
  Object.entries(theme.vars).forEach(([name, value]) => root.style.setProperty(name, value));
  try {
    localStorage.setItem(THEME_STORAGE_KEY, THEMES[id] ? id : DEFAULT_THEME);
  } catch {
    // storage unavailable, theme still applies for this session
  }
}

export function loadSavedTheme() {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    return THEMES[saved] ? saved : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}