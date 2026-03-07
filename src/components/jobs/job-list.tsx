'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { ListTodo } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useUserStore } from '@/stores/user-store';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { JobCard } from '@/components/jobs/job-card';
import type { Generation } from '@/lib/types';

export function JobList() {
  const searchParams = useSearchParams();
  const highlightId = searchParams.get('highlight');
  const { user } = useUserStore();

  const [jobs, setJobs] = useState<Generation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (!user) return;

    async function fetchJobs() {
      const { data } = await supabase
        .from('generations')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(50);

      setJobs((data as Generation[]) ?? []);
      setIsLoading(false);
    }
    fetchJobs();
  }, [supabase, user]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('generations-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'generations',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setJobs((prev) => [payload.new as Generation, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setJobs((prev) =>
              prev.map((j) =>
                j.id === (payload.new as Generation).id
                  ? (payload.new as Generation)
                  : j
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, user]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-[72px] w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <EmptyState
        icon={ListTodo}
        title="No generations yet"
        description="Create your first piece of content to see it here"
        action={{ label: 'Create content', href: '/app/create' }}
      />
    );
  }

  return (
    <div className="space-y-2">
      {jobs.map((job) => (
        <JobCard
          key={job.id}
          job={job}
          isHighlighted={job.id === highlightId}
        />
      ))}
    </div>
  );
}
