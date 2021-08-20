# Minimal Multisig Contract

Simple multi-sig smart contract wallet implemented using off-chain signatures. The signature scheme is based on [EIP712](https://eips.ethereum.org/EIPS/eip-712)

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, a sample script that deploys that contract, and an example of a task implementation, which simply lists the available accounts.

**Note:** This is a very basic implementation, as opposed to [Gnosis Safe](https://gnosis-safe.io/), which should be used for more serious production use cases.

## Installation

Assuming a standard NodeJS environment, install dependencies, followed by compiling contracts (generates typescript bindings).

```bash
yarn install
yarn compile
```
## Usage

```javascript
import {signMessage} from './util/signing-util.js'

const main = async () => {
    // payload to be signed
    const params = {
        to: '0x...', // destination address
        value: '', // ethereum value
        data: '0x...', // calldata
        nonce: '1', // nonce
    }
    
    // retrieve ethers signer
    const [signer] = await ethers.getSigner()

    // sign and get EIP712 compliant signature
    const signature = await signMessage(signer, Multisig.address, params)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

## Tests

```bash
yarn test
```
Should return test out for: Signing Logic, Access / Control, and Execution.

```
  EIP712 Multisig Wallet
    Signing Logic
      ✓ should recover off-chain signer's message (42ms)
    Access / Control
      ✓ should add a second signer to create a 1-of-2 multisig
      ✓ should create 2-of-3 multisig (62ms)
      ✓ should revert when m > n (59ms)
      ✓ should revert when non-owner calls addAdditionalOwners()
      ✓ should revert when adding an already existing signer (46ms)
    Execution
      ✓ should send ETH from 1-of-3 multisig (92ms)
      ✓ should call function selector from a 2-of-3 multisig (65ms)
      ✓ should call function selector from a 2-of-3 multisig with arguments (72ms)
      ✓ should revert on invalid # of signatures (53ms)
      ✓ should revert when to == zeroAddress


  11 passing (2s)
```

- The test suite heavily utilizes functions exported from `./util/signing-util` which is used to sign messages off-chain.

## Licence
[MIT](https://choosealicense.com/licenses/mit/)
