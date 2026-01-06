// Quotient API Types based on OpenAPI spec

export interface MutualUser {
  fid: number;
  username: string;
  pfp_url: string | null;
  rank: number;
  combined_score: number;
  attention_score: number;
  influence_score: number;
}

export interface ConnectionUser {
  fid: number;
  username: string;
  pfp_url: string | null;
  rank: number;
  score: number;
  interaction_count: number;
  is_mutual?: boolean;
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

// Shared connections (warm intro) types
export interface SharedConnectionsTarget {
  fid: number;
  username: string;
  display_name: string | null;
  pfp_url: string | null;
}

export interface SharedMutualUser extends MutualUser {
  target_combined_score: number;
}

export interface SharedConnectionsResponse {
  target: SharedConnectionsTarget;
  shared: SharedMutualUser[];
  count: number;
  userAlreadyKnowsTarget: boolean;
}
