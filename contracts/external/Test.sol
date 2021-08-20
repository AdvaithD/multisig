// SPDX-License-Identifier: MIT
pragma solidity 0.8.0;

contract Test {
  bool public didCall;
  string public value;

  function doCall() external {
    didCall = true;
  }

  function setValue(string memory _value) external {
    value = _value;
  }
}