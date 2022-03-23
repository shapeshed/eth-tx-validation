## Ethereum Transaction Validation

We are going to 

* Retrieve a raw Ethereum Transaction
* Understand how to recover the signature of the transaction
* Understand how to recover the signature of the miner 
* Understand how to examine contract data and state transitions

## Prerequisities

* Node.js
* curl
* jq

Using cURL we can fetch a transaction from mainnet

``` bash
curl https://mainnet.infura.io/v3/84842078b09946638c03157f83405213 \
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

```
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
## Recovering the signature

We can recover the signature and understand the public address that signed the transaction. 

In Ethereum the signature is computed as follows. Here RLP refers to the [RLP Encoding Scheme][3].

```
ECDSA_secp256k1(private_key, Keccak256(RLP(nonce, gasPrice, gasLimit, To, Value, Data, v, r, s))),
```

We can therefore compute the unsigned RLP serialised transaction using the transaction fields. We can then get the Keccak256 hash of this unsigned transaction to get the preimage that was signed. Following this we can recover the public address of the signature.

## Recovering the validator signature

## Understanding state transitions


[1]: https://bitcoin.stackexchange.com/questions/38351/ecdsa-v-r-s-what-is-v/38909#38909
[2]: https://eips.ethereum.org/EIPS/eip-155
[3]: https://eth.wiki/en/fundamentals/rlp
