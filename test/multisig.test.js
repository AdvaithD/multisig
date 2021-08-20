const { expect } = require('chai')
const { ethers } = require('hardhat')
const { signMessage } = require('../util/signing-util.js')

describe('Minimal Multisig', () => {
  let first, second, third, fourth, fifth, erc20Receiver, ethReceiver
  let Multisig

  const deployContracts = async () => {
    try {
      const multisigFactory = await ethers.getContractFactory('MinimalMultisig')
      Multisig = await multisigFactory.deploy()
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
      const params = {
        to: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
        value: ethers.utils.parseEther('10').toString(),
        data: '0x',
        nonce: '1'
      }

      const originalSigner = await first.getAddress()
      const signature = await signMessage(first, Multisig.address, params)

      const recoveredSigner = await Multisig.recoverSigner(params.to, params.value, params.data, params.nonce, signature)
      expect(recoveredSigner).to.equal(originalSigner)
    })
  })
})
