// Quotient API Types based on OpenAPI spec

export interface MutualUser {
  fid: number;
  username: string;
  pfp_url: string | null;
  rank: number;
  combined_score: number;
  attention_score: number;
  influence_score: number;
  rank_change?: number | null; // positive = moved up, negative = moved down, 0 = same, null = new
}

export interface ConnectionUser {
  fid: number;
  username: string;
  pfp_url: string | null;
  rank: number;
  score: number;
  interaction_count: number;
  is_mutual?: boolean;
  rank_change?: number | null; // positive = moved up, negative = moved down, 0 = same, null = new
}

export interface ConnectionsAllResponse {
  fid: number;
  mutuals: MutualUser[];
  count: number;
}

export interface ConnectionsResponse {
  fid: number;
  attention: ConnectionUser[] | null;
  influence: ConnectionUser[] | null;
  mutuals: MutualUser[] | null;
}

export type ConnectionCategory = "attention" | "influence" | "mutuals";
