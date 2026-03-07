import { FolderOpen } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';

export default function LibraryPage() {
  return (
    <EmptyState
      icon={FolderOpen}
      title="Asset Library"
      description="Your generated content will appear here"
    />
  );
}
