export const APP_NAME = 'StudioStack';
export const APP_DESCRIPTION = 'AI-powered content creation for podcasters and YouTube creators';

export const NAV_ITEMS = [
  { label: 'Dashboard', href: '/app', icon: 'LayoutDashboard' },
  { label: 'Create', href: '/app/create', icon: 'Sparkles' },
  { label: 'Library', href: '/app/library', icon: 'FolderOpen' },
  { label: 'Credits', href: '/app/credits', icon: 'Coins' },
  { label: 'Jobs', href: '/app/jobs', icon: 'ListTodo' },
  { label: 'Settings', href: '/app/settings', icon: 'Settings' },
] as const;

export const DEFAULT_TIERS = {
  voice: 'premium' as const,
  image: 'premium' as const,
  motion: 'ai' as const,
};
