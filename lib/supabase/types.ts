/**
 * Database types for Supabase
 * Per PINATA_RESTRUCTURING.md: Database stores pointers only, no analytics
 */

// ============================================
// Table Row Types
// ============================================

/**
 * Snapshot index row as stored in database
 */
export interface SnapshotIndexRow {
  snapshot_id: string; // UUID
  user_fid: number;
  view: string; // mutual_circle | attention_circle | influence_circle
  time_window: string; // last_7d | last_30d | last_90d | all_time
  cid: string; // IPFS folder CID
  generated_at: string; // ISO timestamp
  graph_version: string; // "v1"
}

/**
 * Insert payload (snapshot_id and generated_at are auto-generated)
 */
export interface SnapshotIndexInsert {
  user_fid: number;
  view: string;
  time_window: string;
  cid: string;
  graph_version?: string; // Defaults to "v1"
}

// ============================================
// Database Schema (Supabase generated type format)
// ============================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      snapshot_index: {
        Row: {
          snapshot_id: string;
          user_fid: number;
          view: string;
          time_window: string;
          cid: string;
          generated_at: string;
          graph_version: string;
        };
        Insert: {
          snapshot_id?: string;
          user_fid: number;
          view: string;
          time_window: string;
          cid: string;
          generated_at?: string;
          graph_version?: string;
        };
        Update: {
          snapshot_id?: string;
          user_fid?: number;
          view?: string;
          time_window?: string;
          cid?: string;
          generated_at?: string;
          graph_version?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
