import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import pytest
from learnchain import Blockchain, Block, Transaction, Wallet, Node, MINING_REWARD, sha256


@pytest.fixture
def setup():
    c = Blockchain(difficulty=2); a, b = Wallet("a"), Wallet("b")
    c.mine_block(a.address)
    return c, a, b


def test_hash_deterministic():
    assert sha256("x") == sha256("x") != sha256("y")

def test_pow_meets_difficulty():
    b = Block(1, "0" * 64, [], 3); b.mine()
    assert b.hash.startswith("000") and b.hash == b.compute_hash()

def test_reward(setup):
    c, a, _ = setup
    assert c.balance(a.address) == MINING_REWARD

def test_send_and_mine(setup):
    c, a, b = setup
    c.add_transaction(Transaction(a.address, b.address, 10).sign(a)); c.mine_block(b.address)
    assert c.balance(a.address) == 40 and c.balance(b.address) == 60 and c.is_valid()

def test_overspend_rejected(setup):
    c, a, b = setup
    with pytest.raises(ValueError, match="Insufficient"):
        c.add_transaction(Transaction(a.address, b.address, 51).sign(a))

def test_double_spend_in_mempool_rejected(setup):
    c, a, b = setup
    c.add_transaction(Transaction(a.address, b.address, 30).sign(a))
    with pytest.raises(ValueError, match="Insufficient"):
        c.add_transaction(Transaction(a.address, b.address, 30).sign(a))

def test_forged_signature_rejected(setup):
    c, a, b = setup
    with pytest.raises(ValueError, match="signature"):
        c.add_transaction(Transaction(a.address, b.address, 5, signature=b.sign("whatever")))

def test_altered_amount_rejected(setup):
    c, a, b = setup
    t = Transaction(a.address, b.address, 5).sign(a); t.amount = 6
    with pytest.raises(ValueError, match="signature"):
        c.add_transaction(t)

def test_cannot_sign_for_others(setup):
    _, a, b = setup
    with pytest.raises(ValueError):
        Transaction(a.address, b.address, 1).sign(b)

def test_nonpositive_amount_rejected(setup):
    c, a, b = setup
    for amt in (0, -5):
        with pytest.raises(ValueError):
            c.add_transaction(Transaction(a.address, b.address, amt).sign(a))

def test_tamper_detected(setup):
    c, a, b = setup
    c.add_transaction(Transaction(a.address, b.address, 10).sign(a)); c.mine_block(a.address)
    c.chain[2].transactions[1].amount = 1000
    assert any("tampered" in p for p in Blockchain.validate_chain(c.chain))

def test_remined_tamper_still_detected(setup):
    c, a, b = setup
    c.add_transaction(Transaction(a.address, b.address, 10).sign(a)); c.mine_block(a.address); c.mine_block(a.address)
    c.chain[2].transactions[1].amount = 1000; c.chain[2].mine()
    probs = Blockchain.validate_chain(c.chain)
    assert any("signature" in p for p in probs) and any("link broken" in p for p in probs)

def test_fake_reward_detected(setup):
    c, a, _ = setup
    c.chain[1].transactions[0].amount = 1_000_000; c.chain[1].mine()
    c.chain[1:] = c.chain[1:2]
    assert any("reward" in p for p in Blockchain.validate_chain(c.chain))

def test_longest_valid_chain_wins():
    a, b = Node("a"), Node("b"); a.connect(b); w = Wallet()
    for _ in range(3): a.chain.mine_block(w.address)
    assert b.resolve_conflicts() and len(b.chain.chain) == 4

def test_invalid_longer_chain_ignored():
    a, b = Node("a"), Node("b"); a.connect(b); w = Wallet()
    for _ in range(3): a.chain.mine_block(w.address)
    a.chain.chain[2].transactions[0].amount = 999
    assert not b.resolve_conflicts() and len(b.chain.chain) == 1
