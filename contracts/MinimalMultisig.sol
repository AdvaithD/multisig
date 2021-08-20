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

    constructor() EIP712("MinimalMultisig", "1.0.0") {
        threshold = 1;
    }

    receive() external payable {}

    // @dev - returns hash of data to be signed
    function typedDataHash(TxnRequest memory params) public view returns (bytes32) {
        bytes32 digest = _hashTypedDataV4(
            keccak256(
                abi.encode(
                    keccak256("TxnRequest(address to,uint256 value,bytes data,uint256 nonce)"),
                    params.to,
                    params.value,
                    keccak256(params.data),
                    params.nonce
                )
            )
        );
        return digest;
    }

    function recoverSigner(address _to, uint256 _value, bytes memory _data, uint256 _nonce, bytes memory userSignature) public view returns (address) {
        TxnRequest memory params = TxnRequest({
            to: _to,
            value: _value,
            data: _data,
            nonce: _nonce
        });
        bytes32 digest = typedDataHash(params);
        return ECDSA.recover(digest, userSignature);
    }

} 

