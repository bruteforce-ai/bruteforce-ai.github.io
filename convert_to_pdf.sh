#!/bin/bash

# set -e  # stop on error

WITH_GRAPH=false

# Parse arguments
for arg in "$@"; do
  if [ "$arg" == "--with-graph" ]; then
    WITH_GRAPH=true
  fi
done

# Step 1 — optional
if [ "$WITH_GRAPH" = true ]; then
  echo "Rendering graphs..."
  node pdf_conversion/render_graphs.js
fi

# Step 2 — HTML → LaTeX
echo "Converting HTML to LaTeX..."
node pdf_conversion/html_to_latex.js

# Step 3 — Compile LaTeX → PDF (run twice)
echo "Compiling LaTeX..."
echo "Before cd"
cd pdf_conversion || { echo "cd failed"; exit 1; }

"/c/Users/Tathagata/AppData/Local/Programs/MiKTeX/miktex/bin/x64/pdflatex.exe" -interaction=nonstopmode machine_learning_book.tex

"/c/Users/Tathagata/AppData/Local/Programs/MiKTeX/miktex/bin/x64/pdflatex.exe" -interaction=nonstopmode machine_learning_book.tex


# echo "Back to root"
# cd ..

# echo "Checking file..."
# ls pdf_conversion/

# Step 4 — Copy final PDF
echo "Copying PDF..."
cp machine_learning_book.pdf ../machine_learning_book.pdf

echo "Done ✅"