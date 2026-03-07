import { ListTodo } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';

export default function JobsPage() {
  return (
    <EmptyState
      icon={ListTodo}
      title="Job Queue"
      description="Generation tracking coming in Phase 3"
    />
  );
}
