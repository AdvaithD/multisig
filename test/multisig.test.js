const { expect } = require('chai')
const { ethers } = require('hardhat')
const { signMessage } = require('../util/signing-util.js')

describe('Minimal Multisig', () => {
  let first, second, third, fourth, fifth, erc20Receiver, ethReceiver
  let Multisig

  const deployContracts = async () => {
    try {
      const multisigFactory = await ethers.getContractFactory('MinimalMultisig')
      Multisig = await multisig.deploy()
      await Multisig.deployed()
    } catch (error) {
      throw new Error('Error deploying contract: ', error)
    }
  }

  beforeEach(async () => {
    [first, second, third, fourth, fifth] = await ethers.getSigners()
    await deployContracts()
  })

  describe('Signing Logic', () => {
    it("should recover off-chain signer's message", async () => {
      // const signature = await signMessage();
    })
  })
})
