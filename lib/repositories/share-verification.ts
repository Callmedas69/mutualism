/**
 * Share Verification Repository
 * Tracks users who have shared their graph (persists forever)
 */
import { supabase } from "@/lib/supabase/client";

export interface ShareVerification {
  fid: number;
  castHash: string;
  castUrl: string | null;
  verifiedAt: string;
}

/**
 * Get share verification status for a user
 */
export async function getShareVerification(
  fid: number
): Promise<ShareVerification | null> {
  try {
    const { data, error } = await supabase
      .from("share_verification")
      .select("fid, cast_hash, cast_url, verified_at")
      .eq("fid", fid)
      .maybeSingle();  // Use maybeSingle to avoid 406 when no row exists

    if (error || !data) return null;

    return {
      fid: data.fid,
      castHash: data.cast_hash,
      castUrl: data.cast_url,
      verifiedAt: data.verified_at,
    };
  } catch (err) {
    console.error("Failed to get share verification:", err);
    return null;
  }
}

/**
 * Save or update share verification for a user
 */
export async function upsertShareVerification(
  fid: number,
  castHash: string,
  castUrl?: string
): Promise<boolean> {
  try {
    const { error } = await supabase.from("share_verification").upsert(
      {
        fid,
        cast_hash: castHash,
        cast_url: castUrl || null,
      },
      { onConflict: "fid" }
    );

    if (error) {
      console.error("Failed to save share verification:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Failed to upsert share verification:", err);
    return false;
  }
}
