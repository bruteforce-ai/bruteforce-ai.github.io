/**
 * render_graphs.js
 *
 * Programmatic mini-graph renderer for the brute.ai PDF pipeline.
 * Reads every .mini-graph div from each chapter HTML, replicates the
 * same drawing logic as js/main.js (functions, points, vectors,
 * dotted lines, labels, legends), produces SVG, converts to PNG via sharp.
 *
 * Also generates the 3D convex cost-function surface as a 2D contour image.
 *
 * Run BEFORE html_to_latex.js:
 *   node pdf_conversion/render_graphs.js
 */

'use strict';

const cheerio = require('cheerio');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const config = require('./config');

const ROOT = path.resolve(__dirname, '..');
const GRAPH_DIR = path.join(__dirname, 'images', 'graphs');
fs.mkdirSync(GRAPH_DIR, { recursive: true });

const W = 400, H = 200;

// ── Colour resolution ───────────────────────────────────────────────────────────
function resolveColor(c) {
    if (!c) return '#6366f1';
    if (c.startsWith('#') || c.startsWith('rgb')) return c;
    const map = {
        'var(--accent-primary)': '#6366f1',
        'var(--accent-secondary)': '#10b981',
        'var(--accent-secondary, #6366f1)': '#6366f1',
        'var(--accent-tertiary, #f59e0b)': '#f59e0b',
    };
    return map[c] || '#6366f1';
}

function escXml(s) {
    return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── Parsers ─────────────────────────────────────────────────────────────────────
function parsePoints(str) {
    if (!str) return [];
    return str.split(';').map(p => {
        const parts = p.trim().split(',');
        return {
            x: +parts[0], y: +parts[1],
            label: parts.length > 2 ? parts.slice(2).join(',').trim() : null
        };
    }).filter(p => isFinite(p.x) && isFinite(p.y));
}

function parseFunc(str) {
    if (!str) return null;
    try {
        if (str.includes('=>') || str.trim().startsWith('function'))
            return new Function(`return (${str})`)();
        return new Function('x', `return ${str}`);
    } catch { return null; }
}

// ── SVG renderer ────────────────────────────────────────────────────────────────
function renderGraphSVG(attrs) {
    const minX = parseFloat(attrs['data-min'] ?? 0);
    const maxX = parseFloat(attrs['data-max'] ?? 1);
    const title = attrs['data-title'] || '';
    const xTitle = attrs['data-x-title'] || '';
    const yTitle = attrs['data-y-title'] || '';
    const legend = attrs['data-legend'] || '';
    const legend2 = attrs['data-legend-2'] || '';
    const legend3 = attrs['data-legend-3'] || '';
    const color = resolveColor(attrs['data-color'] || '#6366f1');
    const color2 = resolveColor(attrs['data-color-2'] || '#10b981');
    const color3 = resolveColor(attrs['data-color-3'] || '#f59e0b');

    const f = parseFunc(attrs['data-function']);
    const f2 = parseFunc(attrs['data-function-2']);
    const f3 = parseFunc(attrs['data-function-3']);

    const scatteredPts = parsePoints(attrs['data-points']);
    const testPts = parsePoints(attrs['data-test-points']);

    // ── Sample curves ──────────────────────────────────────────────────────────
    const curve = [], curve2 = [], curve3 = [];
    let minY = Infinity, maxY = -Infinity;
    const updateRange = pts => pts.forEach(p => { minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y); });
    updateRange(scatteredPts);
    updateRange(testPts);

    const sample = (fn, out) => {
        for (let i = 0; i <= 120; i++) {
            const x = minX + (i / 120) * (maxX - minX);
            try { const y = fn(x); if (isFinite(y)) { out.push({ x, y }); minY = Math.min(minY, y); maxY = Math.max(maxY, y); } } catch { }
        }
    };
    if (f) sample(f, curve);
    if (f2) sample(f2, curve2);
    if (f3) sample(f3, curve3);

    if (!isFinite(minY)) { minY = 0; maxY = 1; }
    const rangeY = maxY - minY;
    const padY = rangeY === 0 ? 1 : rangeY * 0.15;
    const dMinY = minY - padY, dMaxY = maxY + padY;

    const sx = v => ((v - minX) / (maxX - minX)) * W;
    const sy = v => H - ((v - dMinY) / (dMaxY - dMinY)) * H;

    const pathD = pts => pts.map((p, i) =>
        `${i === 0 ? 'M' : 'L'}${sx(p.x).toFixed(1)} ${sy(p.y).toFixed(1)}`).join(' ');

    // ── Layout offsets ─────────────────────────────────────────────────────────
    const PAD_L = 50, PAD_T = title ? 28 : 10, PAD_R = 15, PAD_B = xTitle ? 40 : 20;
    const totalW = PAD_L + W + PAD_R;
    const totalH = PAD_T + H + PAD_B;

    // ── Axis ticks ─────────────────────────────────────────────────────────────
    const xTickMode = attrs['data-x-ticks'] || '';
    const yTickMode = attrs['data-y-ticks'] || '';

    let xTicksSvg = '', yTicksSvg = '';
    if (xTickMode !== 'none') {
        const ticks = xTickMode ? xTickMode.split(',').map(Number) : [minX, (minX + maxX) / 2, maxX];
        xTicksSvg = ticks.map(v => {
            const px = PAD_L + sx(v);
            return `<line x1="${px}" y1="${PAD_T + H}" x2="${px}" y2="${PAD_T + H + 4}" stroke="#94a3b8" stroke-width="1"/>
              <text x="${px}" y="${PAD_T + H + 16}" text-anchor="middle" font-size="9" fill="#64748b" font-family="sans-serif">${Number.isInteger(v) ? v : v.toFixed(1)}</text>`;
        }).join('');
    }
    if (yTickMode !== 'none') {
        const ticks = yTickMode ? yTickMode.split(',').map(Number) : [minY, (minY + maxY) / 2, maxY];
        yTicksSvg = ticks.map(v => {
            const py = PAD_T + sy(v);
            return `<line x1="${PAD_L - 4}" y1="${py}" x2="${PAD_L}" y2="${py}" stroke="#94a3b8" stroke-width="1"/>
              <text x="${PAD_L - 8}" y="${py + 3}" text-anchor="end" font-size="9" fill="#64748b" font-family="sans-serif">${Number.isInteger(v) ? v : v.toFixed(1)}</text>`;
        }).join('');
    }

    // ── Title ──────────────────────────────────────────────────────────────────
    const titleSvg = title
        ? `<text x="${PAD_L + W / 2}" y="${PAD_T - 8}" text-anchor="middle" font-size="13" font-weight="600" fill="#1e293b" font-family="sans-serif">${escXml(title)}</text>` : '';

    // ── Axis titles ────────────────────────────────────────────────────────────
    const xTitleSvg = xTitle
        ? `<text x="${PAD_L + W / 2}" y="${totalH - 4}" text-anchor="middle" font-size="11" font-weight="600" fill="#64748b" font-family="sans-serif">${escXml(xTitle)}</text>` : '';
    const yTitleSvg = yTitle
        ? `<text x="14" y="${PAD_T + H / 2}" text-anchor="middle" font-size="11" font-weight="600" fill="#64748b" font-family="sans-serif" transform="rotate(-90, 14, ${PAD_T + H / 2})">${escXml(yTitle)}</text>` : '';

    // ── Axes ───────────────────────────────────────────────────────────────────
    const axesSvg = `
    <line x1="${PAD_L}" y1="${PAD_T}" x2="${PAD_L}" y2="${PAD_T + H}" stroke="#cbd5e1" stroke-width="1.5"/>
    <line x1="${PAD_L}" y1="${PAD_T + H}" x2="${PAD_L + W}" y2="${PAD_T + H}" stroke="#cbd5e1" stroke-width="1.5"/>
    <line x1="${PAD_L}" y1="${PAD_T + H / 2}" x2="${PAD_L + W}" y2="${PAD_T + H / 2}" stroke="#e2e8f0" stroke-width="0.6" stroke-dasharray="4,4"/>
    <line x1="${PAD_L + W / 2}" y1="${PAD_T}" x2="${PAD_L + W / 2}" y2="${PAD_T + H}" stroke="#e2e8f0" stroke-width="0.6" stroke-dasharray="4,4"/>`;

    // ── Curves ─────────────────────────────────────────────────────────────────
    const mkPath = (pts, col) => pts.length > 0
        ? `<path d="${pathD(pts)}" fill="none" stroke="${col}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" transform="translate(${PAD_L},${PAD_T})"/>` : '';

    const curvesSvg = mkPath(curve, color) + mkPath(curve2, color2) + mkPath(curve3, color3);

    // ── Scatter (train) ────────────────────────────────────────────────────────
    const ptsSvg = scatteredPts.map(p => {
        const cx = PAD_L + sx(p.x), cy = PAD_T + sy(p.y);
        let s = `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="5" fill="#1e293b" stroke="white" stroke-width="1.5"/>`;
        if (p.label) s += `<text x="${cx + 8}" y="${cy - 6}" font-size="10" fill="#334155" font-family="sans-serif">${escXml(p.label)}</text>`;
        return s;
    }).join('');

    // ── Scatter (test) — amber ─────────────────────────────────────────────────
    const testSvg = testPts.map(p => {
        const cx = PAD_L + sx(p.x), cy = PAD_T + sy(p.y);
        let s = `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="5" fill="#f59e0b" stroke="white" stroke-width="1.5"/>`;
        if (p.label) s += `<text x="${cx + 8}" y="${cy - 6}" font-size="10" fill="#b45309" font-family="sans-serif">${escXml(p.label)}</text>`;
        return s;
    }).join('');

    // ── Vectors (arrows) ───────────────────────────────────────────────────────
    let vectorsSvg = '';
    const vectorsStr = attrs['data-vectors'] || '';
    if (vectorsStr) {
        vectorsSvg += `<defs><marker id="ah" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6 z" fill="#6366f1"/></marker></defs>`;
        vectorsStr.split(';').forEach(v => {
            const parts = v.trim().split(',');
            if (parts.length >= 4) {
                const x1 = +parts[0], y1 = +parts[1], x2 = +parts[2], y2 = +parts[3];
                const lbl = parts[4] ? parts[4].trim() : '';
                const px1 = PAD_L + sx(x1), py1 = PAD_T + sy(y1);
                const px2 = PAD_L + sx(x2), py2 = PAD_T + sy(y2);
                vectorsSvg += `<line x1="${px1}" y1="${py1}" x2="${px2}" y2="${py2}" stroke="#6366f1" stroke-width="2" marker-end="url(#ah)"/>`;
                if (lbl) vectorsSvg += `<text x="${px2 + 6}" y="${py2 - 6}" font-size="11" font-weight="600" fill="#334155" font-family="sans-serif">${escXml(lbl)}</text>`;
            }
        });
    }

    // ── Dotted lines ───────────────────────────────────────────────────────────
    let dottedSvg = '';
    const dottedStr = attrs['data-dotted-lines'] || '';
    if (dottedStr) {
        dottedStr.split(';').forEach(dl => {
            const pts = dl.trim().split(',').map(Number);
            if (pts.length >= 4) {
                dottedSvg += `<line x1="${PAD_L + sx(pts[0])}" y1="${PAD_T + sy(pts[1])}" x2="${PAD_L + sx(pts[2])}" y2="${PAD_T + sy(pts[3])}" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="5,4"/>`;
            }
        });
    }

    // ── Legend ─────────────────────────────────────────────────────────────────
    let legendSvg = '';
    const items = [
        legend ? { label: legend, c: color } : null,
        legend2 ? { label: legend2, c: color2 } : null,
        legend3 ? { label: legend3, c: color3 } : null,
    ].filter(Boolean);
    if (items.length > 0) {
        const lw = Math.max(...items.map(i => i.label.length)) * 7 + 30;
        const lh = items.length * 18 + 10;
        const lx = PAD_L + W - lw - 4, ly = PAD_T + 6;
        legendSvg += `<rect x="${lx}" y="${ly}" width="${lw}" height="${lh}" rx="4" fill="white" fill-opacity="0.9" stroke="#e2e8f0"/>`;
        items.forEach((it, i) => {
            const ty = ly + 14 + i * 18;
            legendSvg += `<line x1="${lx + 6}" y1="${ty}" x2="${lx + 18}" y2="${ty}" stroke="${it.c}" stroke-width="3" stroke-linecap="round"/>`;
            legendSvg += `<text x="${lx + 24}" y="${ty + 4}" font-size="10" fill="#64748b" font-family="sans-serif">${escXml(it.label)}</text>`;
        });
    }

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${totalW * 2}" height="${totalH * 2}" viewBox="0 0 ${totalW} ${totalH}">
  <rect width="${totalW}" height="${totalH}" fill="white" rx="6"/>
  ${titleSvg}
  ${axesSvg}
  ${xTicksSvg}
  ${yTicksSvg}
  ${dottedSvg}
  ${curvesSvg}
  ${ptsSvg}
  ${testSvg}
  ${vectorsSvg}
  ${legendSvg}
  ${xTitleSvg}
  ${yTitleSvg}
</svg>`;
}

function render3DPlotSVG() {
    const total = 600;

    // Isometric Projection Math
    const cx = total / 2;
    const cy = total / 2 + 100;
    const scale = 140;
    const Math_cos = Math.cos(Math.PI / 6);
    const Math_sin = Math.sin(Math.PI / 6);

    function project(x, y, z) {
        const px = (x - y) * Math_cos;
        const py = (x + y) * Math_sin + z * 0.4;
        return {
            x: cx + px * scale,
            y: cy + py * scale
        };
    }

    let wireframeSvg = '';
    const n = 24;

    // Draw grid lines in X
    for (let i = 0; i <= n; i++) {
        const x = -1 + (i / n) * 2;
        let path = '';
        for (let j = 0; j <= n; j++) {
            const y = -1 + (j / n) * 2;
            const z = -(x * x + y * y);
            const p = project(x, y, z);
            path += (j === 0 ? 'M' : 'L') + p.x.toFixed(1) + ' ' + p.y.toFixed(1) + ' ';
        }
        wireframeSvg += `<path d="${path}" fill="none" stroke="#6366f1" stroke-width="1.2" opacity="0.65"/>\n`;
    }

    // Draw grid lines in Y
    for (let j = 0; j <= n; j++) {
        const y = -1 + (j / n) * 2;
        let path = '';
        for (let i = 0; i <= n; i++) {
            const x = -1 + (i / n) * 2;
            const z = -(x * x + y * y);
            const p = project(x, y, z);
            path += (i === 0 ? 'M' : 'L') + p.x.toFixed(1) + ' ' + p.y.toFixed(1) + ' ';
        }
        wireframeSvg += `<path d="${path}" fill="none" stroke="#6366f1" stroke-width="1.2" opacity="0.65"/>\n`;
    }

    // Gradient descent path descending to minimum
    const gdPoints = [[-0.8, -0.6], [-0.5, -0.3], [-0.2, -0.1], [-0.05, -0.02], [0, 0]];
    let gdPathStr = '';
    let gdPointsSvg = '';
    gdPoints.forEach((pt, i) => {
        const [x, y] = pt;
        const z = -(x * x + y * y);
        const p = project(x, y, z);
        gdPathStr += (i === 0 ? 'M' : 'L') + p.x.toFixed(1) + ' ' + p.y.toFixed(1) + ' ';
        gdPointsSvg += `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${i === gdPoints.length - 1 ? 6 : 4}" fill="${i === gdPoints.length - 1 ? '#ef4444' : '#f59e0b'}"/>\n`;
    });

    const gdPathSvg = `<path d="${gdPathStr}" fill="none" stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round"/>\n`;
    const minP = project(0, 0, 0);

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${total * 2}" height="${total * 2}" viewBox="0 0 ${total} ${total}">
  <rect width="${total}" height="${total}" fill="white" rx="6"/>
  
  <text x="${total / 2}" y="40" text-anchor="middle" font-size="20" font-weight="600" fill="#1e293b" font-family="sans-serif">Convex Cost Surface J(w, b)</text>
  
  <!-- 3D Wireframe Paraboloid -->
  ${wireframeSvg}
  
  <!-- Gradient Descent Trajectory -->
  ${gdPathSvg}
  ${gdPointsSvg}
  
  <!-- Labels -->
  <text x="${minP.x}" y="${minP.y + 25}" text-anchor="middle" font-size="14" font-weight="600" fill="#ef4444" font-family="sans-serif">Global Minimum</text>
  <text x="${minP.x - 220}" y="${minP.y + 110}" text-anchor="middle" font-size="14" font-weight="600" fill="#64748b" font-family="sans-serif">w / parameter 1</text>
  <text x="${minP.x + 220}" y="${minP.y + 110}" text-anchor="middle" font-size="14" font-weight="600" fill="#64748b" font-family="sans-serif">b / parameter 2</text>
</svg>`;
}

// ── Main ───────────────────────────────────────────────────────────────────────
(async () => {
    console.log('🎨  Mini-Graph Renderer (programmatic SVG → PNG)\n');
    const manifest = {};

    for (const { file } of config.chapters) {
        const filePath = path.join(ROOT, file);
        if (!fs.existsSync(filePath)) continue;

        const key = path.basename(file, '.html');
        manifest[key] = [];
        console.log(`  📄  Processing: ${file}`);

        const html = fs.readFileSync(filePath, 'utf8');
        const $ = cheerio.load(html);
        const graphs = [];

        // Collect .mini-graph divs that have actual data
        $('[class*="mini-graph"]').each((_, el) => {
            const cls = $(el).attr('class') || '';
            if (cls.includes('mini-graph-legend') || cls.includes('mini-graph-tooltip') ||
                cls.includes('mini-graph-container') || cls.includes('mini-graph-svg') ||
                cls.includes('mini-graph-path') || cls.includes('mini-graph-point') ||
                cls.includes('mini-graph-axis') || cls.includes('mini-graph-tick')) return;
            if (!$(el).attr('data-function') && !$(el).attr('data-points') && !$(el).attr('data-vectors')) return;
            graphs.push($(el).attr());
        });

        // Check for 3D plot
        const has3D = $('[id="convex-3d-plot"]').length > 0;

        console.log(`      Found ${graphs.length} graph(s)${has3D ? ' + 3D plot' : ''}`);

        for (let i = 0; i < graphs.length; i++) {
            const attrs = graphs[i];
            const title = attrs['data-title'] || attrs['data-x-title'] || `Graph ${i + 1}`;
            const outFile = path.join(GRAPH_DIR, `${key}-${i}.png`);
            try {
                const svg = renderGraphSVG(attrs);
                await sharp(Buffer.from(svg)).png().toFile(outFile);
                console.log(`      ✅  ${title}`);
                manifest[key].push({ index: i, title, file: `graphs/${key}-${i}.png` });
            } catch (err) {
                console.error(`      ❌  ${title}: ${err.message}`);
            }
        }

        // Generate 3D surface plot image if present
        if (has3D) {
            const outFile = path.join(GRAPH_DIR, `${key}-3d.png`);
            try {
                const svg = render3DPlotSVG();
                await sharp(Buffer.from(svg)).png().toFile(outFile);
                console.log(`      ✅  3D Cost Surface`);
                manifest[key].push({ index: '3d', title: 'Convex Function of Squared Error Cost Surface J(w, b)', file: `graphs/${key}-3d.png` });
            } catch (err) {
                console.error(`      ❌  3D plot: ${err.message}`);
            }
        }
    }

    const manifestPath = path.join(__dirname, 'graphs_manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
    console.log(`\n✅  Manifest → ${manifestPath}`);
    console.log('\nNow run:  node pdf_conversion/html_to_latex.js');
})();
