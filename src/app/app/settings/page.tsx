import { Settings } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';

export default function SettingsPage() {
  return (
    <EmptyState
      icon={Settings}
      title="Settings"
      description="Account settings coming in Phase 5"
    />
  );
}
