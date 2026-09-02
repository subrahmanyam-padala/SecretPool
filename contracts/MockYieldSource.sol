// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@fhevm/solidity/lib/FHE.sol";
import "./ConfidentialTestToken.sol";
import "./ConfidentialPrizePool.sol";

contract MockYieldSource {
    ConfidentialTestToken public token;

    constructor(address _token) {
        token = ConfidentialTestToken(_token);
    }

    function generateYield(address pool, uint64 amount) external {
        // In a real scenario, yield is generated from investing pool assets.
        // Here we just mock it by minting new test tokens to the pool.
        token.mint(pool, amount);
        
        // Notify the pool that new yield was added
        ConfidentialPrizePool(pool).addYield(amount);
    }
}
