// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint64, externalEuint64, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface ITokenReceiver {
    function onTokenTransfer(address from, euint64 amount) external;
}

contract ConfidentialTestToken is ZamaEthereumConfig, Ownable {
    mapping(address => euint64) internal balances;
    euint64 internal encryptedTotalSupply;

    constructor() Ownable(msg.sender) {
        encryptedTotalSupply = FHE.asEuint64(0);
        FHE.allowThis(encryptedTotalSupply);
    }

    function mint(address to, uint64 amount) public onlyOwner {
        euint64 encryptedAmount = FHE.asEuint64(amount);
        balances[to] = FHE.add(balances[to], encryptedAmount);
        encryptedTotalSupply = FHE.add(encryptedTotalSupply, encryptedAmount);
        
        FHE.allowThis(balances[to]);
        FHE.allow(balances[to], to);
        FHE.allowThis(encryptedTotalSupply);
    }

    function transfer(address to, externalEuint64 encryptedAmount, bytes calldata inputProof) public returns (bool) {
        euint64 amount = FHE.fromExternal(encryptedAmount, inputProof);
        return _transfer(msg.sender, to, amount);
    }

    function transferEncrypted(address to, euint64 amount) public returns (bool) {
        return _transfer(msg.sender, to, amount);
    }

    function transferAndCall(address to, externalEuint64 encryptedAmount, bytes calldata inputProof) public returns (bool) {
        euint64 amount = FHE.fromExternal(encryptedAmount, inputProof);
        euint64 actualTransfer = _transferAndGetActual(msg.sender, to, amount);
        
        FHE.allow(actualTransfer, to);
        ITokenReceiver(to).onTokenTransfer(msg.sender, actualTransfer);
        
        return true;
    }

    function _transfer(address from, address to, euint64 amount) internal returns (bool) {
        _transferAndGetActual(from, to, amount);
        return true;
    }

    function _transferAndGetActual(address from, address to, euint64 amount) internal returns (euint64) {
        ebool canTransfer = FHE.le(amount, balances[from]);
        euint64 amountToTransfer = FHE.select(canTransfer, amount, FHE.asEuint64(0));
        
        balances[from] = FHE.sub(balances[from], amountToTransfer);
        balances[to] = FHE.add(balances[to], amountToTransfer);
        
        FHE.allowThis(balances[from]);
        FHE.allow(balances[from], from);
        FHE.allowThis(balances[to]);
        FHE.allow(balances[to], to);
        
        return amountToTransfer;
    }

    // Added for testing/verification of balances by users
    function getBalance() public view returns (euint64) {
        return balances[msg.sender];
    }
}
