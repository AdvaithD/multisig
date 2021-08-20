// SPDX-License-Identifier: MIT
pragma solidity 0.8.0;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/draft-EIP712.sol";

contract MinimalMultisig is EIP712 {
    using ECDSA for bytes32;

    struct TxnRequest {
        address to;
        uint256 value;
        bytes data;
        uint256 nonce;
    }

    address[] public owners;
    mapping(address => bool) isSigner;
    uint256 public nonce;
    uint256 public threshold;

    constructor() {
        threshold = 1;
    }

    receive() external payable {}

} 

