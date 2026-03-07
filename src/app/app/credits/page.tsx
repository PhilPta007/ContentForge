import { Coins } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';

export default function CreditsPage() {
  return (
    <EmptyState
      icon={Coins}
      title="Credits"
      description="Credit store coming in Phase 2"
    />
  );
}
