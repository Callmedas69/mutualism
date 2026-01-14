// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/// @title MutualismNFT
/// @author Quotient Mutual
/// @notice ERC721 contract for minting social graph snapshots as NFTs
/// @dev Implements Phase 2 of REUSABLE_SNAPSHOT.md
/// @custom:security-contact security@mutualism.geoart.studio
contract MutualismNFT is ERC721, Ownable, ReentrancyGuard, Pausable {
    using Strings for uint256;

    // ============================================
    // Constants
    // ============================================

    /// @notice Base64-encoded SVG preview image (on-chain, always resolvable)
    string private constant PREVIEW_SVG_BASE64 =
        "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iMjAwIiB6b29tQW5kUGFuPSJtYWduaWZ5IiB2aWV3Qm94PSIwIDAgMTUwIDE0OS45OTk5OTgiIGhlaWdodD0iMjAwIiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJ4TWlkWU1pZCBtZWV0IiB2ZXJzaW9uPSIxLjAiPjxkZWZzPjxnLz48L2RlZnM+PHJlY3QgeD0iLTE1IiB3aWR0aD0iMTgwIiBmaWxsPSIjZmZmZmZmIiB5PSItMTUiIGhlaWdodD0iMTc5Ljk5OTk5NyIgZmlsbC1vcGFjaXR5PSIxIi8+PHJlY3QgeD0iLTE1IiB3aWR0aD0iMTgwIiBmaWxsPSIjMTgxODFiIiB5PSItMTUiIGhlaWdodD0iMTc5Ljk5OTk5NyIgZmlsbC1vcGFjaXR5PSIxIi8+PGcgZmlsbD0iI2ZmNzUxZiIgZmlsbC1vcGFjaXR5PSIxIj48ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgzOC43ODMyMDIsIDEwMy4xMjQ5OTYpIj48Zz48cGF0aCBkPSJNIDI5LjA3ODEyNSAwIEwgMTguMTQwNjI1IC0zOC41MTU2MjUgTCAxNy44MTI1IC0zOC41MTU2MjUgQyAxNy45MTQwNjIgLTM3LjUxNTYyNSAxOC4wMTk1MzEgLTM2LjE2MDE1NiAxOC4xMjUgLTM0LjQ1MzEyNSBDIDE4LjIzODI4MSAtMzIuNzUzOTA2IDE4LjM0Mzc1IC0zMC45MTQwNjIgMTguNDM3NSAtMjguOTM3NSBDIDE4LjUzMTI1IC0yNi45NTcwMzEgMTguNTc4MTI1IC0yNS4wNTQ2ODggMTguNTc4MTI1IC0yMy4yMzQzNzUgTCAxOC41NzgxMjUgMCBMIDUuNzgxMjUgMCBMIDUuNzgxMjUgLTUzLjQ4NDM3NSBMIDI1LjAxNTYyNSAtNTMuNDg0Mzc1IEwgMzYuMTg3NSAtMTUuNTE1NjI1IEwgMzYuNDY4NzUgLTE1LjUxNTYyNSBMIDQ3LjQwNjI1IC01My40ODQzNzUgTCA2Ni42ODc1IC01My40ODQzNzUgTCA2Ni42ODc1IDAgTCA1My40MDYyNSAwIEwgNTMuNDA2MjUgLTIzLjQ1MzEyNSBDIDUzLjQwNjI1IC0yNS4xMjg5MDYgNTMuNDM3NSAtMjYuOTM3NSA1My41IC0yOC44NzUgQyA1My41NjI1IC0zMC44MjAzMTIgNTMuNjMyODEyIC0zMi42NTYyNSA1My43MTg3NSAtMzQuMzc1IEMgNTMuODAwNzgxIC0zNi4wOTM3NSA1My44Nzg5MDYgLTM3LjQ1MzEyNSA1My45NTMxMjUgLTM4LjQ1MzEyNSBMIDUzLjYyNSAtMzguNDUzMTI1IEwgNDIuODQzNzUgMCBaIE0gMjkuMDc4MTI1IDAgIi8+PC9nPjwvZz48L2c+PC9zdmc+";

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
        string imageUri;      // IPFS URI of the graph image (e.g., ipfs://Qm...)
        string animationUrl;  // IPFS URI of the full metadata JSON
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

    /// @notice Emitted when max supply is updated
    event MaxSupplyUpdated(uint256 oldMaxSupply, uint256 newMaxSupply);

    // ============================================
    // Constructor
    // ============================================

    /// @notice Initialize the contract
    /// @param initialOwner Address of the contract owner
    constructor(
        address initialOwner
    ) ERC721("Mutual Graph", "MUTUAL") Ownable(initialOwner) {
        mintPrice = 0.0005 ether;
        maxSupply = 10000;
        _nextTokenId = 1;
    }

    // ============================================
    // Public Functions
    // ============================================

    /// @notice Mint a new snapshot NFT
    /// @param viewType The snapshot view type
    /// @param fid The Farcaster ID of the user
    /// @param graphVersion The version of the graph algorithm
    /// @param imageUri The IPFS URI of the graph image (e.g., ipfs://Qm...)
    /// @param animationUrl The IPFS URI of the full metadata JSON
    /// @return tokenId The ID of the minted token
    function mint(
        SnapshotView viewType,
        uint256 fid,
        uint256 graphVersion,
        string calldata imageUri,
        string calldata animationUrl
    ) external payable nonReentrant whenNotPaused returns (uint256) {
        require(_nextTokenId <= maxSupply, "Max supply reached");
        require(msg.value >= mintPrice, "Insufficient payment");
        require(bytes(imageUri).length > 0, "Empty image URI");
        require(bytes(animationUrl).length > 0, "Empty animation URL");

        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);

        _snapshots[tokenId] = SnapshotData({
            viewType: viewType,
            fid: fid,
            graphVersion: graphVersion,
            mintedAt: block.timestamp,
            imageUri: imageUri,
            animationUrl: animationUrl
        });

        emit SnapshotMinted(tokenId, msg.sender, fid, viewType);

        // Refund excess payment
        if (msg.value > mintPrice) {
            (bool refundSuccess, ) = payable(msg.sender).call{
                value: msg.value - mintPrice
            }("");
            require(refundSuccess, "Refund failed");
        }

        return tokenId;
    }

    /// @notice Get the metadata for a token (on-chain JSON)
    /// @param tokenId The token ID
    /// @return Base64-encoded JSON metadata with on-chain SVG image
    function tokenURI(
        uint256 tokenId
    ) public view override returns (string memory) {
        _requireOwned(tokenId);
        SnapshotData memory data = _snapshots[tokenId];

        string memory json = string(
            abi.encodePacked(
                '{"name":"Mutual Graph #',
                tokenId.toString(),
                '","description":"A Farcaster social graph snapshot.","image":"',
                data.imageUri,
                '","animation_url":"',
                data.animationUrl,
                '","attributes":[{"trait_type":"FID","value":"',
                data.fid.toString(),
                '"},{"trait_type":"View","value":"',
                _viewTypeToString(data.viewType),
                '"},{"trait_type":"Graph Version","value":"',
                data.graphVersion.toString(),
                '"}]}'
            )
        );

        return
            string(
                abi.encodePacked(
                    "data:application/json;base64,",
                    Base64.encode(bytes(json))
                )
            );
    }

    /// @notice Get the on-chain snapshot data for a token
    /// @param tokenId The token ID
    /// @return The snapshot data struct
    function getSnapshotData(
        uint256 tokenId
    ) external view returns (SnapshotData memory) {
        _requireOwned(tokenId);
        return _snapshots[tokenId];
    }

    /// @notice Get the total number of tokens minted
    /// @return The total supply
    function totalSupply() external view returns (uint256) {
        return _nextTokenId - 1;
    }

    /// @notice Get collection-level metadata (on-chain JSON, OpenSea standard)
    /// @return Base64-encoded JSON collection metadata
    function contractURI() public pure returns (string memory) {
        string memory json = string(
            abi.encodePacked(
                '{"name":"Mutual Graph",',
                '"description":"Followers show popularity. Interaction shows reality.",',
                '"image":"data:image/svg+xml;base64,',
                PREVIEW_SVG_BASE64,
                '","external_link":"https://mutualism.geoart.studio"}'
            )
        );

        return
            string(
                abi.encodePacked(
                    "data:application/json;base64,",
                    Base64.encode(bytes(json))
                )
            );
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
        require(
            newMaxSupply >= _nextTokenId,
            "Cannot set below current supply"
        );
        uint256 oldMaxSupply = maxSupply;
        maxSupply = newMaxSupply;
        emit MaxSupplyUpdated(oldMaxSupply, newMaxSupply);
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

    // ============================================
    // Internal Functions
    // ============================================

    /// @notice Convert view type enum to string
    /// @param viewType The view type enum value
    /// @return The string representation
    function _viewTypeToString(
        SnapshotView viewType
    ) internal pure returns (string memory) {
        if (viewType == SnapshotView.MUTUAL_CIRCLE) return "Mutual Graph";
        if (viewType == SnapshotView.ATTENTION_CIRCLE) return "Attention Graph";
        if (viewType == SnapshotView.INFLUENCE_CIRCLE) return "Influence Graph";
        return "Unknown";
    }
}
