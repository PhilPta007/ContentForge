'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Plus, Trash2, Pencil, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { useUserStore } from '@/stores/user-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { AffiliateLink } from '@/lib/types';

const MAX_LINKS = 20;

const linkSchema = z.object({
  label: z.string().min(1, 'Label is required').max(100),
  url: z.string().url('Must be a valid URL'),
});

type LinkValues = z.infer<typeof linkSchema>;

export function AffiliateLinkManager() {
  const { user } = useUserStore();
  const [links, setLinks] = useState<AffiliateLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AffiliateLink | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LinkValues>({
    resolver: zodResolver(linkSchema),
    defaultValues: { label: '', url: '' },
  });

  const fetchLinks = useCallback(async () => {
    if (!user) return;
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('affiliate_links')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) {
        toast.error('Failed to load affiliate links');
        return;
      }
      setLinks(data || []);
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  async function onAdd(data: LinkValues) {
    if (!user) return;
    if (links.length >= MAX_LINKS) {
      toast.error(`Maximum of ${MAX_LINKS} affiliate links allowed`);
      return;
    }

    setIsAdding(true);
    try {
      const supabase = createClient();
      const { data: newLink, error } = await supabase
        .from('affiliate_links')
        .insert({
          user_id: user.id,
          label: data.label,
          url: data.url,
        })
        .select()
        .single();

      if (error) {
        toast.error(error.message);
        return;
      }

      setLinks((prev) => [...prev, newLink]);
      reset();
      toast.success('Link added');
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      setIsAdding(false);
    }
  }

  function startEditing(link: AffiliateLink) {
    setEditingId(link.id);
    setEditLabel(link.label);
    setEditUrl(link.url);
  }

  function cancelEditing() {
    setEditingId(null);
    setEditLabel('');
    setEditUrl('');
  }

  async function saveEdit(id: string) {
    const urlValidation = z.string().url().safeParse(editUrl);
    if (!editLabel.trim()) {
      toast.error('Label is required');
      return;
    }
    if (!urlValidation.success) {
      toast.error('Must be a valid URL');
      return;
    }

    setIsSavingEdit(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('affiliate_links')
        .update({ label: editLabel.trim(), url: editUrl.trim() })
        .eq('id', id);

      if (error) {
        toast.error(error.message);
        return;
      }

      setLinks((prev) =>
        prev.map((l) => (l.id === id ? { ...l, label: editLabel.trim(), url: editUrl.trim() } : l))
      );
      cancelEditing();
      toast.success('Link updated');
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      setIsSavingEdit(false);
    }
  }

  async function toggleActive(link: AffiliateLink) {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('affiliate_links')
        .update({ is_active: !link.is_active })
        .eq('id', link.id);

      if (error) {
        toast.error(error.message);
        return;
      }

      setLinks((prev) =>
        prev.map((l) => (l.id === link.id ? { ...l, is_active: !l.is_active } : l))
      );
    } catch {
      toast.error('An unexpected error occurred');
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('affiliate_links')
        .delete()
        .eq('id', deleteTarget.id);

      if (error) {
        toast.error(error.message);
        return;
      }

      setLinks((prev) => prev.filter((l) => l.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast.success('Link deleted');
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      setIsDeleting(false);
    }
  }

  const inputClasses = 'bg-neutral-900 border-neutral-800 text-white placeholder:text-neutral-500';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-5 animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Add Link Form */}
      <form onSubmit={handleSubmit(onAdd)} className="space-y-3">
        <div>
          <h3 className="text-sm font-medium text-white">Add Affiliate Link</h3>
          <p className="mt-1 text-xs text-neutral-400">
            Links are injected into SEO descriptions. {links.length}/{MAX_LINKS} used.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex-1 space-y-1">
            <Label htmlFor="add-label" className="sr-only">
              Label
            </Label>
            <Input
              id="add-label"
              placeholder="Link label (e.g. My Podcast Gear)"
              className={inputClasses}
              {...register('label')}
            />
            {errors.label && (
              <p className="text-xs text-red-400">{errors.label.message}</p>
            )}
          </div>
          <div className="flex-1 space-y-1">
            <Label htmlFor="add-url" className="sr-only">
              URL
            </Label>
            <Input
              id="add-url"
              placeholder="https://example.com/affiliate"
              className={inputClasses}
              {...register('url')}
            />
            {errors.url && (
              <p className="text-xs text-red-400">{errors.url.message}</p>
            )}
          </div>
          <Button
            type="submit"
            disabled={isAdding || links.length >= MAX_LINKS}
            className="bg-indigo-600 hover:bg-indigo-500 text-white shrink-0"
          >
            {isAdding ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            Add
          </Button>
        </div>
      </form>

      {/* Links Table */}
      {links.length === 0 ? (
        <div className="rounded-lg border border-neutral-800 bg-[#111111] p-8 text-center">
          <p className="text-sm text-neutral-400">No affiliate links yet. Add one above.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-neutral-800 bg-[#111111]">
          <Table>
            <TableHeader>
              <TableRow className="border-neutral-800 hover:bg-transparent">
                <TableHead className="text-neutral-400">Label</TableHead>
                <TableHead className="text-neutral-400">URL</TableHead>
                <TableHead className="text-neutral-400 w-20 text-center">Active</TableHead>
                <TableHead className="text-neutral-400 w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {links.map((link) => (
                <TableRow key={link.id} className="border-neutral-800">
                  {editingId === link.id ? (
                    <>
                      <TableCell>
                        <Input
                          value={editLabel}
                          onChange={(e) => setEditLabel(e.target.value)}
                          className={`${inputClasses} h-7`}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={editUrl}
                          onChange={(e) => setEditUrl(e.target.value)}
                          className={`${inputClasses} h-7`}
                        />
                      </TableCell>
                      <TableCell />
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            disabled={isSavingEdit}
                            onClick={() => saveEdit(link.id)}
                          >
                            {isSavingEdit ? (
                              <Loader2 className="size-3 animate-spin" />
                            ) : (
                              <Check className="size-3 text-green-400" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={cancelEditing}
                          >
                            <X className="size-3 text-neutral-400" />
                          </Button>
                        </div>
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell className="text-neutral-200 font-medium">
                        {link.label}
                      </TableCell>
                      <TableCell>
                        <span className="text-neutral-400 text-xs truncate block max-w-[200px]">
                          {link.url}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <button
                          type="button"
                          onClick={() => toggleActive(link)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border border-neutral-700 transition-colors ${
                            link.is_active ? 'bg-indigo-600' : 'bg-neutral-800'
                          }`}
                        >
                          <span
                            className={`block size-3.5 rounded-full bg-white transition-transform ${
                              link.is_active ? 'translate-x-4' : 'translate-x-0.5'
                            }`}
                          />
                        </button>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => startEditing(link)}
                          >
                            <Pencil className="size-3 text-neutral-400" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => setDeleteTarget(link)}
                          >
                            <Trash2 className="size-3 text-red-400" />
                          </Button>
                        </div>
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent className="bg-[#111111] border-neutral-800 sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white">Delete Link</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.label}&quot;? This cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              className="border-neutral-800 text-neutral-300 hover:bg-neutral-800 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={isDeleting}
              onClick={handleDelete}
            >
              {isDeleting ? <Loader2 className="size-4 animate-spin" /> : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
