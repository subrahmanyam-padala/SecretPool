// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint64, euint128, externalEuint64, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import "./ConfidentialTestToken.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract ConfidentialPrizePool is ZamaEthereumConfig, Ownable, ReentrancyGuard, ITokenReceiver {
    ConfidentialTestToken public token;
    
    mapping(address => euint64) public encryptedBalances;
    address[] public users;
    
    euint64 public encryptedTotalWeight;
    euint64 public currentPrizePool;
    uint256 public currentDrawId;
    mapping(uint256 => mapping(address => euint64)) public drawPrizes;

    constructor(address _token) Ownable(msg.sender) {
        token = ConfidentialTestToken(_token);
        encryptedTotalWeight = FHE.asEuint64(0);
        currentPrizePool = FHE.asEuint64(0);
        FHE.allowThis(encryptedTotalWeight);
        FHE.allowThis(currentPrizePool);
    }

    // Deposit via ITokenReceiver (invoked by Token's transferAndCall)
    function onTokenTransfer(address from, euint64 actualTransfer) external override {
        require(msg.sender == address(token), "Only token");
        
        if (users.length == 0 || !hasDeposited(from)) {
            users.push(from);
        }
        
        if (FHE.isInitialized(encryptedBalances[from])) {
            encryptedBalances[from] = FHE.add(encryptedBalances[from], actualTransfer);
        } else {
            encryptedBalances[from] = actualTransfer;
        }
        
        encryptedTotalWeight = FHE.add(encryptedTotalWeight, actualTransfer);
        
        FHE.allowThis(encryptedBalances[from]);
        FHE.allow(encryptedBalances[from], from);
        FHE.allowThis(encryptedTotalWeight);
    }

    function hasDeposited(address user) internal view returns (bool) {
        for(uint i=0; i<users.length; i++) {
            if (users[i] == user) return true;
        }
        return false;
    }

    function addYield(uint64 yieldAmount) external onlyOwner {
        euint64 encryptedYield = FHE.asEuint64(yieldAmount);
        currentPrizePool = FHE.add(currentPrizePool, encryptedYield);
        FHE.allowThis(currentPrizePool);
    }

    function triggerDraw() external nonReentrant {
        require(users.length > 0, "No participants");
        currentDrawId++;
        
        // Secure random winner selection using 128-bit scaling to prevent overflow and natively support encrypted weights
        euint128 R = FHE.asEuint128(FHE.randEuint64());
        euint128 W = FHE.asEuint128(encryptedTotalWeight);
        euint64 randomTicket = FHE.asEuint64(FHE.div(FHE.mul(R, W), (uint128)(1) << 64));
        
        euint64 cumulative = FHE.asEuint64(0);
        euint64 prizeToDistribute = currentPrizePool;
        
        for (uint i = 0; i < users.length; i++) {
            address user = users[i];
            euint64 weight_i = encryptedBalances[user];
            euint64 nextCumulative = FHE.add(cumulative, weight_i);
            
            ebool isGreaterOrEq = FHE.ge(randomTicket, cumulative);
            ebool isStrictlyLess = FHE.lt(randomTicket, nextCumulative);
            ebool won = FHE.and(isGreaterOrEq, isStrictlyLess);
            
            euint64 prize = FHE.select(won, prizeToDistribute, FHE.asEuint64(0));
            drawPrizes[currentDrawId][user] = prize;
            
            FHE.allowThis(prize);
            FHE.allow(prize, user);
            
            cumulative = nextCumulative;
        }
        
        currentPrizePool = FHE.asEuint64(0);
        FHE.allowThis(currentPrizePool);
    }
    
    function claimPrize(uint256 drawId) external nonReentrant {
        euint64 prizeToClaim = drawPrizes[drawId][msg.sender];
        
        encryptedBalances[msg.sender] = FHE.add(encryptedBalances[msg.sender], prizeToClaim);
        encryptedTotalWeight = FHE.add(encryptedTotalWeight, prizeToClaim);
        
        FHE.allowThis(encryptedBalances[msg.sender]);
        FHE.allow(encryptedBalances[msg.sender], msg.sender);
        FHE.allowThis(encryptedTotalWeight);
        
        // Nullify to prevent double claim (adds 0 to balance on subsequent calls)
        drawPrizes[drawId][msg.sender] = FHE.asEuint64(0);
        FHE.allowThis(drawPrizes[drawId][msg.sender]);
        FHE.allow(drawPrizes[drawId][msg.sender], msg.sender);
    }

    function withdraw(externalEuint64 encryptedAmount, bytes calldata inputProof) external nonReentrant {
        euint64 amountToWithdraw = FHE.fromExternal(encryptedAmount, inputProof);
        
        ebool canWithdraw = FHE.le(amountToWithdraw, encryptedBalances[msg.sender]);
        euint64 actualWithdraw = FHE.select(canWithdraw, amountToWithdraw, FHE.asEuint64(0));
        
        encryptedBalances[msg.sender] = FHE.sub(encryptedBalances[msg.sender], actualWithdraw);
        encryptedTotalWeight = FHE.sub(encryptedTotalWeight, actualWithdraw);
        
        FHE.allowThis(encryptedBalances[msg.sender]);
        FHE.allow(encryptedBalances[msg.sender], msg.sender);
        FHE.allowThis(encryptedTotalWeight);
        
        // Explicitly allow the Token contract to use the actualWithdraw ciphertext
        FHE.allow(actualWithdraw, address(token));
        
        // Transfer tokens back to user securely
        require(token.transferEncrypted(msg.sender, actualWithdraw), "Transfer failed");
    }

    // Added for testing/verification of balances by users
    function getBalance() public view returns (euint64) {
        return encryptedBalances[msg.sender];
    }

    function getDrawPrize(uint256 drawId) public view returns (euint64) {
        return drawPrizes[drawId][msg.sender];
    }
}
