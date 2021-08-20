const signMessage = async (signer, contractAddress, params) => {
   const { provider } = signer
   const { chainId } = await provider.getNetwork()
   
    try {
        return await provider.send("eth_signTypedData_v4", [
            await signer.getAddress(),
            // TODO: EIP712 signing schema
            '0x..'
        ])
    } catch (e) {
        throw new Error("Error signing transaction: eth_signTypedData_v4", e)
    }
}


module.exports = {
    signMessage
}
