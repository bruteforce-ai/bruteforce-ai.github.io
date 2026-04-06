# PDF Book Generator — brute.ai

Converts the brute.ai HTML curriculum pages into a styled LaTeX PDF book.

---

## First-Time Setup

```powershell
cd pdf_conversion
npm install
```

---

## Generate the PDF

**Full pipeline** (graphs included):

```powershell
# Step 1 — render all mini-graphs to PNG (no browser needed)
node pdf_conversion/render_graphs.js

# Step 2 — convert HTML → LaTeX (embeds graph PNGs)
node pdf_conversion/html_to_latex.js

# Step 3 — compile LaTeX → PDF (run twice for correct TOC)
cd pdf_conversion
& "C:\Users\Tathagata\AppData\Local\Programs\MiKTeX\miktex\bin\x64\pdflatex.exe" -interaction=nonstopmode machine_learning_book.tex
& "C:\Users\Tathagata\AppData\Local\Programs\MiKTeX\miktex\bin\x64\pdflatex.exe" -interaction=nonstopmode machine_learning_book.tex

# Step 4 — copy final PDF to repo root
Copy-Item machine_learning_book.pdf -Destination ..\machine_learning_book.pdf -Force
```

**Quick rebuild** (text only changed, no graph updates):

```powershell
node pdf_conversion/html_to_latex.js
cd pdf_conversion
& "C:\Users\Tathagata\AppData\Local\Programs\MiKTeX\miktex\bin\x64\pdflatex.exe" -interaction=nonstopmode machine_learning_book.tex
& "C:\Users\Tathagata\AppData\Local\Programs\MiKTeX\miktex\bin\x64\pdflatex.exe" -interaction=nonstopmode machine_learning_book.tex
Copy-Item machine_learning_book.pdf -Destination ..\machine_learning_book.pdf -Force
```

---

## Configuration

Edit **`pdf_conversion/config.js`** to customise:

| Option | Description |
|---|---|
| `title` / `subtitle` | Book title and subtitle |
| `author` | Author name on the cover |
| `date` | Date string (`'\\today'` or e.g. `'April 2025'`) |
| `chapters` | List of HTML files in chapter order — remove entries to exclude |
| `fontSize` | `'10pt'`, `'11pt'`, or `'12pt'` |
| `paperSize` | `'a4paper'` or `'letterpaper'` |
| `margin` | Page margins (e.g. `'2.5cm'`, `'1in'`) |
| `footer` | Footer text, or `null` to disable |
| `tableOfContents` | `true` / `false` |
| `showReferences` | `true` / `false` |
| `references` | List of reference strings |
| `graphImageScale` | Scale of embedded graph screenshots (0.0–1.0) |

---

## Output Location

```
brute.ai/
  machine_learning_book.pdf       ← final PDF

  pdf_conversion/
    config.js                     ← edit this to customise
    capture_graphs.js             ← screenshots mini-graphs
    html_to_latex.js              ← HTML → LaTeX converter
    machine_learning_book.tex     ← generated LaTeX source
    images/
      *.png                       ← static images from HTML
      graphs/
        *.png                     ← mini-graph screenshots
    graphs_manifest.json          ← graph index (auto-generated)
    node_modules/
    package.json
```
