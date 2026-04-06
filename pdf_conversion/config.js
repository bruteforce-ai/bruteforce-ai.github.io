/**
 * config.js — PDF Book Configuration
 *
 * Edit this file to customise the generated PDF book.
 * Then run:  node pdf_conversion/capture_graphs.js
 *            node pdf_conversion/html_to_latex.js
 */

'use strict';

module.exports = {

    // ── Book Metadata ────────────────────────────────────────────────────────────
    title: 'Machine Learning',
    subtitle: 'A Companion to the brute.ai Curriculum',
    author: 'brute.ai',
    date: '\\today',   // LaTeX date string. E.g. 'April 2025' or '\\today'

    // ── Chapter List ─────────────────────────────────────────────────────────────
    // Change the order freely.
    // To exclude a chapter, remove or comment its entry.
    chapters: [
        { file: 'linear_regression.html', title: 'Linear Regression' },
        { file: 'gradient_descent.html', title: 'Gradient Descent' },
        { file: 'bias_variance.html', title: 'Bias, Variance, Overfitting \\& Regularisation' },
        { file: 'decision_tree.html', title: 'Decision Trees' },
        // { file: 'rnn.html', title: 'Recurrent Neural Networks' },
    ],

    // ── Page Layout ──────────────────────────────────────────────────────────────
    fontSize: '12pt',        // '10pt' | '11pt' | '12pt'
    paperSize: 'a4paper',     // 'a4paper' | 'letterpaper'
    margin: '2.5cm',       // passed to geometry package

    // ── Table of Contents ────────────────────────────────────────────────────────
    tableOfContents: true,

    // ── Footer ───────────────────────────────────────────────────────────────────
    // Set to null to disable. Supports LaTeX commands.
    footer: 'brute.ai',             // e.g. 'brute.ai · Machine Learning Notes'

    // ── References Section ───────────────────────────────────────────────────────
    // showReferences: true,
    // references: [
    //     'Sebastian Raschka --- STAT 479 Machine Learning Lecture Notes',
    //     'MLU Explain --- \\url{https://mlu-explain.github.io}',
    //     'Stanford CS229 Notes --- \\url{https://cs229.stanford.edu}',
    // ],

    // ── Graph Capture ────────────────────────────────────────────────────────────
    // Width of browser window used when screenshotting mini-graphs.
    graphCaptureWidth: 900,
    // Scale factor applied to graph screenshots in the PDF (0.0 – 1.0).
    graphImageScale: 0.75,

};
