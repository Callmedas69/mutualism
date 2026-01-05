/**
 * Re-exports for backwards compatibility
 * Business logic is in lib/services/coin-generator.ts
 * SDK wrapper is in lib/sdk/zora.ts
 */

// Business logic (coin name/symbol generation)
export {
  generateCoinName,
  generateSymbol,
  getShareText,
} from "./services/coin-generator";

// SDK wrapper (transaction preparation, parsing)
export {
  prepareCoinCreation,
  getCoinUrl,
  parseCoinAddressFromReceipt,
  PLATFORM_WALLET,
  PLATFORM_REFERRER,
  TOKENIZE_FEE,
  type ZoraTransactionParams,
} from "./sdk/zora";
