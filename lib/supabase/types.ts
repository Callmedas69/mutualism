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
// Notification System Types
// ============================================

/**
 * Notification token row - stores Farcaster push notification tokens
 */
export interface NotificationTokenRow {
  id: string; // UUID
  fid: number;
  token: string;
  url: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationTokenInsert {
  fid: number;
  token: string;
  url: string;
  enabled?: boolean;
}

export interface NotificationTokenUpdate {
  token?: string;
  url?: string;
  enabled?: boolean;
  updated_at?: string;
}

/**
 * Notification history row - audit trail for sent notifications
 */
export interface NotificationHistoryRow {
  id: string; // UUID
  fid: number;
  notification_type: string;
  title: string;
  body: string;
  sent_at: string;
  success: boolean;
}

export interface NotificationHistoryInsert {
  fid: number;
  notification_type: string;
  title: string;
  body: string;
  success?: boolean;
}

/**
 * User graph state row - tracks user's graph state for change detection
 */
export interface UserGraphStateRow {
  id: string; // UUID
  fid: number;
  mutual_count: number;
  last_checked_at: string;
  last_notified_at: string | null;
  updated_at: string;
}

export interface UserGraphStateInsert {
  fid: number;
  mutual_count?: number;
}

export interface UserGraphStateUpdate {
  mutual_count?: number;
  last_checked_at?: string;
  last_notified_at?: string;
  updated_at?: string;
}

// ============================================
// Connection Rank History Types
// ============================================

/**
 * Connection rank history row - tracks rank position changes over time
 */
export interface ConnectionRankHistoryRow {
  id: string; // UUID
  viewer_fid: number; // The user viewing their connections
  connection_fid: number; // The connection being tracked
  connection_type: string; // "mutual" | "attention" | "influence"
  rank: number; // Rank at snapshot time
  score: number; // Score at snapshot time
  recorded_at: string; // ISO timestamp
  recorded_date: string; // Date string (YYYY-MM-DD)
}

export interface ConnectionRankHistoryInsert {
  viewer_fid: number;
  connection_fid: number;
  connection_type: "mutual" | "attention" | "influence";
  rank: number;
  score: number;
}

// ============================================
// Share Verification Types
// ============================================

/**
 * Share verification row - tracks users who have shared their graph
 */
export interface ShareVerificationRow {
  id: string; // UUID
  fid: number;
  cast_hash: string;
  cast_url: string | null;
  verified_at: string;
}

export interface ShareVerificationInsert {
  fid: number;
  cast_hash: string;
  cast_url?: string | null;
}

export interface ShareVerificationUpdate {
  cast_hash?: string;
  cast_url?: string | null;
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
      notification_tokens: {
        Row: {
          id: string;
          fid: number;
          token: string;
          url: string;
          enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          fid: number;
          token: string;
          url: string;
          enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          fid?: number;
          token?: string;
          url?: string;
          enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      notification_history: {
        Row: {
          id: string;
          fid: number;
          notification_type: string;
          title: string;
          body: string;
          sent_at: string;
          success: boolean;
        };
        Insert: {
          id?: string;
          fid: number;
          notification_type: string;
          title: string;
          body: string;
          sent_at?: string;
          success?: boolean;
        };
        Update: {
          id?: string;
          fid?: number;
          notification_type?: string;
          title?: string;
          body?: string;
          sent_at?: string;
          success?: boolean;
        };
        Relationships: [];
      };
      user_graph_state: {
        Row: {
          id: string;
          fid: number;
          mutual_count: number;
          last_checked_at: string;
          last_notified_at: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          fid: number;
          mutual_count?: number;
          last_checked_at?: string;
          last_notified_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          fid?: number;
          mutual_count?: number;
          last_checked_at?: string;
          last_notified_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      share_verification: {
        Row: {
          id: string;
          fid: number;
          cast_hash: string;
          cast_url: string | null;
          verified_at: string;
        };
        Insert: {
          id?: string;
          fid: number;
          cast_hash: string;
          cast_url?: string | null;
          verified_at?: string;
        };
        Update: {
          id?: string;
          fid?: number;
          cast_hash?: string;
          cast_url?: string | null;
          verified_at?: string;
        };
        Relationships: [];
      };
      connection_rank_history: {
        Row: {
          id: string;
          viewer_fid: number;
          connection_fid: number;
          connection_type: string;
          rank: number;
          score: number;
          recorded_at: string;
          recorded_date: string;
        };
        Insert: {
          id?: string;
          viewer_fid: number;
          connection_fid: number;
          connection_type: string;
          rank: number;
          score: number;
          recorded_at?: string;
          recorded_date?: string;
        };
        Update: {
          id?: string;
          viewer_fid?: number;
          connection_fid?: number;
          connection_type?: string;
          rank?: number;
          score?: number;
          recorded_at?: string;
          recorded_date?: string;
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
