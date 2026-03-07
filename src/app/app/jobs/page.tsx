import { Suspense } from 'react';
import { JobList } from '@/components/jobs/job-list';
import { Skeleton } from '@/components/ui/skeleton';

function JobListFallback() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-[72px] w-full rounded-lg" />
      ))}
    </div>
  );
}

export default function JobsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-100">Generation Jobs</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Track your content generation progress in real time
        </p>
      </div>
      <Suspense fallback={<JobListFallback />}>
        <JobList />
      </Suspense>
    </div>
  );
}
