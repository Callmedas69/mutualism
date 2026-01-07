/**
 * Pinata/IPFS module re-exports
 *
 * IPFS repository: lib/repositories/ipfs.ts
 * Metadata generation: lib/services/coin-generator.ts
 */

// ============================================
// Snapshot Functions (v1)
// ============================================

// Upload functions
export {
  uploadSnapshot,
  type SnapshotUploadParams,
} from "./repositories/ipfs";

// Metadata generation
export {
  generateSnapshotMetadata,
  mapGraphTypeToView,
  generateFolderName,
  generateShareFilename,
} from "./services/coin-generator";

// ============================================
// Legacy Exports (for backward compatibility)
// ============================================

export {
  uploadImageToIPFS,
  uploadMetadataToIPFS,
  type UploadResult,
} from "./repositories/ipfs";

export { generateMetadata } from "./services/coin-generator";
