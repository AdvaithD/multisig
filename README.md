# Minimal Multisig Contract

Simple multi-sig smart contract wallet implemented using off-chain signatures. The signature scheme is based on [EIP712](https://eips.ethereum.org/EIPS/eip-712)

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, a sample script that deploys that contract, and an example of a task implementation, which simply lists the available accounts.

**Note:** This is a very basic implementation, as opposed to [Gnosis Safe](https://gnosis-safe.io/), which should be used for more serious production use cases.

## Installation

Assuming a standard NodeJS environment, install dependencies.

```bash
yarn install
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

- The test suite heavily utilizes functions exported from `./util/signing-util` which is used to sign messages off-chain.

## Licence
[MIT](https://choosealicense.com/licenses/mit/)
