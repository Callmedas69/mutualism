/**
 * Re-exports for backwards compatibility
 * IPFS repository is in lib/repositories/ipfs.ts
 * Metadata generation is in lib/services/coin-generator.ts
 */

// IPFS upload functions
export {
  uploadImageToIPFS,
  uploadMetadataToIPFS,
  type UploadResult,
} from "./repositories/ipfs";

// Metadata generation (business logic)
export { generateMetadata } from "./services/coin-generator";
