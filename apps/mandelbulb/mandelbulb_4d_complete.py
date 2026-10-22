import os
"""
4D Mandelbulb — Complete Implementation with Corrected Hyperspherical Reconstruction

Corrected Cartesian reconstruction from hyperspherical angles:

    Angle extraction (forward):
        phi   = atan2(y, x)
        theta = atan2(z, r_xy)
        psi   = atan2(w, r_xyz)

    Cartesian reconstruction (inverse), after raising to power n:
        x = r_new * cos(psi_new) * cos(theta_new) * cos(phi_new)
        y = r_new * cos(psi_new) * cos(theta_new) * sin(phi_new)
        z = r_new * cos(psi_new) * sin(theta_new)
        w = r_new * sin(psi_new)

    where r_new = r^n, phi_new = n*phi, theta_new = n*theta, psi_new = n*psi
"""

import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D
from scipy import ndimage
import time

# ================================================================
# Core: Scalar function (for reference / validation)
# ================================================================
def mandelbulb_4d_power(p, n=8, max_iter=50, bailout=4.0):
    """
    4D Mandelbulb escape-time function.
    p: 4D vector [x, y, z, w] as c
    Returns: smooth escape iteration count, or 0 if inside the set.
    """
    z = np.zeros(4, dtype=float)
    for i in range(max_iter):
        r = np.linalg.norm(z)
        if r > bailout:
            return i + 1 - np.log(np.log(r) / np.log(bailout)) / np.log(n)

        r_xy = np.sqrt(z[0]**2 + z[1]**2)
        r_xyz = np.sqrt(r_xy**2 + z[2]**2)

        if r == 0:
            phi = theta = psi = 0.0
        else:
            phi = np.arctan2(z[1], z[0])
            theta = np.arctan2(z[2], r_xy)
            psi = np.arctan2(z[3], r_xyz)

        r_new = r ** n
        phi_new = n * phi
        theta_new = n * theta
        psi_new = n * psi

        # Corrected reconstruction:
        #   x = r^n * cos(n*psi) * cos(n*theta) * cos(n*phi)
        #   y = r^n * cos(n*psi) * cos(n*theta) * sin(n*phi)
        #   z = r^n * cos(n*psi) * sin(n*theta)
        #   w = r^n * sin(n*psi)
        z_new = np.array([
            r_new * np.cos(psi_new) * np.cos(theta_new) * np.cos(phi_new),
            r_new * np.cos(psi_new) * np.cos(theta_new) * np.sin(phi_new),
            r_new * np.cos(psi_new) * np.sin(theta_new),
            r_new * np.sin(psi_new)
        ])

        z = z_new + p
    return 0


# ================================================================
# Vectorized iteration kernel
# ================================================================
def iterate_4d_mandelbulb_vectorized(c_flat, power=8, max_iter=30, bailout=4.0):
    """
    Vectorized 4D Mandelbulb iteration over an array of c values.
    c_flat: (N, 4) array of 4D seed points
    Returns: escaped (bool), escape_iter (float), inside_grid (bool)
    """
    N = c_flat.shape[0]
    z = np.zeros((N, 4), dtype=np.float64)
    escaped = np.zeros(N, dtype=bool)
    escape_iter = np.zeros(N, dtype=np.float64)

    for iteration in range(max_iter):
        active = ~escaped
        if not np.any(active):
            break

        za = z[active]
        ca = c_flat[active]
        r = np.linalg.norm(za, axis=1)

        # Bailout check
        just_escaped = r > bailout
        if np.any(just_escaped):
            r_esc = r[just_escaped]
            smooth = iteration + 1 - np.log(np.log(r_esc) / np.log(bailout)) / np.log(power)
            active_indices = np.where(active)[0]
            escaped[active_indices[just_escaped]] = True
            escape_iter[active_indices[just_escaped]] = smooth

            still_active = ~just_escaped
            za = za[still_active]
            ca = ca[still_active]
            r = r[still_active]
            active_indices = active_indices[still_active]
        else:
            active_indices = np.where(active)[0]

        if len(za) == 0:
            break

        # Stepwise radii
        r_xy = np.sqrt(za[:, 0]**2 + za[:, 1]**2)
        r_xyz = np.sqrt(r_xy**2 + za[:, 2]**2)

        # Angles
        phi = np.arctan2(za[:, 1], za[:, 0])
        theta = np.arctan2(za[:, 2], r_xy)
        psi = np.arctan2(za[:, 3], r_xyz)

        # Power mapping
        r_new = r ** power
        phi_new = power * phi
        theta_new = power * theta
        psi_new = power * psi

        # Corrected Cartesian reconstruction
        cos_psi = np.cos(psi_new)
        cos_theta = np.cos(theta_new)

        z_new = np.column_stack([
            r_new * cos_psi * cos_theta * np.cos(phi_new),  # x
            r_new * cos_psi * cos_theta * np.sin(phi_new),  # y
            r_new * cos_psi * np.sin(theta_new),            # z
            r_new * np.sin(psi_new)                         # w
        ]) + ca

        z[active_indices] = z_new

        if (iteration + 1) % 10 == 0:
            pct = escaped.sum() / N * 100
            print(f"    Iter {iteration+1}/{max_iter} — {pct:.1f}% escaped")

    return escaped, escape_iter


# ================================================================
# MAIN: Full pipeline
# ================================================================
if __name__ == "__main__":
    print("=" * 60)
    print("4D MANDELBULB — COMPLETE RUN")
    print("Corrected hyperspherical reconstruction")
    print("=" * 60)

    POWER = 8
    MAX_ITER = 30
    BAILOUT = 4.0
    BOUND = 1.5
    W_SLICE = 0.0

    t_total = time.time()

    # ----------------------------------------------------------
    # STEP 1: Roundtrip validation
    # ----------------------------------------------------------
    print("\n[1/4] Validating roundtrip consistency (n=1)...")
    np.random.seed(42)
    all_pass = True
    for _ in range(20):
        pt = np.random.randn(4)
        r = np.linalg.norm(pt)
        r_xy = np.sqrt(pt[0]**2 + pt[1]**2)
        r_xyz = np.sqrt(r_xy**2 + pt[2]**2)
        phi = np.arctan2(pt[1], pt[0])
        theta = np.arctan2(pt[2], r_xy)
        psi = np.arctan2(pt[3], r_xyz)

        recon = np.array([
            r * np.cos(psi) * np.cos(theta) * np.cos(phi),
            r * np.cos(psi) * np.cos(theta) * np.sin(phi),
            r * np.cos(psi) * np.sin(theta),
            r * np.sin(psi)
        ])
        err = np.linalg.norm(recon - pt)
        if err > 1e-10:
            all_pass = False
            print(f"  FAIL: error={err:.2e}")
    print(f"  {'All 20 tests PASSED' if all_pass else 'SOME TESTS FAILED'}")

    # ----------------------------------------------------------
    # STEP 2: 3D volume computation (w=0 slice)
    # ----------------------------------------------------------
    print(f"\n[2/4] Computing 3D volume (w={W_SLICE}, res=250^3)...")
    res3d = 250
    t0 = time.time()

    xs = np.linspace(-BOUND, BOUND, res3d)
    ys = np.linspace(-BOUND, BOUND, res3d)
    zs = np.linspace(-BOUND, BOUND, res3d)
    cx, cy, cz = np.meshgrid(xs, ys, zs, indexing='ij')
    c_flat = np.stack([cx.ravel(), cy.ravel(), cz.ravel(),
                       np.full(res3d**3, W_SLICE)], axis=-1)

    escaped_3d, _ = iterate_4d_mandelbulb_vectorized(c_flat, POWER, MAX_ITER, BAILOUT)
    inside_grid = (~escaped_3d).reshape(res3d, res3d, res3d)
    print(f"  Done in {time.time()-t0:.1f}s — {(~escaped_3d).sum():,} inside points")

    # Surface extraction
    eroded = ndimage.binary_erosion(inside_grid)
    surface = inside_grid & ~eroded
    si, sj, sk = np.where(surface)
    sx, sy, sz = xs[si], ys[sj], zs[sk]
    print(f"  Surface points: {len(sx):,}")

    # Lighting
    kernel = np.ones((3, 3, 3))
    grad_x = ndimage.sobel(inside_grid.astype(float), axis=0)
    grad_y = ndimage.sobel(inside_grid.astype(float), axis=1)
    grad_z = ndimage.sobel(inside_grid.astype(float), axis=2)
    nx, ny, nz = grad_x[si, sj, sk], grad_y[si, sj, sk], grad_z[si, sj, sk]
    norms = np.sqrt(nx**2 + ny**2 + nz**2)
    norms[norms == 0] = 1
    nx /= norms; ny /= norms; nz /= norms

    light = np.array([1.0, 1.0, 2.0])
    light /= np.linalg.norm(light)
    diffuse = np.abs(nx * light[0] + ny * light[1] + nz * light[2])
    shade = 0.3 + 0.7 * diffuse

    dist = np.sqrt(sx**2 + sy**2 + sz**2)
    from matplotlib.colors import Normalize
    norm = Normalize(vmin=dist.min(), vmax=dist.max())
    colors = plt.cm.inferno(norm(dist))
    colors[:, :3] *= shade[:, np.newaxis]
    colors[:, 3] = 0.85

    # ----------------------------------------------------------
    # STEP 3: Render 3D views
    # ----------------------------------------------------------
    print(f"\n[3/4] Rendering 3D surface views...")

    views = [
        (25, 45, "mandelbulb_4d_v1.png"),
        (10, 135, "mandelbulb_4d_v2.png"),
        (60, 0, "mandelbulb_4d_v3.png"),
    ]

    max_pts = 120_000
    for elev, azim, fname in views:
        fig = plt.figure(figsize=(14, 11), facecolor='black')
        ax = fig.add_subplot(111, projection='3d', facecolor='black')

        # Depth sort
        azr, elr = np.radians(azim), np.radians(elev)
        depth = sx * np.cos(elr)*np.cos(azr) + sy * np.cos(elr)*np.sin(azr) + sz * np.sin(elr)
        order = np.argsort(depth)
        if len(order) > max_pts:
            idx = np.random.default_rng(42).choice(len(order), max_pts, replace=False)
            order = order[idx]
            order = order[np.argsort(depth[order])]

        ax.scatter(sx[order], sy[order], sz[order],
                   c=colors[order], s=0.3, edgecolors='none', depthshade=False)

        ax.set_xlim(-BOUND, BOUND); ax.set_ylim(-BOUND, BOUND); ax.set_zlim(-BOUND, BOUND)
        ax.set_xlabel('X', color='white', fontsize=10)
        ax.set_ylabel('Y', color='white', fontsize=10)
        ax.set_zlabel('Z', color='white', fontsize=10)
        ax.tick_params(colors='white', labelsize=7)
        for pane in [ax.xaxis.pane, ax.yaxis.pane, ax.zaxis.pane]:
            pane.fill = False
            pane.set_edgecolor('#222222')
        ax.grid(True, alpha=0.08)
        ax.set_title(f'4D Mandelbulb (w=0) — Power {POWER}\nElev {elev}, Azim {azim}',
                     color='white', fontsize=14, fontweight='bold', pad=15)
        ax.view_init(elev=elev, azim=azim)

        plt.tight_layout()
        plt.savefig(os.path.join(os.path.dirname(os.path.abspath(__file__)), fname), dpi=200,
                    bbox_inches='tight', facecolor='black', edgecolor='none')
        plt.close()
        print(f"  Saved: {fname}")

    # ----------------------------------------------------------
    # STEP 4: 2D cross-section
    # ----------------------------------------------------------
    print(f"\n[4/4] Computing 2D cross-section (z=0, w=0, res=800)...")
    res2d = 800
    t1 = time.time()

    xs2 = np.linspace(-BOUND, BOUND, res2d)
    ys2 = np.linspace(-BOUND, BOUND, res2d)
    cx2, cy2 = np.meshgrid(xs2, ys2, indexing='ij')
    c2 = np.stack([cx2.ravel(), cy2.ravel(),
                   np.zeros(res2d**2), np.zeros(res2d**2)], axis=-1)

    escaped_2d, escape_iter_2d = iterate_4d_mandelbulb_vectorized(c2, POWER, MAX_ITER, BAILOUT)
    grid = escape_iter_2d.reshape(res2d, res2d).T
    print(f"  Done in {time.time()-t1:.1f}s")

    fig2, ax2 = plt.subplots(figsize=(10, 10), facecolor='black')
    grid_masked = np.where(grid == 0, np.nan, grid)
    ax2.imshow(grid_masked, extent=[-BOUND, BOUND, -BOUND, BOUND],
               cmap='inferno', origin='lower', interpolation='bilinear')
    ax2.imshow(np.where(grid == 0, 0.3, np.nan),
               extent=[-BOUND, BOUND, -BOUND, BOUND],
               cmap='Greys_r', origin='lower', alpha=0.8, vmin=0, vmax=1)
    ax2.set_xlabel('X', color='white', fontsize=12)
    ax2.set_ylabel('Y', color='white', fontsize=12)
    ax2.set_title(f'4D Mandelbulb Cross-Section (z=0, w=0) — Power {POWER}',
                  color='white', fontsize=14, fontweight='bold')
    ax2.tick_params(colors='white')
    for spine in ax2.spines.values():
        spine.set_edgecolor('#333333')
    plt.tight_layout()
    plt.savefig(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'mandelbulb_4d_2d.png'), dpi=200,
                bbox_inches='tight', facecolor='black', edgecolor='none')
    plt.close()
    print("  Saved: mandelbulb_4d_2d.png")

    # ----------------------------------------------------------
    # Summary
    # ----------------------------------------------------------
    total_time = time.time() - t_total
    print(f"\n{'=' * 60}")
    print(f"ALL DONE — Total: {total_time:.1f}s")
    print(f"{'=' * 60}")
    print(f"\nOutputs:")
    print(f"  mandelbulb_4d_v1.png  — 3D surface, elev 25 / azim 45")
    print(f"  mandelbulb_4d_v2.png  — 3D surface, elev 10 / azim 135")
    print(f"  mandelbulb_4d_v3.png  — 3D surface, top-down elev 60")
    print(f"  mandelbulb_4d_2d.png  — 2D cross-section heatmap")
    print(f"\nCorrected reconstruction:")
    print(f"  x = r^n * cos(n*psi) * cos(n*theta) * cos(n*phi)")
    print(f"  y = r^n * cos(n*psi) * cos(n*theta) * sin(n*phi)")
    print(f"  z = r^n * cos(n*psi) * sin(n*theta)")
    print(f"  w = r^n * sin(n*psi)")
