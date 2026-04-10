/**
 * html_to_latex.js
 *
 * Converts brute.ai HTML curriculum pages into a single LaTeX book.
 * Reads config from config.js, graph images from graphs_manifest.json.
 *
 * Usage:
 *   node pdf_conversion/render_graphs.js    (first)
 *   node pdf_conversion/html_to_latex.js    (then)
 */

'use strict';

const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const config = require('./config');

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = __dirname;
const IMG_DIR = path.join(OUT_DIR, 'images');
const TEX_OUT = path.join(OUT_DIR, 'machine_learning_book.tex');
const MANIFEST_PATH = path.join(OUT_DIR, 'graphs_manifest.json');

fs.mkdirSync(IMG_DIR, { recursive: true });

const graphManifest = fs.existsSync(MANIFEST_PATH)
    ? JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'))
    : {};

// ── Preamble ────────────────────────────────────────────────────────────────────

function buildPreamble() {
    const fancyhdr = config.footer ? `
\\usepackage{fancyhdr}
\\pagestyle{fancy}
\\fancyhf{}
\\renewcommand{\\headrulewidth}{0pt}
\\fancyfoot[L]{${config.footer}}
\\fancyfoot[R]{\\thepage}
` : '';

    return `\\documentclass[${config.fontSize}, ${config.paperSize}, openany]{book}

\\usepackage[T1]{fontenc}
\\usepackage[utf8]{inputenc}
\\usepackage{lmodern}
\\usepackage[${config.paperSize}, margin=${config.margin}]{geometry}
\\setlength{\\parindent}{0pt}
\\setlength{\\parskip}{0.6em}
${fancyhdr}
\\usepackage{amsmath, amssymb, amsfonts, mathtools}
\\usepackage[dvipsnames, svgnames, x11names]{xcolor}
\\usepackage{graphicx}
\\graphicspath{{images/}}
\\usepackage[colorlinks=true, linkcolor=Indigo, urlcolor=Teal]{hyperref}
\\usepackage{url}

\\usepackage{listings}
\\lstdefinestyle{brute}{
  backgroundcolor=\\color{gray!8},
  basicstyle=\\footnotesize\\ttfamily,
  keywordstyle=\\color{Indigo}\\bfseries,
  stringstyle=\\color{Teal},
  commentstyle=\\color{gray}\\itshape,
  breaklines=true, breakatwhitespace=true,
  tabsize=4, showstringspaces=false,
  frame=single, frameround=tttt, rulecolor=\\color{gray!40},
}
\\lstset{style=brute}

\\usepackage[most]{tcolorbox}
\\newtcolorbox{calloutinfo}{colback=Indigo!8, colframe=Indigo!70!black, leftrule=4pt, toprule=0pt, bottomrule=0pt, rightrule=0pt, arc=4pt, boxsep=4pt, left=6pt}
\\newtcolorbox{calloutwarning}{colback=Amber!10, colframe=Amber!80!black, leftrule=4pt, toprule=0pt, bottomrule=0pt, rightrule=0pt, arc=4pt, boxsep=4pt, left=6pt}
\\newtcolorbox{calloutsuccess}{colback=Teal!8, colframe=Teal!70!black, leftrule=4pt, toprule=0pt, bottomrule=0pt, rightrule=0pt, arc=4pt, boxsep=4pt, left=6pt}
\\newtcolorbox{mathblock}{colback=Indigo!4, colframe=Indigo!25, arc=4pt, boxsep=4pt, left=8pt, right=8pt, top=4pt, bottom=4pt}

\\usepackage{titlesec}
\\titleformat{\\chapter}[display]{\\normalfont\\LARGE\\bfseries\\color{Indigo!80!black}}{\\chaptertitlename\\ \\thechapter}{20pt}{\\Huge}
\\titleformat{\\section}{\\normalfont\\Large\\bfseries\\color{Indigo!70!black}}{\\thesection}{1em}{}
\\titleformat{\\subsection}{\\normalfont\\large\\bfseries\\color{Teal!70!black}}{\\thesubsection}{1em}{}

\\newcommand{\\highlight}[1]{\\textbf{\\textcolor{Indigo}{#1}}}
\\newcommand{\\highlightmaths}[1]{\\textbf{\\textcolor{Teal}{#1}}}
\\newcommand{\\highlightintuition}[1]{\\textbf{\\textcolor{Violet}{#1}}}

\\title{\\textbf{\\Huge ${config.title}}\\\\[0.5em]\\large ${config.subtitle}}
\\author{${config.author}}
\\date{${config.date}}

\\begin{document}
\\maketitle
${config.tableOfContents ? '\\begingroup\n\\setlength{\\parskip}{0pt}\n\\tableofcontents\n\\endgroup\n\\newpage' : ''}
`;
}

function buildPostamble() {
    if (!config.showReferences) return '\n\\end{document}\n';
    const items = config.references.map(r => `  \\item ${r}`).join('\n');
    return `
\\chapter*{References \\& Further Reading}
\\begin{enumerate}
${items}
\\end{enumerate}

\\end{document}
`;
}

// ── Text Utilities ──────────────────────────────────────────────────────────────

function escTex(str) {
    if (!str) return '';

    // First apply basic text replacements
    str = str
        .replace(/\u2014/g, '---')
        .replace(/\u2013/g, '--')
        .replace(/\u2018|\u2019/g, "'")
        .replace(/\u201c|\u201d/g, '"')
        .replace(/[^\x00-\x7F\u25cf\u2192]/g, '');

    // Now escape LaTeX control characters
    str = str
        .replace(/\\/g, '\\textbackslash{}')
        .replace(/&/g, '\\&')
        .replace(/%/g, '\\%')
        .replace(/\$/g, '\\$')
        .replace(/#/g, '\\#')
        .replace(/_/g, '\\_')
        .replace(/\^/g, '\\^{}')
        .replace(/~/g, '\\textasciitilde{}')
        .replace(/\{/g, '\\{')
        .replace(/\}/g, '\\}')
        .replace(/</g, '\\textless{}')
        .replace(/>/g, '\\textgreater{}');

    // Finally inject LaTeX macros
    return str
        .replace(/\u25cf/g, '\\textbullet{} ')
        .replace(/\u2192/g, '$\\rightarrow$ ');
}

/**
 * Split text into text / inlinemath / displaymath segments.
 * Key fix: use a regex that won't match single-letter $X$ greedily
 * when followed by more $ signs.
 */
function splitMath(raw) {
    const segs = [];
    const re = /(\$\$[\s\S]*?\$\$|\$(?:[^$\n\\]|\\.)+?\$)/g;
    let last = 0, m;
    while ((m = re.exec(raw)) !== null) {
        if (m.index > last) {
            segs.push({ type: 'text', content: raw.slice(last, m.index) });
        }
        const tok = m[0];
        if (tok.startsWith('$$')) {
            segs.push({
                type: 'displaymath',
                content: tok.slice(2, -2).trim()
            });
        } else {
            segs.push({
                type: 'inlinemath',
                content: '\\displaystyle ' + tok.slice(1, -1).trim()
            });
        }
        last = re.lastIndex;
    }
    if (last < raw.length) {
        segs.push({ type: 'text', content: raw.slice(last) });
    }
    return segs;
}

const LATEX_CMD = /\\(begin|end|frac|cdot|nabla|sum|prod|int|vdots|bmatrix|pmatrix|align|text|mathbf|arg|min|max|sigma|lambda|epsilon|mu|sqrt|hat|bar|vec|left|right|quad|implies|leq|geq|neq|partial|infty|color)/;

function renderMixedText(raw) {
    return splitMath(raw).map(seg => {
        if (seg.type === 'text') return LATEX_CMD.test(seg.content) ? seg.content.replace(/\\color\{#([0-9a-fA-F]+)\}/g, '\\color[HTML]{$1}') : escTex(seg.content);
        if (seg.type === 'inlinemath') return `$${seg.content.replace(/\\color\{#([0-9a-fA-F]+)\}/g, '\\color[HTML]{$1}')}$`;
        if (seg.type === 'displaymath') {
            const inner = seg.content.replace(/\\color\{#([0-9a-fA-F]+)\}/g, '\\color[HTML]{$1}').trim();
            const hasOuterEnv = /^\\begin\{(align|gather|multline|equation|split)\*?\}/.test(inner);
            if (hasOuterEnv) return `${inner}`;

            if (inner.includes('\\\\') || inner.includes('&')) {
                const env = inner.includes('&') ? 'align*' : 'gather*';
                return `\\begin{${env}}\n${inner}\n\\end{${env}}`;
            }
            return `\\[\n${inner}\n\\]`;
        }
        return '';
    }).join('');
}

// ── Image/Graph ─────────────────────────────────────────────────────────────────

function copyImage(src, htmlDir, alt, noFloat) {
    if (!src || src.startsWith('http')) return '';
    const abs = path.resolve(htmlDir, src);
    if (!fs.existsSync(abs)) {
        console.warn(`    ⚠  Image not found: ${abs}`);
        return '';
    }
    const bn = path.basename(abs);
    fs.copyFileSync(abs, path.join(IMG_DIR, bn));
    if (noFloat) {
        return `\n\\begin{center}\n  \\includegraphics[width=0.85\\textwidth]{${bn}}\n\\\\[0.5em]  \\small\\textit{${alt ? escTex(alt) : bn}}\n\\end{center}\n`;
    }
    return `\n\\begin{figure}[h!]\n  \\centering\n  \\includegraphics[width=0.85\\textwidth]{${bn}}\n  \\caption{${alt ? escTex(alt) : bn}}\n\\end{figure}\n`;
}

function graphFigure(chapterKey, graphIndex, title, width, noFloat) {
    const graphs = graphManifest[chapterKey];
    if (!graphs || !graphs[graphIndex]) {
        return `\n\\textit{[Interactive graph: ${escTex(title)}]}\n`;
    }
    const entry = graphs[graphIndex];
    const scale = width || (config.graphImageScale || 0.75);
    const caption = escTex(entry.title || title);
    if (noFloat) {
        return `\n\\begin{center}\n  \\includegraphics[width=${scale}\\textwidth]{${entry.file}}\n\\\\[0.5em]  \\small\\textit{${caption}}\n\\end{center}\n`;
    }
    return `\n\\begin{figure}[h!]\n  \\centering\n  \\includegraphics[width=${scale}\\textwidth]{${entry.file}}\n  \\caption{${caption}}\n\\end{figure}\n`;
}

function graph3DFigure(chapterKey, noFloat) {
    const graphs = graphManifest[chapterKey];
    if (!graphs) return '';
    const entry = graphs.find(g => g.index === '3d');
    if (!entry) return '';
    if (noFloat) {
        return `\n\\begin{center}\n  \\includegraphics[width=0.65\\textwidth]{${entry.file}}\n\\\\[0.5em]  \\small\\textit{${escTex(entry.title)}}\n\\end{center}\n`;
    }
    return `\n\\begin{figure}[h!]\n  \\centering\n  \\includegraphics[width=0.65\\textwidth]{${entry.file}}\n  \\caption{${escTex(entry.title)}}\n\\end{figure}\n`;
}

// ── Node converter ──────────────────────────────────────────────────────────────

function convertNode($, node, depth, htmlDir, chapterKey, graphCounter) {
    if (node.type === 'text') return renderMixedText(node.data || '');
    if (node.type === 'comment') return '';

    const el = $(node);
    const tag = (node.name || '').toLowerCase();
    const cls = el.attr('class') || '';
    const kids = () => el.contents().toArray()
        .map(c => convertNode($, c, depth + 1, htmlDir, chapterKey, graphCounter)).join('');

    // ── Skip ──────────────────────────────────────────────────────────────────
    if (['nav', 'header', 'footer', 'script', 'style', 'button'].includes(tag)) return '';
    if (cls.includes('table-of-contents') || cls.includes('navbar') ||
        cls.includes('mini-graph-legend') || cls.includes('mini-graph-tooltip') ||
        cls.includes('not-pdf')) return '';

    // ── Inline Colors ─────────────────────────────────────────────────────────
    if (tag === 'span') {
        const styleAttr = el.attr('style') || '';
        const colorMatch = styleAttr.match(/color:\s*(?:var\([^,]+,\s*(#[0-9a-fA-F]+)\)|(#[0-9a-fA-F]+))/i);
        if (colorMatch) {
            const hex = (colorMatch[1] || colorMatch[2]).replace('#', '');
            return `\\textcolor[HTML]{${hex}}{${kids()}}`;
        }
    }

    // ── 3D Plot ───────────────────────────────────────────────────────────────
    if (el.attr('id') === 'convex-3d-plot') return graph3DFigure(chapterKey, graphCounter.inMinipage);

    // ── Headings ──────────────────────────────────────────────────────────────
    if (tag === 'h1') return `\n\\section*{${renderMixedText(el.text().trim())}}\n`;
    if (tag === 'h2') return `\n\\section{${renderMixedText(el.text().trim().replace(/:/g, ''))}}\n`;
    if (tag === 'h3') return `\n\\subsection{${renderMixedText(el.text().trim())}}\n`;
    if (tag === 'h4') return `\n\\subsubsection{${renderMixedText(el.text().trim())}}\n`;

    // ── Images ────────────────────────────────────────────────────────────────
    if (tag === 'img') return copyImage(el.attr('src') || '', htmlDir, el.attr('alt') || '', graphCounter.inMinipage);
    if (tag === 'svg') return '';

    // ── Side-by-side layout → minipage ────────────────────────────────────────
    if (cls.includes('side-by-side')) {
        const children = el.children().toArray();
        if (children.length >= 2) {
            // Determine ratio
            let leftW = 0.48, rightW = 0.48;
            if (cls.includes('ratio-1-2')) { leftW = 0.35; rightW = 0.60; }
            if (cls.includes('ratio-2-1')) { leftW = 0.60; rightW = 0.35; }

            const wasInMinipage = graphCounter.inMinipage;
            graphCounter.inMinipage = true;
            const left = convertNode($, children[0], depth + 1, htmlDir, chapterKey, graphCounter);
            const right = convertNode($, children[1], depth + 1, htmlDir, chapterKey, graphCounter);
            graphCounter.inMinipage = wasInMinipage;

            return `
\\noindent
\\begin{minipage}[t]{${leftW}\\textwidth}
\\vspace{0pt}
${left.trim()}
\\end{minipage}\\hfill
\\begin{minipage}[t]{${rightW}\\textwidth}
\\vspace{0pt}
${right.trim()}
\\end{minipage}

`;
        }
        return kids();
    }

    // ── HTML Tables ───────────────────────────────────────────────────────────
    if (tag === 'table') {
        const rows = el.find('tr').toArray();
        if (rows.length > 0) {
            let cols = $(rows[0]).find('th, td').length;
            if (cols === 0) cols = 1;
            let colStr = Array(cols).fill('c').join(' | ');
            let result = `\n\\begin{center}\n\\renewcommand{\\arraystretch}{1.5}\n\\begin{tabular}{ | ${colStr} | }\n\\hline\n`;
            rows.forEach(tr => {
                const cells = $(tr).find('th, td').toArray();
                let rowData = cells.map(td => convertNode($, td, depth + 1, htmlDir, chapterKey, graphCounter).trim().replace(/\n/g, ' ')).join(' & ');
                result += rowData + ' \\\\\n\\hline\n';
            });
            result += `\\end{tabular}\n\\end{center}\n`;
            return result;
        }
    }

    // ── CSS Grid mapped to Tabular ────────────────────────────────────────────
    const styleAttr = el.attr('style') || '';
    if (tag === 'div' && styleAttr.includes('display: grid')) {
        const colsMatch = styleAttr.match(/grid-template-columns:\s*([^;]+)/);
        if (colsMatch) {
            const colDefs = colsMatch[1].trim().split(/\s+/);
            const numCols = colDefs.length;
            const children = el.children('div').toArray();
            if (numCols > 0 && children.length > 0 && children.length % numCols === 0) {
                let colStr = colDefs.map(c => c === 'auto' ? 'l' : 'c').join(' | ');
                let result = `\n\\begin{center}\n\\renewcommand{\\arraystretch}{1.5}\n\\begin{tabular}{ ${colStr} }\n\\hline\n`;
                for (let i = 0; i < children.length; i++) {
                    let cellData = convertNode($, children[i], depth + 1, htmlDir, chapterKey, graphCounter).trim().replace(/\n/g, ' ');
                    result += cellData + ((i + 1) % numCols === 0 ? ' \\\\\n\\hline\n' : ' & ');
                }
                result += `\\end{tabular}\n\\end{center}\n`;
                return result;
            }
        }
    }

    // ── Mini-graphs ───────────────────────────────────────────────────────────
    if (cls.includes('mini-graph') && !cls.includes('mini-graph-legend') && !cls.includes('mini-graph-tooltip')) {
        const title = el.attr('data-title') ||
            `${el.attr('data-y-title') || 'y'} vs ${el.attr('data-x-title') || 'x'}`;
        const idx = graphCounter.value++;
        return graphFigure(chapterKey, idx, title, null, graphCounter.inMinipage);
    }

    // ── Math blocks (boxed equations) ─────────────────────────────────────────
    if (cls.includes('math-block')) {
        const isPlain = cls.includes('plain');

        let rawContent = el.text()
            .trim()
            // Crush all consecutive empty lines inside math blocks to a single newline 
            // to prevent LaTeX `\par` aborts in AMS math environments.
            .replace(/\n\s*\n+/g, '\n');

        if (!rawContent.includes('$$')) {
            rawContent = `$$${rawContent}$$`;
        }

        let inner = renderMixedText(rawContent).trim();

        return isPlain
            ? `${inner}`
            : `\\begin{mathblock}\n${inner}\n\\end{mathblock}`;
    }

    // ── Callouts ──────────────────────────────────────────────────────────────
    if (cls.includes('callout-warning') || cls.includes('callout-success') || cls.includes('callout')) {
        const wasInCallout = graphCounter.inCallout;
        graphCounter.inCallout = true;
        let env = 'calloutinfo';
        if (cls.includes('callout-warning')) env = 'calloutwarning';
        if (cls.includes('callout-success')) env = 'calloutsuccess';
        const content = kids();
        graphCounter.inCallout = wasInCallout;
        return `\n\\begin{${env}}\n${content}\\end{${env}}\n`;
    }

    // ── Highlights ────────────────────────────────────────────────────────────
    if (cls.includes('highlight-maths')) return `\\highlightmaths{${kids()}}`;
    if (cls.includes('highlight-intuition')) return `\\highlightintuition{${kids()}}`;
    if (cls.includes('highlight')) return `\\highlight{${kids()}}`;

    // ── Formatting ────────────────────────────────────────────────────────────
    if (tag === 'strong' || tag === 'b') return `\\textbf{${kids()}}`;
    if (tag === 'em' || tag === 'i') return `\\textit{${kids()}}`;
    if (tag === 'u') return `\\underline{${kids()}}`;
    if (tag === 'code' && node.parent?.name !== 'pre') return `\\texttt{${escTex(el.text())}}`;

    // ── Code blocks ───────────────────────────────────────────────────────────
    if (tag === 'pre') {
        const lc = el.find('code').attr('class') || '';
        const lang = lc.includes('python') ? 'Python' : 'Bash';
        let code = (el.find('code').text() || el.text()).replace(/[^\x00-\x7F]/g, ' ');
        return `\n\\begin{lstlisting}[language=${lang}]\n${code}\n\\end{lstlisting}\n`;
    }

    // ── Lists ─────────────────────────────────────────────────────────────────
    if (tag === 'ul') return `\n\\begin{itemize}\n${kids()}\\end{itemize}\n`;
    if (tag === 'ol') return `\n\\begin{enumerate}\n${kids()}\\end{enumerate}\n`;
    if (tag === 'li') return `  \\item ${kids().trim()}\n`;

    // ── br: Keep inside callouts ──────────────────────────────────────────────
    if (tag === 'br') return graphCounter.inCallout ? '\\newline\n' : '';

    if (tag === 'hr') return '\n\\vspace{0.5em}\\hrule\\vspace{0.5em}\n';

    // ── Links ─────────────────────────────────────────────────────────────────
    if (tag === 'a') {
        const href = el.attr('href') || '';
        const text = kids().trim();
        if (href.startsWith('http')) return `\\href{${href}}{${text}}`;
        return text;
    }

    return kids();
}

// ── Page conversion ─────────────────────────────────────────────────────────────

function convertPage(filePath, chapterTitle, key) {
    const html = fs.readFileSync(filePath, 'utf8');
    const htmlDir = path.dirname(filePath);
    const $ = cheerio.load(html);

    // Remove pure chrome (but keep convex-3d-plot so we can detect it!)
    $('.navbar, nav, footer, .full-footer, .table-of-contents, script, style, button').remove();

    const graphCounter = { value: 0 };
    const mainEl = $('main').length ? $('main') : $('body');
    const body = mainEl.contents().toArray()
        .map(n => convertNode($, n, 0, htmlDir, key, graphCounter)).join('');

    const cleaned = body.replace(/\n{4,}/g, '\n\n\n').trim();
    return `\n\\chapter{${chapterTitle}}\n\n${cleaned}\n`;
}

// ── Entry ───────────────────────────────────────────────────────────────────────

console.log('📖  brute.ai → LaTeX Book Converter\n');
if (!fs.existsSync(MANIFEST_PATH)) {
    console.warn('  ⚠  No graph manifest. Run render_graphs.js first.\n');
}

let book = buildPreamble();

for (const { file, title } of config.chapters) {
    const fp = path.join(ROOT, file);
    if (!fs.existsSync(fp)) { console.warn(`  ⚠  Not found: ${file}`); continue; }
    const key = path.basename(file, '.html');
    console.log(`  📄  Converting: ${title} ...`);
    try {
        book += convertPage(fp, title, key);
        const gc = (graphManifest[key] || []).length;
        console.log(`      ✅  Done  (${gc} graph(s))`);
    } catch (err) {
        console.error(`      ❌  ${err.message}`);
    }
}

book += buildPostamble();
fs.writeFileSync(TEX_OUT, book, 'utf8');
console.log(`\n✅  LaTeX → ${TEX_OUT}`);
