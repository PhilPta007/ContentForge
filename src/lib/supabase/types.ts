import type { Profile, CreditTransaction, CreditPack, Generation, AffiliateLink } from '../types';

type GenericRelationship = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne: boolean;
  referencedRelation: string;
  referencedColumns: string[];
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & Pick<Profile, 'id' | 'email'>;
        Update: Partial<Profile>;
        Relationships: GenericRelationship[];
      };
      credit_transactions: {
        Row: CreditTransaction;
        Insert: Partial<CreditTransaction> & Pick<CreditTransaction, 'user_id' | 'amount' | 'type' | 'balance_after'>;
        Update: Partial<CreditTransaction>;
        Relationships: GenericRelationship[];
      };
      credit_packs: {
        Row: CreditPack;
        Insert: Partial<CreditPack> & Pick<CreditPack, 'name' | 'credits' | 'price_zar' | 'price_usd'>;
        Update: Partial<CreditPack>;
        Relationships: GenericRelationship[];
      };
      generations: {
        Row: Generation;
        Insert: Partial<Generation> & Pick<Generation, 'user_id' | 'type' | 'credits_used' | 'input_topic'>;
        Update: Partial<Generation>;
        Relationships: GenericRelationship[];
      };
      affiliate_links: {
        Row: AffiliateLink;
        Insert: Partial<AffiliateLink> & Pick<AffiliateLink, 'user_id' | 'label' | 'url'>;
        Update: Partial<AffiliateLink>;
        Relationships: GenericRelationship[];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      delete_own_account: {
        Args: Record<string, never>;
        Returns: undefined;
      };
      add_credits: {
        Args: {
          p_user_id: string;
          p_amount: number;
          p_type: string;
          p_description: string;
          p_reference_id: string | null;
        };
        Returns: number;
      };
      deduct_credits: {
        Args: {
          p_user_id: string;
          p_amount: number;
          p_type: string;
          p_description: string;
          p_reference_id: string | null;
        };
        Returns: number;
      };
      transaction_exists: {
        Args: {
          p_reference_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
