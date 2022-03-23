var ethers = require("ethers");

(async function() {

    /*
     * Here we get a transaction object
     */
    const provider = ethers.getDefaultProvider();
    const hash = "0x2769fa79d3a55fdb003461ad8b86bc2a85e6f28ecf9f64c3246a30677fbff35d";
    const expectedFrom = "0xDA86793f4aa24C0716b657eeD899a73b9a12F937";
    const tx = await provider.getTransaction(hash);
    console.log(tx);

    const baseTx = {
        to: tx.to,
        nonce: tx.nonce,
        data: tx.data,
        value: tx.value,
        gasLimit: tx.gasLimit,
        gasPrice: tx.gasPrice,
        chainId: tx.chainId,
    }

    const sig = {
        r: tx.r,
        s: tx.s,
        v: tx.v
    };

    ///////////////////
    // Here is what you need to do:

    // serializeTransaction(tx [ , signature ])
    // - If signature is unspecified, you get an unsigned tx
    const unsignedTx = ethers.utils.serializeTransaction(baseTx);
    console.log("Unsigned Tx:", unsignedTx);
    // Unsigned Tx: 0xf86a818f851d1a94a20082becf94066798d9ef0833ccc719076dab77199ecbd178b080b844095ea7b30000000000000000000000007a250d5630b4cf539739df2c5dacb4c659f2488dffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff018080

    // Get the transaction pre-image
    const preimage = ethers.utils.keccak256(unsignedTx);
    console.log("Preimage:", preimage);
    // Preimage: 0x8342181a4b3dd526c10ac9d25b85bd896245199e386af170f6d7649b00174b3a

    // ecrecover based on the signature and the **preimage**
    const from = ethers.utils.recoverAddress(preimage, sig);

    console.log({ from, expectedFrom });
    // {
    //  from: '0xDA86793f4aa24C0716b657eeD899a73b9a12F937',
    //  expectedFrom: '0xDA86793f4aa24C0716b657eeD899a73b9a12F937'
    // }

    ///////////////////
    // As a note, here is how you would get the transaction hash:

    const signedTx = ethers.utils.serializeTransaction(baseTx, sig);
    console.log("Signed Tx:", signedTx);
    // Signed Tx: 0xf8aa818f851d1a94a20082becf94066798d9ef0833ccc719076dab77199ecbd178b080b844095ea7b30000000000000000000000007a250d5630b4cf539739df2c5dacb4c659f2488dffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff25a007cca508ee0c29e9e3402ef74bb611b8d8532d4682ac04f21fbf21171244208ba02cf161165f71d0de343f31a4666c29a2c804d3f18d8a7a276b8fb7d72477e1a8

    const hashedSignedTransaction = ethers.utils.keccak256(signedTx);
    console.log("Hash:", hashedSignedTransaction);
    // Hash: 0x2769fa79d3a55fdb003461ad8b86bc2a85e6f28ecf9f64c3246a30677fbff35d

})();

