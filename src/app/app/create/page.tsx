import { Sparkles } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';

export default function CreatePage() {
  return (
    <EmptyState
      icon={Sparkles}
      title="Content Creation"
      description="Generation hub coming in Phase 3"
    />
  );
}
