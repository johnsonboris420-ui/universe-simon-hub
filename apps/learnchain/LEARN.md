# LearnChain: learn how a blockchain works by playing with one

> **Play money only.** "LEARN" coins are fake and worth nothing. They exist only in this program's memory, and the program never connects to Bitcoin, Ethereum or any network. Close it and they're gone.

## Quick start
```bash
cd apps/learnchain   # first: python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/python demo.py            # guided tour in the terminal
.venv/bin/python -m pytest -q tests # 15 automated checks
.venv/bin/python app.py             # web UI at http://localhost:5055
```
Files: `learnchain.py` (the whole blockchain, about 250 commented lines), `demo.py`, `app.py`, `tests/test_learnchain.py`.

## The concepts, one at a time

### 1. Hashing (SHA-256)
A hash is a fingerprint of some data: always 64 hex characters. The same input always gives the same hash. Change a single letter and the hash looks completely different. You can't work backwards from a hash to the data. `sha256()` in `learnchain.py`.

### 2. Blocks and the chain
A **block** holds a list of transactions plus the **hash of the block before it** (`previous_hash`). So each block "points at" its parent. Change an old block and its hash changes, so the next block's pointer no longer matches: the chain is broken. The first block is the **genesis** block. `Block.compute_hash()`.

### 3. Proof of work (mining)
To add a block, a miner must find a number (the **nonce**) that makes the block's hash start with a certain number of zeros, called the **difficulty**. The only way to find it is trial and error. Each extra zero is about 16× more work. This makes rewriting history expensive: a cheater would have to redo the work for the changed block *and every block after it*, faster than everyone else. `Block.mine()`.

The demo measured (your numbers will vary):

| difficulty | average tries | time |
|---|---|---|
| 2 | ~500 | 0.002 s |
| 3 | ~5,000 | 0.016 s |
| 4 | ~130,000 | 0.42 s |
| 5 | ~620,000 | 1.9 s |

### 4. Mining reward
The miner adds one special **coinbase** transaction paying themselves 50 LEARN. This is the only way new coins appear. Validation rejects blocks that pay themselves more.

### 5. Wallets and keys (ECDSA)
A wallet is a **key pair** on the secp256k1 curve, the same curve Bitcoin uses.
- **Private key**: secret. It makes signatures.
- **Public key**: shared. It's your address, and anyone can use it to check your signatures.

Losing the private key means losing the coins. Leaking it means someone else can spend them. `Wallet`.

### 6. Signed transactions
A transaction says "sender pays recipient N". The sender signs the exact text of it. Change the amount or recipient afterwards and the signature no longer matches. Someone else's key produces a signature that fails the check. `Transaction.sign()` and `is_signature_valid()`.

### 7. Balances
There's no balance table. Your balance is worked out by replaying every transaction in history: coins in minus coins out. `Blockchain.balance()`.

### 8. The mempool
Signed transactions wait in the **mempool** until a miner puts them in a block. When a new transaction arrives, the chain checks:
- the signature is valid;
- the amount is positive;
- the sender has enough coins, counting what they've already promised in the mempool. That blocks **double-spends**.

`Blockchain.add_transaction()`.

### 9. Validation (catching tampering)
`Blockchain.validate_chain()` re-checks everything from scratch. For each block it checks:
- the hash matches the contents;
- the proof of work meets the difficulty;
- `previous_hash` links to the block before;
- there's exactly one correct reward;
- every signature is valid;
- nobody overspends.

In the demo, editing a past amount from 20 to 2000 was caught 4 ways. Even after the cheater re-mined that block, the broken signature and the broken link to the next block still gave it away.

### 10. Many nodes: the longest valid chain wins
Real blockchains have thousands of copies (**nodes**). When copies disagree, each node switches to the **longest chain that passes validation**. Real chains use "most total work", but length is the simple version. A longer chain containing a cheat is ignored. `Node.resolve_conflicts()`.

## Exercises
1. **Feel the difficulty.** In the UI, set the difficulty to 4, then 5, and mine. Note the times. Predict how long 6 would take before you try it.
2. **Try a double-spend.** Give Alice 50 LEARN by mining. Then send 30 to Bob and 30 to Carol *before* mining again. Which one is rejected, and why? (Hint: "incl. pending".)
3. **Forge a transaction.** In Python, build `Transaction(alice.address, you.address, 10)` and sign it with *your* wallet. What error do you get? Why can't `.sign()` stop you, but the chain can?
4. **Tamper and repair.** Use the UI's red Tamper button on block 1 and read the validation errors. Then, in Python, try to "fix" the chain by re-mining every block after the edit. Which check still fails, and why does a signature protect you even when the hashes are redone?
5. **Change the reward.** Set `MINING_REWARD = 25` and rerun the tests. Which tests break? Could a miner on the old rules accept blocks from a miner on the new rules?
6. **Halving.** Make the reward halve every 5 blocks, as Bitcoin does every 210,000. Update `validate_chain` too.
7. **Transaction fees.** Add a `fee` field that goes to the miner. Remember to include it in the signed payload!
8. **Shorter addresses.** Make the address `sha256(public_key)[:40]`. What else must a transaction now carry so the signature can still be checked?
9. **51% attack.** In `demo.py`'s node section, let a cheater mine a longer chain *honestly* in which they never paid Bob. Does the longest-chain rule accept it? What does that tell you about why majority hash-power matters?

## What's simplified compared with real blockchains
- No real network: nodes are Python objects calling each other.
- The UI stores private keys in memory so it can sign for you. Real wallets never hand over private keys.
- Real chains use Merkle trees, UTXOs or account nonces (replay protection), difficulty that adjusts automatically, fees, and "most work" rather than "longest".
