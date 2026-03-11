'use client';

import { Settings } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ProfileForm } from '@/components/settings/profile-form';
import { BrandVoiceWizard } from '@/components/settings/brand-voice-wizard';
import { AffiliateLinkManager } from '@/components/settings/affiliate-link-manager';

export function SettingsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-neutral-800/50">
          <Settings className="size-4 text-neutral-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Settings</h1>
          <p className="text-xs text-neutral-400">
            Manage your profile, brand voice, and affiliate links.
          </p>
        </div>
      </div>

      <Tabs defaultValue="profile">
        <TabsList variant="line" className="border-b border-neutral-800 w-full justify-start">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="brand-voice">Brand Voice</TabsTrigger>
          <TabsTrigger value="affiliate-links">Affiliate Links</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="pt-6">
          <ProfileForm />
        </TabsContent>

        <TabsContent value="brand-voice" className="pt-6">
          <BrandVoiceWizard />
        </TabsContent>

        <TabsContent value="affiliate-links" className="pt-6">
          <AffiliateLinkManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
