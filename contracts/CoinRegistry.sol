// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title CoinRegistry
 * @notice Simple registry for tracking Zora coins created by users
 * @dev Minimal contract - no ownership, no upgradeability, no reentrancy risk
 */
contract CoinRegistry {
    /// @notice Emitted when a coin is registered
    /// @param creator The wallet address that created the coin
    /// @param coin The Zora coin contract address
    /// @param timestamp Block timestamp of registration
    event CoinRegistered(
        address indexed creator,
        address indexed coin,
        uint256 timestamp
    );

    /// @dev Mapping from creator address to array of coin addresses
    mapping(address => address[]) private _creatorCoins;

    /**
     * @notice Register a coin for the caller
     * @param coin The Zora coin contract address to register
     */
    function registerCoin(address coin) external {
        require(coin != address(0), "Invalid coin address");
        _creatorCoins[msg.sender].push(coin);
        emit CoinRegistered(msg.sender, coin, block.timestamp);
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
}
