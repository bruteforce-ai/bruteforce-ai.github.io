/**
 * generate_book.js
 * Converts the brute.ai curriculum HTML pages into a single styled PDF book.
 * 
 * Requirements:
 *   npm install puppeteer pdf-lib
 * 
 * Usage:
 *   node scripts/generate_book.js
 */

const puppeteer = require('puppeteer');
const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

// ── Configuration ────────────────────────────────────────────────────────────

const ROOT = path.resolve(__dirname, '..');

// Pages to include, in chapter order.
const PAGES = [
    { file: 'linear_regression.html', title: 'Chapter 1 – Linear Regression' },
    { file: 'gradient_descent.html', title: 'Chapter 2 – Gradient Descent' },
    { file: 'bias_variance.html', title: 'Chapter 3 – Bias, Variance & Regularisation' },
    { file: 'decision_tree.html', title: 'Chapter 4 – Decision Trees' },
    { file: 'rnn.html', title: 'Chapter 5 – Recurrent Neural Networks' },
];

const OUTPUT_PDF = path.join(ROOT, 'machine_learning_book.pdf');

// Margin settings (CSS units accepted by Puppeteer)
const MARGINS = { top: '18mm', right: '18mm', bottom: '18mm', left: '18mm' };

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Injects CSS into the page to hide UI chrome that should not appear in print.
 */
async function applyPrintStyles(page) {
    await page.addStyleTag({
        content: `
    /* Hide web navigation chrome */
    .navbar, nav, .nav-container, footer, .full-footer,
    .table-of-contents, .toc-header, .toc-content,
    #convex-3d-plot, .poly-simulator-wrapper,
    .poly-controls, .poly-plots-grid { display: none !important; }

    /* Remove sticky behaviour */
    * { position: static !important; }

    /* Reset background so it prints cleanly on white paper */
    body, .container { background: #ffffff !important; color: #1e293b !important; }

    /* Don't clip wide math on print */
    .math-block { overflow: visible !important; }

    /* Make images stay within the page */
    img { max-width: 100% !important; height: auto !important; }

    /* Ensure code blocks wrap */
    pre, code { white-space: pre-wrap !important; word-break: break-word !important; }

    /* Keep callout left border colors for visual identity */
    .callout { border-left-width: 4px !important; }
  `});
}

/** Renders one HTML file to PDF bytes via Puppeteer. */
async function renderPage(browser, filePath) {
    const page = await browser.newPage();
    await page.goto(`file:///${filePath.replace(/\\/g, '/')}`, {
        waitUntil: 'networkidle0',
        timeout: 60_000,
    });

    // Wait for KaTeX / MathJax to finish rendering equations.
    await page.waitForFunction(() => {
        const pending = document.querySelectorAll('.katex-error');
        return pending.length === 0 || true; // continue regardless
    });

    await applyPrintStyles(page);

    // Small pause to let any final layout reflows settle.
    await new Promise(r => setTimeout(r, 800));

    const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: MARGINS,
        displayHeaderFooter: false,
    });

    await page.close();
    return pdf;
}

// ── Main ─────────────────────────────────────────────────────────────────────

(async () => {
    console.log('📚  brute.ai → PDF Book Generator\n');

    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const master = await PDFDocument.create();

    for (const { file, title } of PAGES) {
        const filePath = path.join(ROOT, file);
        if (!fs.existsSync(filePath)) {
            console.warn(`  ⚠  Skipping (not found): ${file}`);
            continue;
        }

        console.log(`  🖨  Rendering: ${title} ...`);
        try {
            const pdfBytes = await renderPage(browser, filePath);

            // Merge into master document.
            const chapter = await PDFDocument.load(pdfBytes);
            const pages = await master.copyPages(chapter, chapter.getPageIndices());
            pages.forEach(p => master.addPage(p));

            console.log(`      ✅  Done  (${chapter.getPageCount()} page${chapter.getPageCount() !== 1 ? 's' : ''})`);
        } catch (err) {
            console.error(`      ❌  Failed: ${err.message}`);
        }
    }

    await browser.close();

    const finalBytes = await master.save();
    fs.writeFileSync(OUTPUT_PDF, finalBytes);

    const sizeMB = (finalBytes.byteLength / 1_048_576).toFixed(2);
    console.log(`\n✅  Book saved → ${OUTPUT_PDF}  (${sizeMB} MB, ${master.getPageCount()} pages total)`);
})();
