## Ethereum Transaction Validation

We are going to 

* Retrieve a raw Ethereum Transaction
* Understand how to recover the signature of the transaction
* Understand how to recover the signatures of the IBFT2 Validators
* Understand how to examine contract data and state transitions

## Prerequisities

* Node.js
* Docker
* curl
* jq

## Running a local IBFT network

For the purpose of this exercise we will run a local IBFT blockchain network using the [Quorum Dev Quickstart project][4]

The documentation on the project is good and shows how to start the network. 

## Transactions

Using cURL we can fetch a transaction

``` bash
curl http://localhost:8545 \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","method":"eth_getTransactionByHash","params":["0x2769fa79d3a55fdb003461ad8b86bc2a85e6f28ecf9f64c3246a30677fbff35d"],"id":1}' | jq .
```

This returns the JSON object for the transaction

``` json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "blockHash": "0x17ff69dacf566db77bb01f2a95f8bbb5e6f3b98b6159ba74e5e674904fb6da54",
    "blockNumber": "0xb3a450",
    "from": "0xda86793f4aa24c0716b657eed899a73b9a12f937",
    "gas": "0xbecf",
    "gasPrice": "0x1d1a94a200",
    "hash": "0x2769fa79d3a55fdb003461ad8b86bc2a85e6f28ecf9f64c3246a30677fbff35d",
    "input": "0x095ea7b30000000000000000000000007a250d5630b4cf539739df2c5dacb4c659f2488dffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
    "nonce": "0x8f",
    "r": "0x7cca508ee0c29e9e3402ef74bb611b8d8532d4682ac04f21fbf21171244208b",
    "s": "0x2cf161165f71d0de343f31a4666c29a2c804d3f18d8a7a276b8fb7d72477e1a8",
    "to": "0x066798d9ef0833ccc719076dab77199ecbd178b0",
    "transactionIndex": "0x10c",
    "type": "0x0",
    "v": "0x25",
    "value": "0x0"
  }
}
```

The `r`,`s` values are the outputs of an ECDSA signature and may be used to recover the public address.

For further information see [ECDSA: (v, r, s), what is v?][1]

The `v` value was added in [EIP-155][2] to offer protection against replay attacks.

As such we can separate the base transaction data from the signature data

``` javascript
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
```
## Recovering the transaction sender signature

We can recover the signature and understand the public address that signed the transaction. 

In Ethereum the signature is computed as follows. Here RLP refers to the [RLP Encoding Scheme][3].

```
ECDSA_secp256k1(private_key, Keccak256(RLP(nonce, gasPrice, gasLimit, To, Value, Data, v, r, s))),
```

We can therefore compute the unsigned RLP serialised transaction using the transaction fields. We can then get the Keccak256 hash of this unsigned transaction to get the preimage that was signed. Following this we can recover the public address of the signature.

In this example the `ethers.js` library is used. Similar libraries exist for most popular programming languages.

``` javascript
const unsignedTx = ethers.utils.serializeTransaction(baseTx);
const preimage = ethers.utils.keccak256(unsignedTx);
const from = ethers.utils.recoverAddress(preimage, sig);
console.log(from);
```

## Recovering validator signatures

The `ibft_getValidatorsByBlockNumber` provides a method to retrive the public keys of validators for a specific block.

``` bash
curl -s -X POST \
    --data '{"jsonrpc":"2.0","method":"ibft_getValidatorsByBlockNumber","params":["latest"], \
    "id":1}' localhost:8545 | jq .
```

``` json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": [
    "0x27a97c9aaf04f18f3014c32e036dd0ac76da5f18",
    "0x93917cadbace5dfce132b991732c6cda9bcc5b8a",
    "0x98c1334496614aed49d2e81526d089f7264fed9c",
    "0xce412f988377e31f4d0ff12d74df73b51c42d0ca"
  ]
}
```

We can then retrieve the block itself

``` bash
curl -s -X POST \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","method":"eth_getBlockByNumber","params": ["0x1",false],"id":1}' \
    http://localhost:8545 | jq .

```
``` json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "number": "0x1",
    "hash": "0x82b5c53704cea50223ce667621806f485ec1d9dbe9e4ea7f19c928aedb6f0dd8",
    "mixHash": "0x63746963616c2062797a616e74696e65206661756c7420746f6c6572616e6365",
    "parentHash": "0x85a523687ebad98224e669ddf2c5474c0e97007871b4baaaa05a419381fc98ce",
    "nonce": "0x0000000000000000",
    "sha3Uncles": "0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
    "logsBloom": "0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
    "transactionsRoot": "0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
    "stateRoot": "0x98840a790f4c7dc6781a49d346bea3ee8373558e5bb1dfff5e65b3de25827650",
    "receiptsRoot": "0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
    "miner": "0x93917cadbace5dfce132b991732c6cda9bcc5b8a",
    "difficulty": "0x1",
    "totalDifficulty": "0x2",
    "extraData": "0xf90148a00000000000000000000000000000000000000000000000000000000000000000f8549427a97c9aaf04f18f3014c32e036dd0ac76da5f189493917cadbace5dfce132b991732c6cda9bcc5b8a9498c1334496614aed49d2e81526d089f7264fed9c94ce412f988377e31f4d0ff12d74df73b51c42d0ca808400000001f8c9b841f3e5877b8ef14758af6a2430135f9ccdf218bbf76c0191cc56682df11c74968d4f748cda97d4d6f28e2c1e01e340dfbf5abd48077a9354c75abd4190b8adad6200b8411870785d31aec2245faa3fcc21e6c211ac9b6c377b44072ca87169b74e778d891a1ece5e88d6be58669d14b4ffa0d4b532f4073684b1f6e944cdec8f20979da501b8416871a68c70a8ec1ed842aa1d8b1b2fbcb38b949de24c0201b3543f0b965cd5ce1eda6ea1216d517a7d3841a60c54c9089660979d3ba2c1a5b0fd975157c4a39701",
    "size": "0x349",
    "gasLimit": "0xf7b760",
    "gasUsed": "0x0",
    "timestamp": "0x624316e6",
    "uncles": [],
    "transactions": []
  }
}
```

Within the `extraData` field of is an RLP encoded string with a list of validators. RLP encoding is a space-efficient object serialization scheme used in Ethereum.

Using the ethers.js library we can fetch the block and decode the extraData field.

The extraData property is an RLP encoding of:

* 32 bytes of vanity data.
* A list of validator addresses.
* Any validator votes. No vote is included in the genesis block.
* The round the block was created on. The round in the genesis block is 0.
* A list of seals of the validators (signed block hashes). No seals are included in the genesis block.

``` javascript
const provider = ethers.getDefaultProvider('http://localhost:8545');
const tx = await provider.getBlock(1);
const extraData = ethers.utils.RLP.decode(tx.extraData);
console.log(extraData);
```
This outputs the decoded extraData field.

``` javascript
[
  '0x0000000000000000000000000000000000000000000000000000000000000000',
  [
    '0x27a97c9aaf04f18f3014c32e036dd0ac76da5f18',
    '0x93917cadbace5dfce132b991732c6cda9bcc5b8a',
    '0x98c1334496614aed49d2e81526d089f7264fed9c',
    '0xce412f988377e31f4d0ff12d74df73b51c42d0ca'
  ],
  '0x',
  '0x00000001',
  [
    '0xf3e5877b8ef14758af6a2430135f9ccdf218bbf76c0191cc56682df11c74968d4f748cda97d4d6f28e2c1e01e340dfbf5abd48077a9354c75abd4190b8adad6200',
    '0x1870785d31aec2245faa3fcc21e6c211ac9b6c377b44072ca87169b74e778d891a1ece5e88d6be58669d14b4ffa0d4b532f4073684b1f6e944cdec8f20979da501',
    '0x6871a68c70a8ec1ed842aa1d8b1b2fbcb38b949de24c0201b3543f0b965cd5ce1eda6ea1216d517a7d3841a60c54c9089660979d3ba2c1a5b0fd975157c4a39701'
  ]
]
```

The signed block hashes may be recovered to verify that the public keys of the validators that signed the block.

``` javascript
const provider = ethers.getDefaultProvider('http://localhost:8545');
const tx = await provider.getBlock(1);
const extraData = ethers.utils.RLP.decode(tx.extraData);
extraData[4].forEach(function(signature,index) { 
    var validator = ethers.utils.recoverAddress(tx.hash, signature)
    console.log(validator) 
}) 
```
This returns the validators that signed the block

``` bash
0xd2067169082ab564FACAA0E95DB57711545A57fb
0xDaF9D850c26245b8C11BDc4b280F536E3319f76C
0xa308b0e012056749D118A09bF079193Ae6Fd80C9
```

We can therefore verify that validators have signed the block and we can consider it valid.

## Understanding state transitions

This is available in the input field of a transaction allowing state transitions to be observed.

TODO pending contract interface


[1]: https://bitcoin.stackexchange.com/questions/38351/ecdsa-v-r-s-what-is-v/38909#38909
[2]: https://eips.ethereum.org/EIPS/eip-155
[3]: https://eth.wiki/en/fundamentals/rlp
[4]: https://github.com/ConsenSys/quorum-dev-quickstart
