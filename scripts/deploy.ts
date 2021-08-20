import hardhat from 'hardhat'
import type { MinimalMultisig } from '../types'

async function main () {
  const multisigFactory = await hardhat.ethers.getContractFactory('MinimalMultisig')
  const MultisigWallet: MinimalMultisig = await multisigFactory.deploy()

  await MultisigWallet.deployed()

  console.log('Multisig deployed to:', MultisigWallet.address)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
