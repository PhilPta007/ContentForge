import type { Profile, CreditTransaction, CreditPack, Generation, AffiliateLink } from '../types';

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & Pick<Profile, 'id' | 'email'>;
        Update: Partial<Profile>;
      };
      credit_transactions: {
        Row: CreditTransaction;
        Insert: Partial<CreditTransaction> & Pick<CreditTransaction, 'user_id' | 'amount' | 'type' | 'balance_after'>;
        Update: Partial<CreditTransaction>;
      };
      credit_packs: {
        Row: CreditPack;
        Insert: Partial<CreditPack> & Pick<CreditPack, 'name' | 'credits' | 'price_zar' | 'price_usd'>;
        Update: Partial<CreditPack>;
      };
      generations: {
        Row: Generation;
        Insert: Partial<Generation> & Pick<Generation, 'user_id' | 'type' | 'credits_used' | 'input_topic'>;
        Update: Partial<Generation>;
      };
      affiliate_links: {
        Row: AffiliateLink;
        Insert: Partial<AffiliateLink> & Pick<AffiliateLink, 'user_id' | 'label' | 'url'>;
        Update: Partial<AffiliateLink>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
