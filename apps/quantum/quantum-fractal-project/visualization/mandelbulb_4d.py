"""
Mandelbulb 4D Fractal Visualization
====================================
Renders a power-8 Mandelbulb fractal using marching cubes isosurface
extraction with custom lighting and a purple-to-gold colormap.

Requirements:
    pip install numpy matplotlib scikit-image

Usage:
    python mandelbulb_4d.py [--power N] [--resolution N] [--iterations N]

Output:
    output/mandelbulb_4d.png            — Main 3D render
    output/mandelbulb_4d_multi_angle.png — Six-angle panel
"""

import argparse
import os
import sys
import numpy as np
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d.art3d import Poly3DCollection
import matplotlib.colors as mcolors

# ─── Default Parameters ───────────────────────────────────
DEFAULT_POWER = 8
DEFAULT_MAX_ITER = 24
DEFAULT_BAILOUT = 2.0
DEFAULT_RESOLUTION = 250
DEFAULT_BOUND = 1.2
MAX_RENDER_FACES = 300_000

# ─── Colormap ─────────────────────────────────────────────
COLORMAP_COLORS = [
    '#0d0221', '#150535', '#1a0a4e', '#2d1070',
    '#4a1a8a', '#6b24a8', '#8b2fc0', '#a840d0',
    '#c850c0', '#e060a0', '#e8608a', '#f07060',
    '#ff8a50', '#ffaa40', '#ffc040', '#ffe060',
    '#ffe880', '#fff4b0'
]
CMAP = mcolors.LinearSegmentedColormap.from_list('mandelbulb_royal', COLORMAP_COLORS, N=512)
BG_COLOR = '#050510'


def compute_mandelbulb(resolution, power, max_iter, bailout, bound):
    """
    Compute escape-time volume for the Mandelbulb fractal.

    Uses the triplex algebra approach: at each iteration, convert to
    spherical coordinates, raise radius to `power`, multiply angles
    by `power`, convert back, and add the original point (c).

    Args:
        resolution: Voxels per axis (total voxels = resolution^3).
        power: Mandelbulb exponent (8 is the classic shape).
        max_iter: Maximum escape-time iterations.
        bailout: Escape radius threshold.
        bound: Spatial extent [-bound, +bound] per axis.

    Returns:
        escape: 3D array of escape iteration counts.
        lin: 1D coordinate array for the grid axes.
    """
    lin = np.linspace(-bound, bound, resolution)
    X, Y, Z = np.meshgrid(lin, lin, lin, indexing='ij')

    cx, cy, cz = X.copy(), Y.copy(), Z.copy()
    dx, dy, dz = X.copy(), Y.copy(), Z.copy()

    escape = np.full(X.shape, max_iter, dtype=np.float32)
    active = np.ones(X.shape, dtype=bool)

    for i in range(max_iter):
        r = np.sqrt(dx * dx + dy * dy + dz * dz)

        just_escaped = active & (r > bailout)
        escape[just_escaped] = i
        active[just_escaped] = False

        if not active.any():
            break

        theta = np.where(active, np.arctan2(np.sqrt(dx * dx + dy * dy), dz), 0)
        phi = np.where(active, np.arctan2(dy, dx), 0)

        rn = np.where(active, np.power(np.clip(r, 0, 100), power), 0)
        theta_n = theta * power
        phi_n = phi * power

        dx = np.where(active, rn * np.sin(theta_n) * np.cos(phi_n) + cx, dx)
        dy = np.where(active, rn * np.sin(theta_n) * np.sin(phi_n) + cy, dy)
        dz = np.where(active, rn * np.cos(theta_n) + cz, dz)

    return escape, lin


def extract_isosurface(escape, bound, resolution, level=None):
    """
    Extract a triangulated isosurface from the escape-time volume
    using the marching cubes algorithm.

    Args:
        escape: 3D escape-time array.
        bound: Spatial extent of the grid.
        resolution: Grid resolution.
        level: Isosurface level (defaults to max_iter - 1).

    Returns:
        verts: Vertex positions (N, 3).
        faces: Triangle face indices (M, 3).
        normals: Vertex normals.
    """
    from skimage.measure import marching_cubes

    if level is None:
        level = escape.max() - 1

    spacing = 2 * bound / resolution
    verts, faces, normals, _ = marching_cubes(escape, level=level, spacing=(spacing, spacing, spacing))
    return verts, faces, normals


def compute_face_colors(verts, faces, bound):
    """Compute per-face RGBA colors with diffuse lighting."""
    verts_centered = verts - bound
    face_centers = np.mean(verts_centered[faces], axis=1)

    # Color by radial distance + height
    r_face = np.sqrt(face_centers[:, 0] ** 2 + face_centers[:, 1] ** 2 + face_centers[:, 2] ** 2)
    height = face_centers[:, 2]
    color_val = (
        0.5 * (r_face / (r_face.max() + 1e-10))
        + 0.5 * ((height - height.min()) / (height.max() - height.min() + 1e-10))
    )

    # Face normals for lighting
    v0, v1, v2 = verts_centered[faces[:, 0]], verts_centered[faces[:, 1]], verts_centered[faces[:, 2]]
    face_normals = np.cross(v1 - v0, v2 - v0)
    norms = np.linalg.norm(face_normals, axis=1, keepdims=True)
    norms[norms == 0] = 1
    face_normals /= norms

    light_dir = np.array([0.5, 0.3, 0.8])
    light_dir /= np.linalg.norm(light_dir)
    diffuse = np.abs(np.dot(face_normals, light_dir))
    lighting = 0.3 + 0.7 * diffuse

    rgba = CMAP(color_val)
    rgba[:, :3] *= lighting[:, np.newaxis]
    rgba[:, :3] = np.clip(rgba[:, :3], 0, 1)

    return verts_centered, rgba


def render_main_view(verts_centered, faces, rgba, bound, power, resolution, max_iter, num_faces, output_dir):
    """Render the primary 3D view of the Mandelbulb."""
    fig = plt.figure(figsize=(16, 13), facecolor=BG_COLOR)
    ax = fig.add_subplot(111, projection='3d', facecolor=BG_COLOR)

    mesh = Poly3DCollection(
        verts_centered[faces], facecolors=rgba,
        edgecolors='none', linewidths=0, antialiased=False
    )
    ax.add_collection3d(mesh)

    lim = bound * 1.05
    ax.set_xlim([-lim, lim])
    ax.set_ylim([-lim, lim])
    ax.set_zlim([-lim, lim])

    _style_3d_axes(ax, lim)

    ax.set_title(
        f'Mandelbulb Fractal  \u2014  power {power}',
        color='#ddddff', fontsize=18, fontweight='bold', pad=25, fontfamily='serif',
    )
    ax.text2D(
        0.5, 0.92,
        f'{resolution}\u00b3 voxels  \u00b7  {max_iter} iterations  \u00b7  {num_faces:,} faces',
        transform=ax.transAxes, fontsize=10, color='#777799',
        ha='center', fontfamily='monospace',
    )

    ax.view_init(elev=20, azim=135)
    ax.set_box_aspect([1, 1, 1])
    plt.tight_layout()

    path = os.path.join(output_dir, 'mandelbulb_4d.png')
    fig.savefig(path, dpi=200, bbox_inches='tight', facecolor=BG_COLOR)
    plt.close(fig)
    return path


def render_multi_angle(verts_centered, faces, rgba, bound, power, output_dir):
    """Render a six-angle panel of the Mandelbulb."""
    fig = plt.figure(figsize=(20, 13), facecolor=BG_COLOR)
    lim = bound * 1.05

    angles = [(20, 45), (20, 135), (20, 225), (65, 90), (5, 0), (-25, 180)]
    titles = ['Front-Left', 'Front-Right', 'Back-Right', 'Top View', 'Side View', 'Bottom View']

    for idx, ((elev, azim), title) in enumerate(zip(angles, titles)):
        ax = fig.add_subplot(2, 3, idx + 1, projection='3d', facecolor=BG_COLOR)
        mesh = Poly3DCollection(
            verts_centered[faces], facecolors=rgba,
            edgecolors='none', linewidths=0, antialiased=False
        )
        ax.add_collection3d(mesh)
        ax.set_xlim([-lim, lim])
        ax.set_ylim([-lim, lim])
        ax.set_zlim([-lim, lim])
        ax.view_init(elev=elev, azim=azim)
        ax.set_box_aspect([1, 1, 1])
        ax.set_title(title, color='#bbbbdd', fontsize=12, pad=8)
        for axis in [ax.xaxis, ax.yaxis, ax.zaxis]:
            axis.pane.fill = False
            axis.pane.set_edgecolor((0.12, 0.08, 0.2, 0.3))
            axis.set_ticklabels([])
            axis.line.set_color('#222244')

    fig.suptitle(
        f'Mandelbulb 4D  \u2014  Multi-Angle View  (power = {power})',
        color='#ddddff', fontsize=20, fontweight='bold', y=0.98, fontfamily='serif',
    )
    plt.subplots_adjust(wspace=0.05, hspace=0.12, top=0.92, bottom=0.02)

    path = os.path.join(output_dir, 'mandelbulb_4d_multi_angle.png')
    fig.savefig(path, dpi=150, bbox_inches='tight', facecolor=BG_COLOR)
    plt.close(fig)
    return path


def _style_3d_axes(ax, lim):
    """Apply consistent dark-theme styling to 3D axes."""
    for axis in [ax.xaxis, ax.yaxis, ax.zaxis]:
        axis.pane.fill = False
        axis.pane.set_edgecolor((0.15, 0.1, 0.25, 0.4))
        axis.label.set_color('#8888aa')
        for t in axis.get_ticklabels():
            t.set_color('#666688')
            t.set_fontsize(7)
        axis.line.set_color('#333355')
    ax.set_xlabel('X', fontsize=10, labelpad=8, color='#8888aa')
    ax.set_ylabel('Y', fontsize=10, labelpad=8, color='#8888aa')
    ax.set_zlabel('Z', fontsize=10, labelpad=8, color='#8888aa')


def main():
    parser = argparse.ArgumentParser(description='Mandelbulb 4D Fractal Visualization')
    parser.add_argument('--power', type=int, default=DEFAULT_POWER, help='Mandelbulb exponent')
    parser.add_argument('--resolution', type=int, default=DEFAULT_RESOLUTION, help='Voxels per axis')
    parser.add_argument('--iterations', type=int, default=DEFAULT_MAX_ITER, help='Max escape iterations')
    parser.add_argument('--output', type=str, default='output', help='Output directory')
    args = parser.parse_args()

    os.makedirs(args.output, exist_ok=True)

    print('=' * 55)
    print('  Mandelbulb 4D Fractal Visualization')
    print('=' * 55)
    print(f'  Power:      {args.power}')
    print(f'  Resolution: {args.resolution}\u00b3 = {args.resolution ** 3:,} voxels')
    print(f'  Iterations: {args.iterations}')
    print()

    print('[1/4] Computing escape-time volume...')
    escape, lin = compute_mandelbulb(args.resolution, args.power, args.iterations, DEFAULT_BAILOUT, DEFAULT_BOUND)
    interior = np.sum(escape == args.iterations)
    print(f'      Interior voxels: {interior:,} / {escape.size:,}')

    print('[2/4] Extracting isosurface...')
    verts, faces, normals = extract_isosurface(escape, DEFAULT_BOUND, args.resolution)
    print(f'      Vertices: {len(verts):,}  |  Faces: {len(faces):,}')

    if len(faces) > MAX_RENDER_FACES:
        idx = np.random.choice(len(faces), MAX_RENDER_FACES, replace=False)
        faces = faces[idx]
        print(f'      Subsampled to {MAX_RENDER_FACES:,} faces')

    print('[3/4] Computing lighting and colors...')
    verts_centered, rgba = compute_face_colors(verts, faces, DEFAULT_BOUND)

    print('[4/4] Rendering...')
    p1 = render_main_view(verts_centered, faces, rgba, DEFAULT_BOUND, args.power,
                          args.resolution, args.iterations, len(faces), args.output)
    print(f'      Main view:   {p1}')

    p2 = render_multi_angle(verts_centered, faces, rgba, DEFAULT_BOUND, args.power, args.output)
    print(f'      Multi-angle: {p2}')

    print('\nDone.')


if __name__ == '__main__':
    main()
