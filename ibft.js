var ethers = require("ethers");

(async function() {

    const provider = ethers.getDefaultProvider('http://localhost:8545');
    const tx = await provider.getBlock(1);
    const extraData = ethers.utils.RLP.decode(tx.extraData);
    extraData[4].forEach(function(signature,index) { 
        var validator = ethers.utils.recoverAddress(tx.hash, signature)
        console.log(validator) 
    }) 

})();

