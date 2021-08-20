import { ethers } from 'hardhat'
import { Signer } from 'ethers'
import { signMessage, signMessages, getEthBalance } from '../util/signing-util'

import type { MinimalMultisig, Test } from '../types'
const { expect } = require('chai')

describe('EIP712 Multisig Wallet', () => {
  // run('compile')
  let first: Signer
  let second: Signer
  let third: Signer
  let fourth: Signer
  let fifth: Signer
  let erc20Receiver: Signer
  let ethReceiver: Signer
  let Multisig: MinimalMultisig
  let Test: Test

  const deployContracts = async () => {
    try {
      const multisigFactory = await ethers.getContractFactory('MinimalMultisig')
      Multisig = await multisigFactory.deploy() as MinimalMultisig
      await Multisig.deployed()

      const testFactory = await ethers.getContractFactory('Test')
      Test = await testFactory.deploy() as Test
      await Test.deployed()
    } catch (error) {
      throw new Error(error)
    }
  }

  beforeEach(async () => {
    [first, second, third, fourth, fifth, erc20Receiver, ethReceiver] = await ethers.getSigners()
    await deployContracts()
  })

  describe('Signing Logic', () => {
    it("should recover off-chain signer's message", async () => {
      const params = {
        to: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
        value: ethers.utils.parseEther('10').toString(),
        data: '0x'
      }

      const originalSigner = await first.getAddress()
      const signature = await signMessage(first, Multisig.address, params)

      const recoveredSigner = await Multisig.recoverSigner(params.to, params.value, params.data, signature)
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
      // attempt to create 3-of-2 multisig
      await Multisig.connect(first).addAdditionalOwners(await second.getAddress(), 1) // 1 of two
      await Multisig.connect(first).addAdditionalOwners(await third.getAddress(), 2) // two of three

      await expect(Multisig.connect(first).addAdditionalOwners(await fourth.getAddress(), 10))
        .to.be.revertedWith('Threshold cannot exceed number of signers.')
    })

    it('should revert when non-owner calls addAdditionalOwners()', async () => {
      // attempt to add signer from a non-signer account
      await expect(Multisig.connect(second).addAdditionalOwners(await second.getAddress(), 1))
        .to.be.revertedWith('Unauthorized. Owner only.')
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

  describe('Execution', () => {
    it('should send ETH from 1-of-3 multisig', async () => {
      const ethReceiverAddress = await ethReceiver.getAddress()

      // send 10 eth to the multisig wallet
      const tx = await first.sendTransaction({
        to: Multisig.address,
        value: ethers.utils.parseEther('10.0')
      })
      await tx.wait()

      // construct multisig transaction payload
      const params = {
        to: ethReceiverAddress,
        value: ethers.utils.parseEther('5').toString(),
        data: '0x',
        nonce: '1'
      }

      // @ts-expect-error
      const beforeBalance = await getEthBalance(ethReceiver.provider, ethReceiverAddress)
      expect(beforeBalance).to.equal('10000000000000000000000') // 10k ETH

      const signatures = await signMessages([first, second, third], Multisig.address, params)

      // add signers to the multisig wallet, create 1-of-3 multisig
      await Multisig.connect(first).addAdditionalOwners(await second.getAddress(), 1)
      await Multisig.connect(first).addAdditionalOwners(await third.getAddress(), 1)

      expect(await Multisig.threshold()).to.equal(1)

      await expect(await Multisig.connect(first).executeTransaction(signatures, params.to, params.value, params.data))
        .to.emit(Multisig, 'Execution')
        .withArgs(ethReceiverAddress, true, '0x')

      // @ts-expect-error
      const afterBalance = await getEthBalance(ethReceiver.provider, ethReceiverAddress)
      expect(afterBalance).to.equal('10005000000000000000000') // 10k + 5 ETH
    })

    it('should call function selector from a 2-of-3 multisig', async () => {
      // get signature hash for doCall() from Test.sol
      const abi = ['function doCall()']
      const iface = new ethers.utils.Interface(abi)
      const calldata = iface.encodeFunctionData('doCall')

      // construct txn params to call a contract function
      const params = {
        to: Test.address,
        value: '0',
        data: ethers.utils.hexlify(calldata)
      }

      // create the array of signatures
      const signatures = await signMessages([first, second, third], Multisig.address, params)

      // create 2 of 3 multisig
      await Multisig.connect(first).addAdditionalOwners(await second.getAddress(), 1)
      await Multisig.connect(first).addAdditionalOwners(await third.getAddress(), 2)

      expect(await Multisig.threshold()).to.equal(2)

      // execute transaction from the second signer
      await expect(await Multisig.connect(second).executeTransaction(signatures, params.to, params.value, params.data))
        .to.emit(Multisig, 'Execution')
        .withArgs(Test.address, true, '0x')

      // check if boolean was set to true via multisig txn
      expect(await Test.didCall()).to.equal(true)
    })

    it('should call function selector from a 2-of-3 multisig with arguments', async () => {
      // get signature hash for doCall() from Test.sol
      const abi = ['function setValue(string memory _value)']
      const iface = new ethers.utils.Interface(abi)
      const calldata = iface.encodeFunctionData('setValue', ['storedData'])

      // construct txn params to call a contract function
      const params = {
        to: Test.address,
        value: '0',
        data: ethers.utils.hexlify(calldata)
      }

      // create the array of signatures
      const signatures = await signMessages([first, second, third], Multisig.address, params)

      // create 2 of 3 multisig
      await Multisig.connect(first).addAdditionalOwners(await second.getAddress(), 1)
      await Multisig.connect(first).addAdditionalOwners(await third.getAddress(), 2)

      expect(await Multisig.threshold()).to.equal(2)

      // execute transaction from the signer
      await expect(await Multisig.connect(second).executeTransaction(signatures, params.to, params.value, params.data))
        .to.emit(Multisig, 'Execution')
        .withArgs(Test.address, true, '0x')

      // check if boolean was set to true via multisig txn
      expect(await Test.value()).to.equal('storedData')
    })

    it('should revert on invalid # of signatures', async () => {
      // construct transaction params
      // send 5 ETH to the ethReceiver (an ethers signer)
      const params = {
        to: await ethReceiver.getAddress(),
        value: ethers.utils.parseEther('5').toString(),
        data: '0x'
      }

      // create only two signatures from the first two signers
      const signatures = await signMessages([first, second], Multisig.address, params)

      // create 3-of-3 multisig
      await Multisig.connect(first).addAdditionalOwners(await second.getAddress(), 1)
      await Multisig.connect(first).addAdditionalOwners(await third.getAddress(), 2)
      await Multisig.connect(first).addAdditionalOwners(await fourth.getAddress(), 3)

      // submit only two signatures
      await expect(Multisig.connect(first).executeTransaction(signatures, params.to, params.value, params.data))
        .to.be.revertedWith('Invalid number of signatures')
    })

    it('should revert when to == zeroAddress', async () => {
      // construct transaction params
      // send 5 ETH to zeroAddress
      const params = {
        to: ethers.constants.AddressZero,
        value: ethers.utils.parseEther('5').toString(),
        data: '0x'
      }

      // create only two signatures from the first two signers
      const signatures = await signMessages([first, second], Multisig.address, params)

      // create 1-of-2 multisig
      await Multisig.connect(first).addAdditionalOwners(await second.getAddress(), 1)

      // submit only two signatures
      await expect(Multisig.connect(first).executeTransaction(signatures, params.to, params.value, params.data))
        .to.be.revertedWith('Cannot send to zero address.')
    })
  })
})
