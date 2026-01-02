import { sdk } from "@farcaster/miniapp-sdk";

/**
 * Check if the app is running inside a Farcaster miniapp context
 * Uses iframe detection as a sync check
 */
export function isMiniAppEnvironment(): boolean {
  if (typeof window === "undefined") return false;

  // Check if we're in an iframe or webview (miniapp context)
  try {
    return window.self !== window.top;
  } catch {
    // If we can't access window.top, we're likely in a cross-origin iframe
    return true;
  }
}

/**
 * Get the miniapp SDK instance
 * Only use this after confirming we're in miniapp environment
 */
export function getMiniAppSdk() {
  return sdk;
}

/**
 * User info from miniapp context
 */
export interface MiniAppUser {
  fid: number;
  username?: string;
  displayName?: string;
  pfpUrl?: string;
}

/**
 * Extract user info from miniapp context
 * Note: sdk.context is a Promise, must be awaited
 */
export async function getMiniAppUser(): Promise<MiniAppUser | null> {
  try {
    const context = await sdk.context;
    if (!context?.user) return null;

    return {
      fid: context.user.fid,
      username: context.user.username,
      displayName: context.user.displayName,
      pfpUrl: context.user.pfpUrl,
    };
  } catch {
    return null;
  }
}

/**
 * Compose a cast from the miniapp
 */
export async function composeCast(text?: string, embeds?: string[]) {
  try {
    // SDK expects embeds as a tuple of up to 2 strings
    const embedsTuple = embeds?.slice(0, 2) as [] | [string] | [string, string] | undefined;
    await sdk.actions.composeCast({
      text,
      embeds: embedsTuple,
    });
  } catch (error) {
    console.error("Failed to compose cast:", error);
  }
}

/**
 * Close the miniapp
 */
export async function closeMiniApp() {
  try {
    await sdk.actions.close();
  } catch (error) {
    console.error("Failed to close miniapp:", error);
  }
}

/**
 * Open an external URL from miniapp
 */
export async function openUrl(url: string) {
  try {
    await sdk.actions.openUrl(url);
  } catch (error) {
    console.error("Failed to open URL:", error);
  }
}

/**
 * View a Farcaster profile
 */
export async function viewProfile(fid: number) {
  try {
    await sdk.actions.viewProfile({ fid });
  } catch (error) {
    console.error("Failed to view profile:", error);
  }
}
