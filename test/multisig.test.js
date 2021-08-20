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

  describe('Access / Control', () => {
    it('should add a second signer to create a 1-of-2 multisig', async () => {
      const newSignersAddress = await second.getAddress()
      await expect(await Multisig.connect(first).addAdditionalOwners(newSignersAddress, 1))
        .to.emit(Multisig, 'NewSigner')
        .withArgs(newSignersAddress, 1)
    })

    it('should create 2-of-3 multisig', async () => {
      const [secondSigner, thirdSigner] = [await second.getAddress(), await third.getAddress()]
      await Multisig.connect(first).addAdditionalOwners(secondSigner, 2)
      await Multisig.connect(first).addAdditionalOwners(thirdSigner, 2)

      expect(await Multisig.threshold()).to.equal(2)
      expect(await Multisig.getOwnerCount()).to.equal(3)
    })

    it('should revert when m > n', async () => {
      // attempt to create 3 of 2 multisig
      await Multisig.connect(first).addAdditionalOwners(await second.getAddress(), 1) // 1 of two
      await Multisig.connect(first).addAdditionalOwners(await third.getAddress(), 2) // two of three
      await expect(Multisig.connect(first).addAdditionalOwners(await fourth.getAddress(), 10)).to.be.revertedWith('Threshold cannot exceed number of signers.')
    })

    it('should revert when non-owner calls addAdditionalOwners()', async () => {
      // attempt to add signer from a non-signer account
      await expect(Multisig.connect(second).addAdditionalOwners(await second.getAddress(), 1)).to.be.revertedWith('Unauthorized. Owner only.')
    })

    it('should revert when adding an already existing signer', async () => {
      const duplicateAddress = await second.getAddress()
      await expect(await Multisig.connect(first).addAdditionalOwners(duplicateAddress, 1))
        .to.emit(Multisig, 'NewSigner')
        .withArgs(duplicateAddress, 1)

      // attempt to add signer again
      await expect(Multisig.connect(first).addAdditionalOwners(duplicateAddress, 1))
        .to.be.revertedWith('Address is already a signer.')
    })
  })
})
