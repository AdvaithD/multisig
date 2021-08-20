const { ethers } = require('ethers')

const TYPES = {
  EIP712Domain: [
    {
      name: 'name',
      type: 'string'
    },
    {
      name: 'version',
      type: 'string'
    },
    {
      name: 'chainId',
      type: 'uint256'
    },
    {
      name: 'verifyingContract',
      type: 'address'
    }
  ],
  TxnRequest: [
    {
      name: 'to',
      type: 'address'
    },
    {
      name: 'value',
      type: 'uint256'
    },
    {
      name: 'data',
      type: 'bytes'
    },
    {
      name: 'nonce',
      type: 'uint256'
    }
  ]

}

const getDomain = (chainId, contractAddress) => {
  return {
    name: 'MinimalMultisig',
    version: '1.0.0',
    chainId: chainId.toString() || '1',
    verifyingContract: contractAddress || ethers.constants.AddressZero
  }
}

const EIP712 = (contractAddress, chainId = 1, params) => {
  return {
    types: TYPES,
    domain: getDomain(chainId, contractAddress),
    message: {
      to: params.to,
      value: params.value,
      data: params.data,
      nonce: params.nonce
    },
    primaryType: 'TxnRequest'
  }
}

/**
 * @param  {Signer} signer - account signer
 * @param  {string} contractAddress - multisig contract address
 * @param  {Object} params - unsigned transaction payload of type TxnRequest
 */
const signMessage = async (signer, contractAddress, params) => {
  const { provider } = signer
  const { chainId } = await provider.getNetwork()

  try {
    return await provider.send('eth_signTypedData_v4', [
      await signer.getAddress(),
      EIP712(contractAddress, chainId, params)
    ])
  } catch (e) {
    throw new Error('Error signing transaction: eth_signTypedData_v4', e)
  }
}

module.exports = {
  signMessage
}
