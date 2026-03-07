'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { useUserStore } from '@/stores/user-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const profileSchema = z.object({
  full_name: z.string().min(1, 'Full name is required').max(100),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(6, 'Password must be at least 6 characters'),
    newPassword: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Password must be at least 6 characters'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ProfileValues = z.infer<typeof profileSchema>;
type PasswordValues = z.infer<typeof passwordSchema>;

export function ProfileForm() {
  const { user, profile, setProfile } = useUserStore();
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile?.full_name || '',
    },
  });

  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  async function onProfileSubmit(data: ProfileValues) {
    if (!user) return;
    setIsUpdatingProfile(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: data.full_name })
        .eq('id', user.id);

      if (error) {
        toast.error(error.message);
        return;
      }

      if (profile) {
        setProfile({ ...profile, full_name: data.full_name });
      }
      toast.success('Profile updated');
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      setIsUpdatingProfile(false);
    }
  }

  async function onPasswordSubmit(data: PasswordValues) {
    setIsUpdatingPassword(true);
    try {
      const supabase = createClient();

      // Verify current password by attempting sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: data.currentPassword,
      });

      if (signInError) {
        toast.error('Current password is incorrect');
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: data.newPassword,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      passwordForm.reset();
      toast.success('Password updated');
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      setIsUpdatingPassword(false);
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirmation !== 'DELETE') return;
    setIsDeleting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.rpc('delete_own_account');

      if (error) {
        toast.error(error.message);
        return;
      }

      await supabase.auth.signOut();
      window.location.href = '/login';
    } catch {
      toast.error('Failed to delete account. Please contact support.');
    } finally {
      setIsDeleting(false);
    }
  }

  const inputClasses = 'bg-neutral-900 border-neutral-800 text-white placeholder:text-neutral-500';

  return (
    <div className="max-w-lg space-y-8">
      {/* Profile Section */}
      <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-white">Profile Information</h3>
          <p className="mt-1 text-xs text-neutral-400">Update your display name.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="full_name" className="text-neutral-300">
            Full Name
          </Label>
          <Input
            id="full_name"
            placeholder="Your full name"
            className={inputClasses}
            {...profileForm.register('full_name')}
          />
          {profileForm.formState.errors.full_name && (
            <p className="text-sm text-red-400">
              {profileForm.formState.errors.full_name.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-neutral-300">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            value={user?.email || ''}
            disabled
            className={`${inputClasses} opacity-50 cursor-not-allowed`}
          />
          <p className="text-xs text-neutral-500">Email cannot be changed.</p>
        </div>

        <Button
          type="submit"
          disabled={isUpdatingProfile}
          className="bg-indigo-600 hover:bg-indigo-500 text-white"
        >
          {isUpdatingProfile ? <Loader2 className="size-4 animate-spin" /> : 'Save Changes'}
        </Button>
      </form>

      <Separator className="bg-neutral-800" />

      {/* Password Section */}
      <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-white">Change Password</h3>
          <p className="mt-1 text-xs text-neutral-400">
            Update your password. You will stay logged in.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="currentPassword" className="text-neutral-300">
            Current Password
          </Label>
          <Input
            id="currentPassword"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            className={inputClasses}
            {...passwordForm.register('currentPassword')}
          />
          {passwordForm.formState.errors.currentPassword && (
            <p className="text-sm text-red-400">
              {passwordForm.formState.errors.currentPassword.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="newPassword" className="text-neutral-300">
            New Password
          </Label>
          <Input
            id="newPassword"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            className={inputClasses}
            {...passwordForm.register('newPassword')}
          />
          {passwordForm.formState.errors.newPassword && (
            <p className="text-sm text-red-400">
              {passwordForm.formState.errors.newPassword.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-neutral-300">
            Confirm New Password
          </Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            className={inputClasses}
            {...passwordForm.register('confirmPassword')}
          />
          {passwordForm.formState.errors.confirmPassword && (
            <p className="text-sm text-red-400">
              {passwordForm.formState.errors.confirmPassword.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isUpdatingPassword}
          className="bg-indigo-600 hover:bg-indigo-500 text-white"
        >
          {isUpdatingPassword ? <Loader2 className="size-4 animate-spin" /> : 'Update Password'}
        </Button>
      </form>

      <Separator className="bg-neutral-800" />

      {/* Danger Zone */}
      <div className="rounded-lg border border-red-900 bg-red-950/20 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="size-4 text-red-400" />
          <h3 className="text-sm font-medium text-red-400">Danger Zone</h3>
        </div>
        <p className="text-xs text-neutral-400">
          This will permanently delete your account and all data. This action cannot be undone.
        </p>
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogTrigger
            render={
              <Button variant="destructive" size="sm" />
            }
          >
            Delete Account
          </DialogTrigger>
          <DialogContent className="bg-[#111111] border-neutral-800 sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white">Delete Account</DialogTitle>
              <DialogDescription>
                This will permanently delete your account, all generations, credit history, and
                affiliate links. This cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-2">
              <Label htmlFor="delete-confirm" className="text-neutral-300">
                Type <span className="font-mono text-red-400">DELETE</span> to confirm
              </Label>
              <Input
                id="delete-confirm"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="DELETE"
                className={inputClasses}
              />
            </div>
            <DialogFooter>
              <Button
                variant="destructive"
                disabled={deleteConfirmation !== 'DELETE' || isDeleting}
                onClick={handleDeleteAccount}
              >
                {isDeleting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  'Permanently Delete Account'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
