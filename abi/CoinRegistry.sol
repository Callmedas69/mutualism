// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title CoinRegistry
 * @notice Registry for tracking Zora coins created through the platform
 * @dev Uses signature verification to ensure only platform-authorized registrations
 */
contract CoinRegistry is Ownable {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    /// @notice Emitted when a coin is registered
    event CoinRegistered(
        address indexed creator,
        address indexed coin,
        uint256 timestamp
    );

    /// @notice Emitted when the signer is updated
    event SignerUpdated(address indexed oldSigner, address indexed newSigner);

    /// @notice The address authorized to sign registration messages
    address public signer;

    /// @dev Mapping from creator address to array of coin addresses
    mapping(address => address[]) private _creatorCoins;

    /// @dev Mapping to track if a coin is already registered
    mapping(address => bool) private _isRegistered;

    /// @dev Array of all registered coins (for pagination)
    address[] private _allCoins;

    /// @dev Mapping from coin to creator
    mapping(address => address) private _coinCreator;

    constructor(address _signer) Ownable(msg.sender) {
        require(_signer != address(0), "Invalid signer address");
        signer = _signer;
        emit SignerUpdated(address(0), _signer);
    }

    /**
     * @notice Register a coin with platform authorization
     * @param coin The Zora coin contract address to register
     * @param signature Platform signature authorizing this registration
     */
    function registerCoin(address coin, bytes calldata signature) external {
        require(coin != address(0), "Invalid coin address");
        require(!_isRegistered[coin], "Coin already registered");

        // Create message hash: keccak256(creator, coin, chainId)
        bytes32 messageHash = keccak256(
            abi.encodePacked(msg.sender, coin, block.chainid)
        );

        // Verify signature
        bytes32 ethSignedHash = messageHash.toEthSignedMessageHash();
        address recoveredSigner = ethSignedHash.recover(signature);
        require(recoveredSigner == signer, "Invalid signature");

        // Register the coin
        _isRegistered[coin] = true;
        _creatorCoins[msg.sender].push(coin);
        _allCoins.push(coin);
        _coinCreator[coin] = msg.sender;

        emit CoinRegistered(msg.sender, coin, block.timestamp);
    }

    /**
     * @notice Update the authorized signer address
     * @param newSigner The new signer address
     */
    function setSigner(address newSigner) external onlyOwner {
        require(newSigner != address(0), "Invalid signer address");
        address oldSigner = signer;
        signer = newSigner;
        emit SignerUpdated(oldSigner, newSigner);
    }

    /**
     * @notice Get all coins created by an address
     * @param creator The creator's wallet address
     * @return Array of coin contract addresses
     */
    function getCoinsByCreator(address creator) external view returns (address[] memory) {
        return _creatorCoins[creator];
    }

    /**
     * @notice Get the number of coins created by an address
     * @param creator The creator's wallet address
     * @return Number of coins
     */
    function getCoinCount(address creator) external view returns (uint256) {
        return _creatorCoins[creator].length;
    }

    /**
     * @notice Check if a coin is already registered
     * @param coin The coin contract address
     * @return True if registered
     */
    function isRegistered(address coin) external view returns (bool) {
        return _isRegistered[coin];
    }

    /**
     * @notice Get coins with pagination
     * @param offset Starting index
     * @param limit Max coins to return
     * @return coins Array of coin addresses
     * @return creators Array of creator addresses
     * @return total Total number of coins
     */
    function getCoins(uint256 offset, uint256 limit) external view returns (
        address[] memory coins,
        address[] memory creators,
        uint256 total
    ) {
        total = _allCoins.length;
        if (offset >= total) {
            return (new address[](0), new address[](0), total);
        }

        uint256 end = offset + limit;
        if (end > total) end = total;
        uint256 length = end - offset;

        coins = new address[](length);
        creators = new address[](length);

        for (uint256 i = 0; i < length; i++) {
            coins[i] = _allCoins[offset + i];
            creators[i] = _coinCreator[coins[i]];
        }
    }

    /**
     * @notice Get total registered coin count
     * @return Number of registered coins
     */
    function getTotalCoins() external view returns (uint256) {
        return _allCoins.length;
    }

    /**
     * @notice Get creator of a coin
     * @param coin The coin contract address
     * @return Creator address
     */
    function coinCreator(address coin) external view returns (address) {
        return _coinCreator[coin];
    }
}
