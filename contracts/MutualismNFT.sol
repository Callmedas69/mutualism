// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/// @title MutualismNFT
/// @author Quotient Mutual
/// @notice ERC721 contract for minting social graph snapshots as NFTs
/// @dev Implements Phase 2 of REUSABLE_SNAPSHOT.md
/// @custom:security-contact security@mutualism.geoart.studio
contract MutualismNFT is ERC721, Ownable, ReentrancyGuard, Pausable {
    // ============================================
    // Types
    // ============================================

    /// @notice Snapshot view types (matches frontend SnapshotView)
    enum SnapshotView {
        MUTUAL_CIRCLE,
        ATTENTION_CIRCLE,
        INFLUENCE_CIRCLE
    }

    /// @notice On-chain metadata per token
    struct SnapshotData {
        SnapshotView viewType;
        uint256 fid;
        uint256 graphVersion;
        uint256 mintedAt;
        string metadataUri;
    }

    // ============================================
    // State
    // ============================================

    /// @notice Current mint price in wei
    uint256 public mintPrice;

    /// @notice Maximum number of tokens that can be minted
    uint256 public maxSupply;

    /// @notice Next token ID to mint
    uint256 private _nextTokenId;

    /// @notice Collection-level metadata URI (for OpenSea)
    string private _contractUri;

    /// @notice Mapping from token ID to snapshot data
    mapping(uint256 => SnapshotData) private _snapshots;

    // ============================================
    // Events
    // ============================================

    /// @notice Emitted when a snapshot is minted
    event SnapshotMinted(
        uint256 indexed tokenId,
        address indexed minter,
        uint256 indexed fid,
        SnapshotView viewType
    );

    /// @notice Emitted when mint price is updated
    event MintPriceUpdated(uint256 oldPrice, uint256 newPrice);

    /// @notice Emitted when ETH is withdrawn
    event Withdrawn(address indexed to, uint256 amount);

    /// @notice Emitted when contract URI is updated
    event ContractURIUpdated(string newUri);

    /// @notice Emitted when max supply is updated
    event MaxSupplyUpdated(uint256 oldMaxSupply, uint256 newMaxSupply);

    // ============================================
    // Constructor
    // ============================================

    /// @notice Initialize the contract
    /// @param initialOwner Address of the contract owner
    constructor(address initialOwner)
        ERC721("Mutualism Snapshot", "MUTUAL")
        Ownable(initialOwner)
    {
        mintPrice = 0.0005 ether;
        maxSupply = 10000;
    }

    // ============================================
    // Public Functions
    // ============================================

    /// @notice Mint a new snapshot NFT
    /// @param viewType The snapshot view type
    /// @param fid The Farcaster ID of the user
    /// @param graphVersion The version of the graph algorithm
    /// @param metadataUri The IPFS URI of the metadata JSON
    /// @return tokenId The ID of the minted token
    function mint(
        SnapshotView viewType,
        uint256 fid,
        uint256 graphVersion,
        string calldata metadataUri
    ) external payable nonReentrant whenNotPaused returns (uint256) {
        require(_nextTokenId < maxSupply, "Max supply reached");
        require(msg.value >= mintPrice, "Insufficient payment");
        require(bytes(metadataUri).length > 0, "Empty metadata URI");

        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);

        _snapshots[tokenId] = SnapshotData({
            viewType: viewType,
            fid: fid,
            graphVersion: graphVersion,
            mintedAt: block.timestamp,
            metadataUri: metadataUri
        });

        emit SnapshotMinted(tokenId, msg.sender, fid, viewType);

        // Refund excess payment
        if (msg.value > mintPrice) {
            (bool refundSuccess, ) = payable(msg.sender).call{value: msg.value - mintPrice}("");
            require(refundSuccess, "Refund failed");
        }

        return tokenId;
    }

    /// @notice Get the metadata URI for a token
    /// @param tokenId The token ID
    /// @return The IPFS metadata URI
    function tokenURI(uint256 tokenId)
        public
        view
        override
        returns (string memory)
    {
        _requireOwned(tokenId);
        return _snapshots[tokenId].metadataUri;
    }

    /// @notice Get the on-chain snapshot data for a token
    /// @param tokenId The token ID
    /// @return The snapshot data struct
    function getSnapshotData(uint256 tokenId)
        external
        view
        returns (SnapshotData memory)
    {
        _requireOwned(tokenId);
        return _snapshots[tokenId];
    }

    /// @notice Get the total number of tokens minted
    /// @return The total supply
    function totalSupply() external view returns (uint256) {
        return _nextTokenId;
    }

    /// @notice Get collection-level metadata URI (OpenSea standard)
    /// @return The contract metadata URI
    function contractURI() public view returns (string memory) {
        return _contractUri;
    }

    // ============================================
    // Owner Functions
    // ============================================

    /// @notice Update the mint price
    /// @param newPrice The new mint price in wei
    function setMintPrice(uint256 newPrice) external onlyOwner {
        uint256 oldPrice = mintPrice;
        mintPrice = newPrice;
        emit MintPriceUpdated(oldPrice, newPrice);
    }

    /// @notice Update the maximum supply
    /// @param newMaxSupply The new maximum supply
    function setMaxSupply(uint256 newMaxSupply) external onlyOwner {
        require(newMaxSupply >= _nextTokenId, "Cannot set below current supply");
        uint256 oldMaxSupply = maxSupply;
        maxSupply = newMaxSupply;
        emit MaxSupplyUpdated(oldMaxSupply, newMaxSupply);
    }

    /// @notice Update the collection metadata URI
    /// @param newUri The new contract URI
    function setContractURI(string calldata newUri) external onlyOwner {
        _contractUri = newUri;
        emit ContractURIUpdated(newUri);
    }

    /// @notice Pause minting
    function pause() external onlyOwner {
        _pause();
    }

    /// @notice Unpause minting
    function unpause() external onlyOwner {
        _unpause();
    }

    /// @notice Withdraw all ETH from the contract
    function withdraw() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");

        address recipient = owner();
        (bool success, ) = payable(recipient).call{value: balance}("");
        require(success, "Withdraw failed");

        emit Withdrawn(recipient, balance);
    }
}
