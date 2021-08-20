import { ethers } from 'ethers'

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

const getDomain = (chainId: number, contractAddress: string) => {
  return {
    name: 'MinimalMultisig',
    version: '1.0.0',
    chainId: chainId.toString() || '1',
    verifyingContract: contractAddress || ethers.constants.AddressZero
  }
}

const EIP712 = (contractAddress: string, chainId = 1, params: Record<any, unknown>) => {
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
export const signMessage = async (signer: ethers.Signer, contractAddress: string, params: Record<any, unknown>): Promise<string> => {
  // @ts-expect-error
  const provider: ethers.providers.JsonRpcProvider = signer.provider
  const { chainId } = await provider.getNetwork()

  try {
    return await provider.send('eth_signTypedData_v4', [
      await signer.getAddress(),
      EIP712(contractAddress, chainId, params)
    ])
  } catch (e) {
    throw new Error(e)
  }
}

export const signMessages = async (signers: ethers.Signer[], contractAddress: string, params: Record<any, unknown>): Promise<string[]> => {
  if (signers.length === 0) {
    throw new Error('Please supply an array of signers')
  }

  const signatures: string[] = []

  signers.map(async (signer) => {
    const signature = await signMessage(signer, contractAddress, params)
    signatures.push(signature)
  })

  return signatures
}

export const getEthBalance = async (provider: ethers.providers.JsonRpcProvider, address: string) => {
  return await provider.getBalance(address)
}
