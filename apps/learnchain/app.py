"""LearnChain web UI (Flask). Run: .venv/bin/python app.py  ->  http://localhost:5055
PLAY MONEY ONLY. Everything lives in this process's memory; restart = fresh chain."""
import os
from flask import Flask, request, redirect, render_template_string, flash
from learnchain import Blockchain, Transaction, Wallet, COINBASE

app = Flask(__name__)
app.secret_key = os.urandom(16)        # only for flash messages
chain = Blockchain(difficulty=3)
wallets: dict[str, Wallet] = {}         # demo only: keys kept in memory so the UI can sign for you

# Public-demo guards: cap memory/CPU so anonymous visitors can't exhaust the shared server.
MAX_WALLETS = int(os.environ.get("LC_MAX_WALLETS", 50))
MAX_BLOCKS = int(os.environ.get("LC_MAX_BLOCKS", 300))
MAX_PENDING = int(os.environ.get("LC_MAX_PENDING", 100))
MAX_DIFFICULTY = int(os.environ.get("LC_MAX_DIFFICULTY", 5))
MAX_AMOUNT = 10**9

def _int(name, lo, hi):
    v = int(request.form.get(name, ""))  # ValueError -> handled below
    if not lo <= v <= hi: raise ValueError(f"{name} must be between {lo} and {hi}")
    return v

@app.errorhandler(ValueError)
@app.errorhandler(KeyError)
def _bad_input(e):
    flash("Rejected: invalid input"); return redirect("./")

@app.after_request
def _headers(r):
    r.headers.setdefault("X-Content-Type-Options", "nosniff")
    return r

def label(addr):
    if addr == COINBASE: return "⛏ reward"
    for n, w in wallets.items():
        if w.address == addr: return n
    return addr[:10] + "…"

PAGE = """<!doctype html><title>LearnChain</title>
<style>body{font-family:system-ui;margin:0;background:#0f172a;color:#e2e8f0}main{max-width:1100px;margin:auto;padding:20px}
.banner{background:#facc15;color:#000;padding:8px 16px;font-weight:600;text-align:center}
.card{background:#1e293b;border-radius:10px;padding:14px 18px;margin:12px 0}input,select,button{padding:6px 8px;border-radius:6px;border:1px solid #475569;background:#0f172a;color:#e2e8f0}
button{background:#2563eb;border:0;cursor:pointer}code{color:#7dd3fc;word-break:break-all}.bad{color:#f87171}.ok{color:#4ade80}
.blocks{display:flex;gap:10px;overflow-x:auto}.blk{min-width:230px;background:#0b1220;border:1px solid #334155;border-radius:8px;padding:10px;font-size:12px}
table{border-collapse:collapse;width:100%}td,th{padding:4px 8px;border-bottom:1px solid #334155;text-align:left;font-size:13px}.flash{background:#334155;padding:8px;border-radius:6px}</style>
<div class=banner>⚠ PLAY MONEY: "LEARN" coins are fake. Not connected to any real blockchain or network.</div><main>
<h1>LearnChain explorer</h1>
{% for m in get_flashed_messages() %}<p class=flash>{{m}}</p>{% endfor %}
<div class=card>Chain: <b>{{c.chain|length}}</b> blocks · difficulty <b>{{c.difficulty}}</b> · mempool <b>{{c.mempool|length}}</b> tx ·
 status: {% if problems %}<span class=bad>INVALID</span>{% else %}<span class=ok>valid ✔</span>{% endif %}
 {% if c.last_mine_seconds %}· last mine {{'%.3f'|format(c.last_mine_seconds)}}s{% endif %}
 {% for p in problems %}<div class=bad>• {{p}}</div>{% endfor %}</div>
<div class=card><h3>Wallets</h3>
<form method=post action=wallet style="display:inline"><input name=name placeholder="name e.g. alice" required> <button>Create wallet</button></form>
<table><tr><th>name</th><th>address (public key)</th><th>balance</th><th>incl. pending</th></tr>
{% for n,w in wallets.items() %}<tr><td>{{n}}</td><td><code>{{w.address[:32]}}…</code></td><td>{{c.balance(w.address)}} LEARN</td><td>{{c.balance(w.address, True)}}</td></tr>{% endfor %}</table></div>
<div class=card style="display:flex;gap:30px;flex-wrap:wrap">
<form method=post action=send><h3>Send (signed)</h3><select name=sender>{% for n in wallets %}<option>{{n}}</option>{% endfor %}</select> →
<select name=recipient>{% for n in wallets %}<option>{{n}}</option>{% endfor %}</select> <input name=amount type=number min=1 value=10 style="width:70px"> <button>Sign & add to mempool</button></form>
<form method=post action=mine><h3>Mine</h3><select name=miner>{% for n in wallets %}<option>{{n}}</option>{% endfor %}</select> <button>Mine block (+50)</button></form>
<form method=post action=difficulty><h3>Difficulty</h3><input name=d type=number min=1 max=6 value={{c.difficulty}} style="width:60px"> <button>Set</button></form>
<form method=post action=tamper><h3>Tamper (experiment)</h3><input name=i type=number min=1 value=1 style="width:60px"> <button style="background:#dc2626">Edit block's 1st tx</button></form>
</div>
{% if c.mempool %}<div class=card><h3>Mempool</h3><table>{% for t in c.mempool %}<tr><td>{{label(t.sender)}} → {{label(t.recipient)}}</td><td>{{t.amount}} LEARN</td><td><code>sig {{t.signature[:24]}}…</code></td></tr>{% endfor %}</table></div>{% endif %}
<div class=card><h3>Blocks</h3><div class=blocks>{% for b in c.chain|reverse %}<div class=blk>
<b>#{{b.index}}</b> {% if b.hash != b.compute_hash() %}<span class=bad>tampered!</span>{% endif %}<br>hash <code>{{b.hash[:20]}}…</code><br>prev <code>{{b.previous_hash[:20]}}…</code><br>nonce {{b.nonce}} · diff {{b.difficulty}}
<ul style="padding-left:16px">{% for t in b.transactions %}<li>{{label(t.sender)}} → {{label(t.recipient)}}: {{t.amount}}</li>{% else %}<li>genesis</li>{% endfor %}</ul></div>{% endfor %}</div></div>
</main>"""

@app.get("/")
def index():
    return render_template_string(PAGE, c=chain, wallets=wallets, label=label, problems=Blockchain.validate_chain(chain.chain))

@app.post("/wallet")
def new_wallet():
    n = request.form["name"].strip()[:20]
    if not n or not n.isprintable(): flash("Pick a name"); return redirect("./")
    if len(wallets) >= MAX_WALLETS: flash(f"Demo limit: {MAX_WALLETS} wallets"); return redirect("./")
    if n in wallets: flash("Name taken")
    else: wallets[n] = Wallet(n); flash(f"Created wallet {n} with a fresh ECDSA key pair")
    return redirect("./")

@app.post("/send")
def send():
    try:
        if len(chain.mempool) >= MAX_PENDING:
            raise ValueError("mempool full, mine a block first")
        s, r = wallets[request.form["sender"]], wallets[request.form["recipient"]]
        chain.add_transaction(Transaction(s.address, r.address, _int("amount", 1, MAX_AMOUNT)).sign(s))
        flash("Transaction signed and added to the mempool. Mine a block to confirm it.")
    except (ValueError, KeyError) as e:
        flash(f"Rejected: {e}")
    return redirect("./")

@app.post("/mine")
def mine():
    if len(chain.chain) >= MAX_BLOCKS:
        flash(f"Demo limit: {MAX_BLOCKS} blocks. The server restarts with a fresh chain."); return redirect("./")
    try:
        b = chain.mine_block(wallets[request.form["miner"]].address)
        flash(f"Mined block #{b.index} in {chain.last_mine_seconds:.3f}s after {b.nonce} tries")
    except KeyError:
        flash("Create a wallet first")
    return redirect("./")

@app.post("/difficulty")
def difficulty():
    chain.difficulty = _int("d", 1, MAX_DIFFICULTY); flash(f"Difficulty set to {chain.difficulty} (applies to new blocks)")
    return redirect("./")

@app.post("/tamper")
def tamper():
    i = _int("i", 0, 10**6)
    if 0 < i < len(chain.chain) and chain.chain[i].transactions:
        chain.chain[i].transactions[0].amount += 1000; flash(f"Added 1000 to block {i}'s first transaction. Watch validation fail.")
    else: flash("No such block")
    return redirect("./")

if __name__ == "__main__":
    app.run(host=os.environ.get("HOST", "127.0.0.1"), port=int(os.environ.get("PORT", 5055)))
