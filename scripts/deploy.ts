import { Contract, ContractFactory } from 'ethers'
import { ethers } from 'hardhat'

async function main (): Promise<void> {
  const multisigFactory: ContractFactory = await ethers.getContractFactory('MinimalMultisig')
  const MultisigWallet: Contract = await multisigFactory.deploy()

  await MultisigWallet.deployed()

  console.log('Multisig deployed to:', MultisigWallet.address)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
