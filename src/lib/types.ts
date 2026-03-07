export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  credits: number;
  brand_voice: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface CreditTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: TransactionType;
  description: string | null;
  reference_id: string | null;
  balance_after: number;
  created_at: string;
}

export interface CreditPack {
  id: string;
  name: string;
  credits: number;
  price_zar: number;
  price_usd: number;
  discount_percent: number;
  active: boolean;
  sort_order: number;
  created_at: string;
}

export interface Generation {
  id: string;
  user_id: string;
  type: GenerationType;
  status: GenerationStatus;
  credits_used: number;
  input_topic: string;
  input_duration: number | null;
  input_style: string | null;
  tone: ContentTone | null;
  voice_tier: VoiceTier | null;
  image_tier: ImageTier | null;
  motion_tier: MotionTier | null;
  scene_count: number | null;
  use_brand_voice: boolean;
  affiliate_link_ids: string[] | null;
  output_url: string | null;
  output_metadata: Record<string, unknown> | null;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface AffiliateLink {
  id: string;
  user_id: string;
  label: string;
  url: string;
  is_active: boolean;
  created_at: string;
}

export interface GenerationConfig {
  type: GenerationType;
  duration?: number;
  tone?: ContentTone;
  voiceTier?: VoiceTier;
  imageTier?: ImageTier;
  motionTier?: MotionTier;
  sceneCount?: number;
}

export type VoiceTier = 'standard' | 'premium' | 'ultra';
export type ImageTier = 'standard' | 'premium' | 'ultra';
export type MotionTier = 'static' | 'ai' | 'premium';
export type GenerationType = 'mp3' | 'video' | 'description' | 'thumbnail';
export type ContentTone = 'sleep' | 'asmr' | 'bedtime_story' | 'storytelling' | 'documentary' | 'educational' | 'podcast' | 'youtube_hype';
export type TransactionType = 'purchase' | 'generation' | 'refund' | 'bonus';
export type GenerationStatus = 'pending' | 'processing' | 'complete' | 'failed';
