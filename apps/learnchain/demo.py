"""Guided tour of LearnChain. Run:  .venv/bin/python demo.py
PLAY MONEY ONLY: LEARN coins are fake and nothing touches a real network."""
import time
from learnchain import Blockchain, Block, Transaction, Wallet, Node, MINING_REWARD


def step(title):
    print("\n" + "=" * 70 + f"\n{title}\n" + "=" * 70)


step("1. Hashing: tiny change -> totally different fingerprint")
from learnchain import sha256
print("sha256('hello') =", sha256("hello"))
print("sha256('hellp') =", sha256("hellp"))

step("2. Proof-of-work cost grows ~16x per extra leading zero")
for d in range(1, 6):
    times, nonces = [], []
    for k in range(3 if d < 5 else 1):
        b = Block(1, "0" * 64, [], d, timestamp=1000 + k)
        times.append(b.mine()); nonces.append(b.nonce)
    print(f"difficulty {d}: avg {sum(times)/len(times):.4f}s, avg nonce tries {sum(nonces)//len(nonces):>8}, e.g. hash {b.hash[:16]}...")

step("3. Make wallets (real ECDSA secp256k1 key pairs)")
alice, bob, mallory = Wallet("alice"), Wallet("bob"), Wallet("mallory")
for w in (alice, bob, mallory):
    print(f"{w.name:8s} address {w.address[:24]}...")

chain = Blockchain(difficulty=3)
step(f"4. Alice mines a block and earns {MINING_REWARD} fake LEARN")
blk = chain.mine_block(alice.address)
print(f"Mined block {blk.index} in {chain.last_mine_seconds:.3f}s, nonce {blk.nonce}, hash {blk.hash[:20]}...")
print("Balances: alice", chain.balance(alice.address), "| bob", chain.balance(bob.address))

step("5. Alice signs and sends 20 LEARN to Bob (goes into the mempool)")
tx = Transaction(alice.address, bob.address, 20).sign(alice)
chain.add_transaction(tx)
print("Mempool size:", len(chain.mempool), "| signature valid:", tx.is_signature_valid())
chain.mine_block(bob.address)
print("After Bob mines: alice", chain.balance(alice.address), "| bob", chain.balance(bob.address))

step("6. Attacks that the rules reject")
for label, make in [
    ("Overspend: Alice sends 1000", lambda: Transaction(alice.address, bob.address, 1000).sign(alice)),
    ("Forgery: Mallory signs a tx spending Alice's coins", lambda: Transaction(alice.address, mallory.address, 10, signature=mallory.sign("x"))),
    ("Altered: valid tx, amount changed after signing", lambda: (lambda t: (setattr(t, "amount", 29), t)[1])(Transaction(alice.address, mallory.address, 1).sign(alice))),
]:
    try:
        chain.add_transaction(make()); print("ACCEPTED?!", label)
    except ValueError as e:
        print(f"REJECTED  {label}\n          -> {e}")
chain.add_transaction(Transaction(alice.address, bob.address, 25).sign(alice))
try:
    chain.add_transaction(Transaction(alice.address, mallory.address, 25).sign(alice))
    print("ACCEPTED?! double spend")
except ValueError as e:
    print(f"REJECTED  Double-spend: Alice (30 LEARN) tries to send 25 twice before mining\n          -> {e}")
chain.mine_block(alice.address)

step("7. Validate the chain, then tamper with history")
print("Chain valid?", chain.is_valid(), "| blocks:", len(chain.chain))
print("Mallory edits block 2 so Bob 'received' 2000 instead of 20...")
chain.chain[2].transactions[1].amount = 2000
for p in Blockchain.validate_chain(chain.chain):
    print("  DETECTED:", p)
print("She also recomputes block 2's hash (redoing its proof of work)...")
t0 = time.perf_counter(); chain.chain[2].mine()
for p in Blockchain.validate_chain(chain.chain):
    print("  DETECTED:", p)
print(f"(re-mining took {time.perf_counter()-t0:.3f}s, and every later block would need re-mining too, faster than honest miners)")

step("8. Several nodes: longest VALID chain wins")
a, b, c = Node("A"), Node("B"), Node("C")
a.connect(b); b.connect(c); a.connect(c)
w = Wallet("miner")
for _ in range(3): a.chain.mine_block(w.address)
for _ in range(1): b.chain.mine_block(w.address)
print("lengths before sync: A", len(a.chain.chain), "B", len(b.chain.chain), "C", len(c.chain.chain))
for n in (b, c):
    print(f"node {n.name} adopts longer chain? {n.resolve_conflicts()}")
print("lengths after sync:  A", len(a.chain.chain), "B", len(b.chain.chain), "C", len(c.chain.chain))
for _ in range(5): c.chain.mine_block(w.address)
c.chain.chain[-1].transactions[0].amount = 9999      # C cheats on a longer chain
print("C builds a longer chain (8 blocks) but cheats in it. A adopts it?", a.resolve_conflicts(), "-> invalid chains are ignored")
print("\nAll LEARN coins above are play money. Nothing left this computer.")
