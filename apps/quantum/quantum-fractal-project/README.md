# Quantum Fractal Project

Two independent modules produced in a single session — a **Mandelbulb 4D fractal renderer** and an **adaptive quantum testing framework** — bundled together with generated outputs and session documentation.

---

## Project Structure

```
quantum-fractal-project/
├── README.md
├── requirements.txt
├── visualization/              # Mandelbulb 4D fractal renderer
│   ├── __init__.py
│   └── mandelbulb_4d.py        # CLI tool — run directly
├── quantum_framework/          # Quantum hardware testing framework
│   ├── __init__.py
│   ├── framework.py            # QuantumTestingFramework class
│   ├── models.py               # Data models and hardware abstractions
│   └── operations.py           # Hardware operation stubs
├── output/                     # Generated fractal images
│   ├── mandelbulb_4d.png
│   └── mandelbulb_4d_multi_angle.png
└── docs/
    └── chat_transcript.pdf     # Full session transcript
```

---

## 1. Mandelbulb 4D Visualization

Renders a power-8 Mandelbulb fractal — a 3D slice through a 4D Mandelbrot set — using marching cubes isosurface extraction with custom diffuse lighting and a purple-to-gold colormap.

### Quick Start

```bash
pip install -r requirements.txt
python -m visualization.mandelbulb_4d --output output/
```

### CLI Options

| Flag            | Default | Description                   |
|-----------------|---------|-------------------------------|
| `--power`       | 8       | Mandelbulb exponent           |
| `--resolution`  | 250     | Voxels per axis (250³ = 15.6M)|
| `--iterations`  | 24      | Max escape-time iterations    |
| `--output`      | output/ | Output directory for PNGs     |

### How It Works

1. **Voxel sampling** — creates a 3D grid spanning [-1.2, 1.2] on each axis
2. **Escape-time computation** — iterates the triplex power formula at each voxel
3. **Isosurface extraction** — marching cubes finds the boundary surface
4. **Lighting** — per-face diffuse shading with a directional light
5. **Rendering** — matplotlib 3D projection with custom colormap

---

## 2. Quantum Testing Framework

An adaptive testing loop for quantum hardware with:

- **Environmental monitoring** — coherence, vacuum, entanglement stability
- **Error correction** — three levels (Surface-17, Bacon-Shor-13, Color-9)
- **Adaptive cooldown** — factors in temperature, entanglement entropy, failures
- **Classical cross-validation** — probabilistic comparison with a classical simulator
- **Stability analysis** — multi-dimensional trend tracking via Kendall's tau
- **Anomaly correlation** — detects statistical links between faults and hardware metrics
- **Graceful shutdown** — emergency protocols with full diagnostic capture

### Usage

```python
from quantum_framework import QuantumTestingFramework, QuantumComputer
from quantum_framework.models import AnomalyDatabase

qc = QuantumComputer()
db = AnomalyDatabase()
framework = QuantumTestingFramework(qc, db)
framework.run_adaptive_test_cycle()
```

### Architecture

```
QuantumTestingFramework
├── run_adaptive_test_cycle()       # Main loop
├── check_quantum_environment()     # Hardware health
├── calculate_quantum_cooldown()    # Adaptive pacing
├── analyze_multi_dimensional_stability()  # Trend analysis
├── track_entanglement_evolution()  # Entropy monitoring
├── detect_quantum_anomaly_correlation()   # Fault correlation
├── perform_adaptive_calibration()  # Hardware maintenance
└── generate_stability_report()     # Comprehensive diagnostics
```

The `operations.py` module contains stub functions — replace these with actual hardware backend calls when connecting to a real quantum processor.

---

## Requirements

```
numpy
matplotlib
scikit-image
scipy
```

Install everything:

```bash
pip install -r requirements.txt
```

---

## Session Context

This project was produced in a conversation on **18 March 2026**. The full chat transcript — including the discussion that led to these artifacts — is in `docs/chat_transcript.pdf`.

---

## License

MIT
