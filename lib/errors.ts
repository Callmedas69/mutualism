/**
 * Format transaction/wallet errors into user-friendly messages
 */
export function formatTransactionError(err: Error | string, maxLength = 100): string {
  const msg = typeof err === "string" ? err : err.message;

  // Common wallet errors
  if (msg.includes("rejected") || msg.includes("denied")) {
    return "Transaction was cancelled";
  }
  if (msg.includes("insufficient funds")) {
    return "Insufficient ETH balance";
  }

  // Network errors
  if (msg.includes("network") || msg.includes("fetch")) {
    return "Network error. Please check your connection.";
  }

  // Truncate long messages
  if (msg.length > maxLength) {
    return msg.slice(0, maxLength) + "...";
  }

  return msg;
}

/**
 * Shorter error format for compact UIs (miniapp)
 */
export function formatTransactionErrorShort(err: Error | string): string {
  const msg = typeof err === "string" ? err : err.message;

  if (msg.includes("rejected") || msg.includes("denied")) {
    return "Transaction cancelled";
  }
  if (msg.includes("insufficient funds")) {
    return "Insufficient ETH";
  }
  if (msg.includes("network") || msg.includes("fetch")) {
    return "Network error";
  }
  if (msg.length > 60) {
    return msg.slice(0, 60) + "...";
  }

  return msg;
}
