"""
LearnChain: a tiny teaching blockchain.

  PLAY MONEY ONLY. "LEARN" coins are worthless and exist only in this
  program's memory. Nothing here talks to Bitcoin, Ethereum or any real
  network. It is for learning how blockchains work.

Read top to bottom: Wallet -> Transaction -> Block -> Blockchain -> Node.
"""
from __future__ import annotations

import hashlib
import json
import time
from dataclasses import dataclass, field
from typing import List, Optional

# `ecdsa` does real elliptic-curve cryptography, using the same curve (secp256k1) as Bitcoin.
from ecdsa import SigningKey, VerifyingKey, SECP256k1, BadSignatureError

MINING_REWARD = 50          # LEARN coins paid to whoever mines a block (fake!)
COINBASE = "COINBASE"       # special "sender" name for newly created reward coins


def sha256(text: str) -> str:
    """Hash any text with SHA-256 and return 64 hex characters.
    Same input -> same output; change one character -> totally different output."""
    return hashlib.sha256(text.encode()).hexdigest()


# ---------------------------------------------------------------------------
# 1. Wallets: a private key (secret, used to sign) + a public key (shared, used to verify)
# ---------------------------------------------------------------------------
class Wallet:
    def __init__(self, name: str = ""):
        self.name = name
        self._private_key = SigningKey.generate(curve=SECP256k1)   # random secret number
        self.public_key = self._private_key.get_verifying_key()      # derived from it

    @property
    def address(self) -> str:
        """Your 'account number': here simply the hex public key (real chains hash it shorter)."""
        return self.public_key.to_string().hex()

    def sign(self, message: str) -> str:
        """Only the holder of the private key can make this signature."""
        return self._private_key.sign(message.encode()).hex()

    def __repr__(self):
        return f"Wallet({self.name}, {self.address[:12]}...)"


def verify_signature(address: str, message: str, signature_hex: str) -> bool:
    """Anyone can check a signature using only the public address."""
    try:
        vk = VerifyingKey.from_string(bytes.fromhex(address), curve=SECP256k1)
        return vk.verify(bytes.fromhex(signature_hex), message.encode())
    except (BadSignatureError, ValueError):
        return False


# ---------------------------------------------------------------------------
# 2. Transactions: "sender pays recipient N coins", signed by sender
# ---------------------------------------------------------------------------
@dataclass
class Transaction:
    sender: str
    recipient: str
    amount: int
    timestamp: float = field(default_factory=time.time)
    signature: str = ""

    def payload(self) -> str:
        """The exact text that gets signed. The signature covers every field except itself,
        so changing the amount or recipient afterwards breaks the signature."""
        return json.dumps({"sender": self.sender, "recipient": self.recipient,
                           "amount": self.amount, "timestamp": self.timestamp}, sort_keys=True)

    def sign(self, wallet: Wallet) -> "Transaction":
        if wallet.address != self.sender:
            raise ValueError("You can only sign transactions that spend from your own wallet")
        self.signature = wallet.sign(self.payload())
        return self

    def is_signature_valid(self) -> bool:
        if self.sender == COINBASE:        # rewards have no sender to sign them
            return True
        return verify_signature(self.sender, self.payload(), self.signature)

    @property
    def txid(self) -> str:
        return sha256(self.payload() + self.signature)

    def to_dict(self):
        return {"sender": self.sender, "recipient": self.recipient, "amount": self.amount,
                "timestamp": self.timestamp, "signature": self.signature}

    @staticmethod
    def from_dict(d) -> "Transaction":
        return Transaction(**d)


# ---------------------------------------------------------------------------
# 3. Blocks: a batch of transactions + a link (previous hash) + a proof-of-work nonce
# ---------------------------------------------------------------------------
@dataclass
class Block:
    index: int
    previous_hash: str
    transactions: List[Transaction]
    difficulty: int
    timestamp: float = field(default_factory=time.time)
    nonce: int = 0
    hash: str = ""

    def compute_hash(self) -> str:
        """Fingerprint of the whole block. Includes previous_hash, so blocks are chained:
        edit an old block and its hash changes, which breaks the next block's link."""
        body = json.dumps({"index": self.index, "previous_hash": self.previous_hash,
                           "transactions": [t.to_dict() for t in self.transactions],
                           "difficulty": self.difficulty, "timestamp": self.timestamp,
                           "nonce": self.nonce}, sort_keys=True)
        return sha256(body)

    def mine(self) -> float:
        """Proof of work: try nonce = 0, 1, 2, ... until the hash starts with
        `difficulty` zeros. Each extra zero makes it about 16x harder on average."""
        target = "0" * self.difficulty
        start = time.perf_counter()
        self.nonce = 0
        self.hash = self.compute_hash()
        while not self.hash.startswith(target):
            self.nonce += 1
            self.hash = self.compute_hash()
        return time.perf_counter() - start

    def to_dict(self):
        return {"index": self.index, "previous_hash": self.previous_hash, "difficulty": self.difficulty,
                "timestamp": self.timestamp, "nonce": self.nonce, "hash": self.hash,
                "transactions": [t.to_dict() for t in self.transactions]}

    @staticmethod
    def from_dict(d) -> "Block":
        return Block(index=d["index"], previous_hash=d["previous_hash"], difficulty=d["difficulty"],
                     timestamp=d["timestamp"], nonce=d["nonce"], hash=d["hash"],
                     transactions=[Transaction.from_dict(t) for t in d["transactions"]])


# ---------------------------------------------------------------------------
# 4. The blockchain: list of blocks + mempool (waiting transactions) + rules
# ---------------------------------------------------------------------------
class Blockchain:
    def __init__(self, difficulty: int = 3):
        self.difficulty = difficulty
        self.mempool: List[Transaction] = []   # signed transactions waiting to be mined
        genesis = Block(0, "0" * 64, [], difficulty, timestamp=0)
        genesis.mine()
        self.chain: List[Block] = [genesis]
        self.last_mine_seconds = 0.0

    # --- balances: there are no stored balances, we replay history ----------
    def balance(self, address: str, include_mempool: bool = False) -> int:
        bal = 0
        txs = [t for b in self.chain for t in b.transactions]
        if include_mempool:
            txs += self.mempool
        for t in txs:
            if t.recipient == address:
                bal += t.amount
            if t.sender == address:
                bal -= t.amount
        return bal

    # --- adding a transaction to the mempool, with all the safety checks ------
    def add_transaction(self, tx: Transaction) -> None:
        if tx.sender == COINBASE:
            raise ValueError("Only miners create coins, via mining")
        if not isinstance(tx.amount, int) or tx.amount <= 0:
            raise ValueError("Amount must be a positive whole number")
        if tx.sender == tx.recipient:
            raise ValueError("Sender and recipient are the same wallet")
        if not tx.is_signature_valid():
            raise ValueError("Invalid signature: this transaction was not signed by the sender (forged or altered)")
        if any(t.txid == tx.txid for t in self.mempool):
            raise ValueError("Duplicate transaction")
        # Count coins already promised in the mempool, so you can't double-spend before mining
        available = self.balance(tx.sender, include_mempool=True)
        if tx.amount > available:
            raise ValueError(f"Insufficient funds: has {available} LEARN available, tried to send {tx.amount}")
        self.mempool.append(tx)

    # --- mining: bundle the mempool + a reward into a new block ---------------
    def mine_block(self, miner_address: str) -> Block:
        reward = Transaction(COINBASE, miner_address, MINING_REWARD)
        block = Block(len(self.chain), self.chain[-1].hash, [reward] + self.mempool, self.difficulty)
        self.last_mine_seconds = block.mine()
        self.chain.append(block)
        self.mempool = []
        return block

    # --- validation: re-check EVERYTHING from scratch -------------------------
    @staticmethod
    def validate_chain(chain: List[Block]) -> List[str]:
        """Return a list of problems ([] means valid). Anyone can run this on any chain."""
        problems = []
        balances: dict[str, int] = {}
        for i, b in enumerate(chain):
            if b.hash != b.compute_hash():
                problems.append(f"Block {i}: stored hash doesn't match contents (block was tampered with)")
            if not b.hash.startswith("0" * b.difficulty):
                problems.append(f"Block {i}: hash doesn't meet difficulty {b.difficulty} (no valid proof of work)")
            if i > 0 and b.previous_hash != chain[i - 1].hash:
                problems.append(f"Block {i}: previous_hash doesn't match block {i-1}'s hash (chain link broken)")
            rewards = [t for t in b.transactions if t.sender == COINBASE]
            if i > 0 and (len(rewards) != 1 or rewards[0].amount != MINING_REWARD):
                problems.append(f"Block {i}: must contain exactly one {MINING_REWARD} LEARN reward")
            for t in b.transactions:
                if not t.is_signature_valid():
                    problems.append(f"Block {i}: transaction {t.txid[:10]} has an invalid signature")
                if t.sender != COINBASE:
                    if balances.get(t.sender, 0) < t.amount:
                        problems.append(f"Block {i}: transaction {t.txid[:10]} overspends")
                    balances[t.sender] = balances.get(t.sender, 0) - t.amount
                balances[t.recipient] = balances.get(t.recipient, 0) + t.amount
        return problems

    def is_valid(self) -> bool:
        return not self.validate_chain(self.chain)

    def to_dict(self):
        return [b.to_dict() for b in self.chain]


# ---------------------------------------------------------------------------
# 5. Nodes: several computers each holding a copy. Rule: adopt the longest VALID chain.
#    (Real chains compare total work, not length; length is the beginner version.)
# ---------------------------------------------------------------------------
class Node:
    def __init__(self, name: str, difficulty: int = 2):
        self.name = name
        self.chain = Blockchain(difficulty)
        self.peers: List["Node"] = []

    def connect(self, other: "Node"):
        self.peers.append(other); other.peers.append(self)

    def resolve_conflicts(self) -> bool:
        """Look at every peer's chain; replace ours if theirs is longer AND valid."""
        replaced = False
        for p in self.peers:
            theirs = [Block.from_dict(b.to_dict()) for b in p.chain.chain]   # copy, like a network download
            if len(theirs) > len(self.chain.chain) and theirs[0].hash == self.chain.chain[0].hash \
                    and not Blockchain.validate_chain(theirs):
                self.chain.chain = theirs
                replaced = True
        return replaced
