/**
 * capture_graphs.js
 *
 * Uses Puppeteer to open each HTML page, wait for the JS mini-graph engine
 * to render, then screenshots every .mini-graph element and saves the PNGs
 * to  pdf_conversion/images/graphs/<chapter>-<index>.png
 *
 * Must be run BEFORE html_to_latex.js.
 *
 * Usage:
 *   node pdf_conversion/capture_graphs.js
 */

'use strict';

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const config = require('./config');

const ROOT = path.resolve(__dirname, '..');
const GRAPH_DIR = path.join(__dirname, 'images', 'graphs');
fs.mkdirSync(GRAPH_DIR, { recursive: true });

// ── Helpers ────────────────────────────────────────────────────────────────────

function chapterKey(file) {
    return path.basename(file, '.html');
}

// ── Main ───────────────────────────────────────────────────────────────────────

(async () => {
    console.log('📷  Mini-Graph Screenshot Capture\n');

    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    // Write a manifest so html_to_latex.js knows which graphs exist.
    const manifest = {};

    for (const { file } of config.chapters) {
        const filePath = path.join(ROOT, file);
        if (!fs.existsSync(filePath)) {
            console.warn(`  ⚠  Skipping (not found): ${file}`);
            continue;
        }

        const key = chapterKey(file);
        manifest[key] = [];
        console.log(`  🌐  Opening: ${file}`);

        const page = await browser.newPage();
        await page.setViewport({ width: config.graphCaptureWidth, height: 900 });
        await page.goto(`file:///${filePath.replace(/\\/g, '/')}`, {
            waitUntil: 'networkidle0',
            timeout: 60_000,
        });

        // Wait for graphs to finish rendering (the engine draws to SVG)
        await new Promise(r => setTimeout(r, 1200));

        const graphCount = await page.$$eval('.mini-graph', els => els.length);
        console.log(`      Found ${graphCount} graph(s)`);

        for (let i = 0; i < graphCount; i++) {
            try {
                // Re-query each time to avoid stale handles
                const title = await page.$$eval('.mini-graph', (els, idx) => {
                    const el = els[idx];
                    return el.getAttribute('data-title') ||
                        el.getAttribute('data-x-title') ||
                        `Graph ${idx + 1}`;
                }, i);

                const outFile = path.join(GRAPH_DIR, `${key}-${i}.png`);

                // Scroll into view, then screenshot by bounding box
                await page.$$eval('.mini-graph', (els, idx) => {
                    els[idx].scrollIntoView({ block: 'center' });
                }, i);
                await new Promise(r => setTimeout(r, 200));

                const box = await page.$$eval('.mini-graph', (els, idx) => {
                    const r = els[idx].getBoundingClientRect();
                    return { x: r.x, y: r.y, width: r.width, height: r.height };
                }, i);

                await page.screenshot({
                    path: outFile,
                    clip: {
                        x: Math.max(0, box.x),
                        y: Math.max(0, box.y),
                        width: box.width,
                        height: box.height,
                    },
                });

                manifest[key].push({ index: i, title, file: `graphs/${key}-${i}.png` });
                console.log(`      ✅  ${title}`);
            } catch (err) {
                console.warn(`      ⚠  Graph ${i} failed: ${err.message}`);
            }
        }

        await page.close();
    }

    await browser.close();

    // Save manifest
    const manifestPath = path.join(__dirname, 'graphs_manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
    console.log(`\n✅  Manifest written → ${manifestPath}`);
    console.log('\nNow run:  node pdf_conversion/html_to_latex.js');
})();
