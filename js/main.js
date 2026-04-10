document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide Icons
    if (window.lucide) {
        window.lucide.createIcons();
    }

    // Math Rendering (KaTeX Auto-render)
    if (window.renderMathInElement) {
        renderMathInElement(document.body, {
            delimiters: [
                { left: '$$', right: '$$', display: true },
                { left: '$', right: '$', display: false },
                { left: '\\(', right: '\\)', display: false },
                { left: '\\[', right: '\\]', display: true }
            ],
            throwOnError: false
        });
    }

    // Code Highlighting (Prism.js)
    if (window.Prism) {
        Prism.highlightAll();
    }

    // Scroll progress bar (optional utility)
    const progressBar = document.createElement('div');
    progressBar.style.position = 'fixed';
    progressBar.style.top = '0';
    progressBar.style.left = '0';
    progressBar.style.height = '3px';
    progressBar.style.backgroundColor = 'var(--accent-primary)';
    progressBar.style.zIndex = '1001';
    progressBar.style.transition = 'width 0.1s';
    document.body.appendChild(progressBar);

    window.addEventListener('scroll', () => {
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        progressBar.style.width = scrolled + '%';
    });
    // Initialize Mermaid for flowcharts
    if (window.mermaid) {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        mermaid.initialize({
            startOnLoad: true,
            theme: isDark ? 'dark' : 'default',
            flowchart: { useMaxWidth: true, htmlLabels: true, curve: 'basis' },
            securityLevel: 'loose'
        });
    }

    // Load Footer
    const footerContainer = document.querySelector('footer.full-footer');
    if (footerContainer) {
        fetch('components/footer.html')
            .then(response => response.text())
            .then(data => {
                footerContainer.innerHTML = data;
                // Re-initialize icons in case there are any in the footer
                if (window.lucide) {
                    lucide.createIcons();
                }
            })
            .catch(error => console.error('Error loading footer:', error));
    }

    // Real-time Search Logic
    const searchInput = document.querySelector('#topic-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const items = document.querySelectorAll('.topic-item');
            const categories = document.querySelectorAll('.category-section');

            items.forEach(item => {
                const text = item.textContent.toLowerCase();
                if (text.includes(term)) {
                    item.style.display = 'flex';
                } else {
                    item.style.display = 'none';
                }
            });

            // Hide category if no visible items
            categories.forEach(cat => {
                const visibleItems = cat.querySelectorAll('.topic-item[style="display: flex;"]');
                cat.style.display = visibleItems.length > 0 ? 'block' : 'none';
            });
        });
    }

    // Auto-generate Table of Contents
    const tocContainer = document.querySelector('.table-of-contents');
    if (tocContainer) {
        const headings = document.querySelectorAll('main.container section h2, main.container section h3');
        if (headings.length > 0) {
            let tocHTML = '<ul>';
            headings.forEach((heading, index) => {
                let id = heading.id;
                if (!id) {
                    id = heading.textContent.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                    if (document.getElementById(id)) { id += `-${index}`; }
                    heading.id = id;
                }

                const level = heading.tagName.toLowerCase();
                const className = level === 'h3' ? 'toc-sub-item' : 'toc-item';

                // Avoid capturing visually hidden tags like '.highlight' elements inside headings by using clean text 
                // but for simplicity textContent is usually fine:
                let cleanText = heading.textContent.trim();

                tocHTML += `<li class="${className}"><a href="#${id}">${cleanText}</a></li>`;
            });
            tocHTML += '</ul>';

            tocContainer.innerHTML = `
                <div class="toc-header">
                    <i data-lucide="list"></i>
                    <strong>Table of Contents</strong>
                    <i data-lucide="chevron-down" class="toc-toggle-icon" style="margin-left: auto; transition: transform 0.2s;"></i>
                </div>
                <div class="toc-content">
                    ${tocHTML}
                </div>
            `;

            if (window.lucide) {
                window.lucide.createIcons();
            }

            const tocHeader = tocContainer.querySelector('.toc-header');
            const tocContent = tocContainer.querySelector('.toc-content');
            const tocIcon = tocContainer.querySelector('.toc-toggle-icon');

            const toggleTOC = () => {
                const isCollapsed = tocContainer.classList.contains('toc-collapsed');
                if (isCollapsed) {
                    tocContent.style.display = 'block';
                    tocIcon.style.transform = 'rotate(0deg)';
                    tocContainer.classList.remove('toc-collapsed');
                } else {
                    tocContent.style.display = 'none';
                    tocIcon.style.transform = 'rotate(-90deg)';
                    tocContainer.classList.add('toc-collapsed');
                }
            };

            tocHeader.addEventListener('click', toggleTOC);

            // Collapse by default on mobile
            if (window.innerWidth <= 768) {
                toggleTOC(); // It starts expanded, this immediately closes it on mobile load
            }
        } else {
            tocContainer.style.display = 'none';
        }
    }

    // Initialize Mini Graphs
    initMiniGraphs();
});

function initMiniGraphs() {
    const graphs = document.querySelectorAll('.mini-graph');
    graphs.forEach(container => {
        const funcStr = container.getAttribute('data-function');
        const funcStr2 = container.getAttribute('data-function-2');
        const funcStr3 = container.getAttribute('data-function-3');
        const minX = parseFloat(container.getAttribute('data-min') || '0');
        const maxX = parseFloat(container.getAttribute('data-max') || '1');
        const title = container.getAttribute('data-title') || '';
        const color = container.getAttribute('data-color') || 'var(--accent-primary)';
        const color2 = container.getAttribute('data-color-2') || 'var(--accent-secondary)';
        const color3 = container.getAttribute('data-color-3') || 'var(--accent-tertiary, #f59e0b)';
        const legend = container.getAttribute('data-legend') || '';
        const legend2 = container.getAttribute('data-legend-2') || '';
        const legend3 = container.getAttribute('data-legend-3') || '';
        const xTitle = container.getAttribute('data-x-title') || '';
        const yTitle = container.getAttribute('data-y-title') || '';
        const xTicksStr = container.getAttribute('data-x-ticks') || '';
        const yTicksStr = container.getAttribute('data-y-ticks') || '';
        const heightVal = container.getAttribute('data-height') || '300px';
        const widthVal = container.getAttribute('data-width') || '100%';
        const pointsStr = container.getAttribute('data-points') || '';
        const testPointsStr = container.getAttribute('data-test-points') || '';
        const vectorsStr = container.getAttribute('data-vectors') || '';
        const dottedLinesStr = container.getAttribute('data-dotted-lines') || '';
        const showResiduals = container.getAttribute('data-show-residuals') === 'true';
        const showResidualLabels = container.getAttribute('data-residual-labels') === 'true';
        const showHoverTooltip = container.getAttribute('data-hover-tooltip') !== 'false';

        // Setup Container
        container.classList.add('mini-graph-container');

        let legendHtml = '';
        if (legend || legend2 || legend3) {
            legendHtml = `<div class="mini-graph-legend" style="position: absolute; top: 10px; right: 10px; background: var(--bg-primary, rgba(255,255,255,0.8)); border: 1px solid var(--border-color, #e5e7eb); padding: 5px 10px; border-radius: 5px; font-size: 0.75rem; pointer-events: none; z-index: 10; display: flex; flex-direction: column; gap: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">`;
            if (legend) {
                legendHtml += `<div style="display: flex; align-items: center; gap: 6px;"><span style="width: 12px; height: 3px; background-color: ${color}; border-radius: 2px;"></span> <span style="color: var(--text-secondary)">${legend}</span></div>`;
            }
            if (legend2) {
                legendHtml += `<div style="display: flex; align-items: center; gap: 6px;"><span style="width: 12px; height: 3px; background-color: ${color2}; border-radius: 2px;"></span> <span style="color: var(--text-secondary)">${legend2}</span></div>`;
            }
            if (legend3) {
                legendHtml += `<div style="display: flex; align-items: center; gap: 6px;"><span style="width: 12px; height: 3px; background-color: ${color3}; border-radius: 2px;"></span> <span style="color: var(--text-secondary)">${legend3}</span></div>`;
            }
            legendHtml += `</div>`;
        }

        const titleHtml = title ? `<div class="mini-graph-title">${title}</div>` : '';
        const yTitleDiv = yTitle ? `<div style="grid-area: title-y; writing-mode: vertical-rl; transform: rotate(180deg); text-align: center; font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); display: flex; align-items: center; justify-content: center;">${yTitle}</div>` : '';
        const xTitleDiv = xTitle ? `<div style="grid-area: title-x; text-align: center; font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); padding-top: 5px;">${xTitle}</div>` : '';

        // CSS Grid Layout
        container.innerHTML = `
            ${titleHtml}
            <div style="display: grid; grid-template-areas: '${yTitle ? 'title-y' : ''} labels-y svg' '. . labels-x' '. . title-x'; grid-template-columns: ${yTitle ? 'auto' : '0px'} auto 1fr; grid-template-rows: ${heightVal} auto auto; width: ${widthVal}; max-width: 100%; gap: 0px 8px;">
                ${yTitleDiv}
                <div class="mini-graph-y-axis-labels" style="grid-area: labels-y; position: relative; width: 35px;"></div>
                <div class="mini-graph-svg-wrapper" style="grid-area: svg; position: relative; cursor: ${showHoverTooltip ? 'crosshair' : 'default'};">
                    ${legendHtml}
                    <div class="mini-graph-tooltip"></div>
                    <svg class="mini-graph-svg" viewBox="0 0 400 200" preserveAspectRatio="none" style="width: 100%; height: 100%; overflow: visible; display: block;">
                        <defs>
                            <linearGradient id="graphGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" style="stop-color:var(--accent-primary);stop-opacity:1" />
                                <stop offset="100%" style="stop-color:var(--accent-secondary, #6366f1);stop-opacity:1" />
                            </linearGradient>
                            <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                                <path d="M 0 0 L 6 3 L 0 6 z" fill="var(--accent-primary)" />
                            </marker>
                        </defs>
                        <!-- Grid Lines -->
                        <line x1="0" y1="0" x2="0" y2="200" class="mini-graph-axis"/>
                        <line x1="0" y1="200" x2="400" y2="200" class="mini-graph-axis"/>
                        <line x1="0" y1="100" x2="400" y2="100" class="mini-graph-grid"/>
                        <line x1="200" y1="0" x2="200" y2="200" class="mini-graph-grid"/>
                        
                        <g class="mini-graph-dotted-lines"></g>
                        <g class="mini-graph-residuals"></g>
                        <path class="mini-graph-path" d=""></path>
                        <path class="mini-graph-path-2" d="" style="fill: none; stroke: var(--accent-secondary); stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));"></path>
                        <path class="mini-graph-path-3" d="" style="fill: none; stroke: var(--accent-tertiary, #f59e0b); stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));"></path>
                        <g class="mini-graph-vectors"></g>
                        <g class="mini-graph-data-points"></g>
                        <circle class="mini-graph-hover-point" r="5" style="display:none;"></circle>
                    </svg>
                </div>
                <div class="mini-graph-x-axis-labels" style="grid-area: labels-x; position: relative; height: 20px;"></div>
                ${xTitleDiv}
            </div>
        `;

        const svg = container.querySelector('.mini-graph-svg');
        const path = container.querySelector('.mini-graph-path');
        const path2 = container.querySelector('.mini-graph-path-2');
        const path3 = container.querySelector('.mini-graph-path-3');
        const hoverPoint = container.querySelector('.mini-graph-hover-point');
        const dataPointsGroup = container.querySelector('.mini-graph-data-points');
        const residualsGroup = container.querySelector('.mini-graph-residuals');
        const dottedLinesGroup = container.querySelector('.mini-graph-dotted-lines');
        const vectorsGroup = container.querySelector('.mini-graph-vectors');
        const tooltip = container.querySelector('.mini-graph-tooltip');
        const wrapper = container.querySelector('.mini-graph-svg-wrapper');
        const xAxisLabels = container.querySelector('.mini-graph-x-axis-labels');
        const yAxisLabels = container.querySelector('.mini-graph-y-axis-labels');

        // Parse explicit points
        let scatteredPoints = [];
        if (pointsStr) {
            scatteredPoints = pointsStr.split(';').map(p => {
                const parts = p.trim().split(',');
                return { x: parseFloat(parts[0]), y: parseFloat(parts[1]), label: parts.length > 2 ? parts.slice(2).join(',').trim() : null };
            }).filter(p => !isNaN(p.x) && !isNaN(p.y));
        }

        let scatteredTestPoints = [];
        if (testPointsStr) {
            scatteredTestPoints = testPointsStr.split(';').map(p => {
                const parts = p.trim().split(',');
                return { x: parseFloat(parts[0]), y: parseFloat(parts[1]), label: parts.length > 2 ? parts.slice(2).join(',').trim() : null };
            }).filter(p => !isNaN(p.x) && !isNaN(p.y));
        }

        // Evaluate Function
        let f = null;
        if (funcStr) {
            try {
                if (funcStr.includes('=>') || funcStr.trim().startsWith('function')) {
                    f = new Function(`return (${funcStr})`)();
                } else {
                    f = new Function('x', `return ${funcStr}`);
                }
            } catch (e) {
                console.error("Error parsing function:", e);
            }
        }

        let f2 = null;
        if (funcStr2) {
            try {
                if (funcStr2.includes('=>') || funcStr2.trim().startsWith('function')) {
                    f2 = new Function(`return (${funcStr2})`)();
                } else {
                    f2 = new Function('x', `return ${funcStr2}`);
                }
            } catch (e) {
                console.error("Error parsing function 2:", e);
            }
        }

        let f3 = null;
        if (funcStr3) {
            try {
                if (funcStr3.includes('=>') || funcStr3.trim().startsWith('function')) {
                    f3 = new Function(`return (${funcStr3})`)();
                } else {
                    f3 = new Function('x', `return ${funcStr3}`);
                }
            } catch (e) {
                console.error("Error parsing function 3:", e);
            }
        }

        const curvePoints = [];
        const curvePoints2 = [];
        const curvePoints3 = [];
        const steps = 100;
        let minY = Infinity, maxY = -Infinity;

        // Collect Y-range from scattered points
        scatteredPoints.forEach(p => {
            minY = Math.min(minY, p.y);
            maxY = Math.max(maxY, p.y);
        });
        scatteredTestPoints.forEach(p => {
            minY = Math.min(minY, p.y);
            maxY = Math.max(maxY, p.y);
        });

        if (f) {
            for (let i = 0; i <= steps; i++) {
                const x = minX + (i / steps) * (maxX - minX);
                try {
                    const y = f(x);
                    if (!isNaN(y) && isFinite(y)) {
                        curvePoints.push({ x, y });
                        minY = Math.min(minY, y);
                        maxY = Math.max(maxY, y);
                    }
                } catch (e) { }
            }
        }

        if (f2) {
            for (let i = 0; i <= steps; i++) {
                const x = minX + (i / steps) * (maxX - minX);
                try {
                    const y = f2(x);
                    if (!isNaN(y) && isFinite(y)) {
                        curvePoints2.push({ x, y });
                        minY = Math.min(minY, y);
                        maxY = Math.max(maxY, y);
                    }
                } catch (e) { }
            }
        }

        if (f3) {
            for (let i = 0; i <= steps; i++) {
                const x = minX + (i / steps) * (maxX - minX);
                try {
                    const y = f3(x);
                    if (!isNaN(y) && isFinite(y)) {
                        curvePoints3.push({ x, y });
                        minY = Math.min(minY, y);
                        maxY = Math.max(maxY, y);
                    }
                } catch (e) { }
            }
        }

        if (minY === Infinity) { minY = 0; maxY = 1; }

        // Add padding
        const rangeY = maxY - minY;
        const padY = rangeY === 0 ? 1 : rangeY * 0.15;
        const drawMinY = minY - padY;
        const drawMaxY = maxY + padY;

        // Scaling Helpers
        const scaleX = (val) => ((val - minX) / (maxX - minX)) * 400;
        const scaleY = (val) => 200 - ((val - drawMinY) / (drawMaxY - drawMinY)) * 200;

        // Render Ticks
        const drawTicks = (labels, ticksStr, isX) => {
            if (ticksStr === 'none') {
                labels.innerHTML = '';
                return;
            }
            let ticks = [];
            if (ticksStr) {
                ticks = ticksStr.split(',').map(n => parseFloat(n.trim()));
            } else {
                const min = isX ? minX : minY;
                const max = isX ? maxX : maxY;
                ticks = [min, (min + max) / 2, max];
            }
            let html = '';
            ticks.forEach(val => {
                const min = isX ? minX : drawMinY;
                const max = isX ? maxX : drawMaxY;
                const pct = ((val - min) / (max - min)) * 100;
                if (pct >= 0 && pct <= 100) {
                    const style = isX ? `left: ${pct}%;` : `bottom: ${pct}%;`;
                    const cls = isX ? 'mini-graph-tick-x' : 'mini-graph-tick-y';
                    html += `<div class="${cls}" style="${style}">${Number.isInteger(val) ? val : val.toFixed(1)}</div>`;
                }
            });
            labels.innerHTML = html;
        };

        drawTicks(xAxisLabels, xTicksStr, true);
        drawTicks(yAxisLabels, yTicksStr, false);

        // Draw Function Line
        if (f && curvePoints.length > 0) {
            let d = curvePoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(p.x)} ${scaleY(p.y)}`).join(' ');
            path.setAttribute('d', d);
            if (color) path.style.stroke = color;
        }

        if (f2 && curvePoints2.length > 0) {
            let d2 = curvePoints2.map((p, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(p.x)} ${scaleY(p.y)}`).join(' ');
            path2.setAttribute('d', d2);
            if (color2) path2.style.stroke = color2;
        }

        if (f3 && curvePoints3.length > 0) {
            let d3 = curvePoints3.map((p, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(p.x)} ${scaleY(p.y)}`).join(' ');
            path3.setAttribute('d', d3);
            if (color3) path3.style.stroke = color3;
        }

        // Draw Residuals and Scattered Points
        scatteredPoints.forEach((p, idx) => {
            const px = scaleX(p.x);
            const py = scaleY(p.y);

            if (f && showResiduals) {
                const lineY = scaleY(f(p.x));
                const resLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
                resLine.setAttribute("x1", px);
                resLine.setAttribute("y1", py);
                resLine.setAttribute("x2", px);
                resLine.setAttribute("y2", lineY);
                resLine.classList.add("mini-graph-residual-line");
                residualsGroup.appendChild(resLine);

                if (showResidualLabels) {
                    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
                    label.setAttribute("x", px + 5);
                    label.setAttribute("y", (py + lineY) / 2);
                    label.textContent = `e${idx + 1}`;
                    label.classList.add("mini-graph-residual-label");
                    residualsGroup.appendChild(label);
                }
            }

            const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            c.setAttribute("cx", px);
            c.setAttribute("cy", py);
            c.setAttribute("r", "4");
            c.classList.add("mini-graph-point");
            dataPointsGroup.appendChild(c);
            if (p.label) {
                const pLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
                pLabel.setAttribute("x", px + 6);
                pLabel.setAttribute("y", py - 6);
                pLabel.textContent = p.label;
                pLabel.classList.add("mini-graph-point-label");
                dataPointsGroup.appendChild(pLabel);
            }
        });

        scatteredTestPoints.forEach((p, idx) => {
            const px = scaleX(p.x);
            const py = scaleY(p.y);

            const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            c.setAttribute("cx", px);
            c.setAttribute("cy", py);
            c.setAttribute("r", "5");
            c.setAttribute("fill", "var(--accent-tertiary, #f59e0b)");
            c.classList.add("mini-graph-test-point");
            dataPointsGroup.appendChild(c);
            if (p.label) {
                const pLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
                pLabel.setAttribute("x", px + 6);
                pLabel.setAttribute("y", py - 6);
                pLabel.textContent = p.label;
                pLabel.classList.add("mini-graph-point-label");
                dataPointsGroup.appendChild(pLabel);
            }
        });

        // Draw Dotted Lines
        if (dottedLinesStr) {
            dottedLinesStr.split(';').forEach(dl => {
                const pts = dl.trim().split(',').map(n => parseFloat(n.trim()));
                if (pts.length >= 4) {
                    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
                    line.setAttribute("x1", scaleX(pts[0]));
                    line.setAttribute("y1", scaleY(pts[1]));
                    line.setAttribute("x2", scaleX(pts[2]));
                    line.setAttribute("y2", scaleY(pts[3]));
                    line.classList.add("mini-graph-custom-dotted");
                    dottedLinesGroup.appendChild(line);
                }
            });
        }

        // Draw Vectors
        if (vectorsStr) {
            vectorsStr.split(';').forEach(v => {
                const parts = v.trim().split(',');
                if (parts.length >= 4) {
                    const x1 = parseFloat(parts[0]), y1 = parseFloat(parts[1]);
                    const x2 = parseFloat(parts[2]), y2 = parseFloat(parts[3]);
                    const labelText = parts[4] ? parts[4].trim() : '';

                    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
                    line.setAttribute("x1", scaleX(x1));
                    line.setAttribute("y1", scaleY(y1));
                    line.setAttribute("x2", scaleX(x2));
                    line.setAttribute("y2", scaleY(y2));
                    line.classList.add("mini-graph-vector-line");
                    line.setAttribute("marker-end", "url(#arrowhead)");
                    vectorsGroup.appendChild(line);

                    if (labelText) {
                        const lbl = document.createElementNS("http://www.w3.org/2000/svg", "text");
                        lbl.setAttribute("x", scaleX(x2) + 5);
                        lbl.setAttribute("y", scaleY(y2) - 5);
                        lbl.textContent = labelText;
                        lbl.classList.add("mini-graph-vector-label");
                        vectorsGroup.appendChild(lbl);
                    }
                }
            });
        }

        // Interaction
        if (showHoverTooltip) {
            wrapper.addEventListener('mousemove', (e) => {
                const rect = wrapper.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const xVal = minX + (mouseX / rect.width) * (maxX - minX);

                let displayX, displayY;

                if (curvePoints.length > 0) {
                    // Find closest on curve
                    let closest = curvePoints[0];
                    let minDist = Math.abs(curvePoints[0].x - xVal);
                    curvePoints.forEach(p => {
                        const dist = Math.abs(p.x - xVal);
                        if (dist < minDist) { minDist = dist; closest = p; }
                    });
                    displayX = closest.x;
                    displayY = closest.y;
                } else if (scatteredPoints.length > 0) {
                    // Find closest scattered point
                    let closest = scatteredPoints[0];
                    let minDist = Math.abs(scatteredPoints[0].x - xVal);
                    scatteredPoints.forEach(p => {
                        const dist = Math.abs(p.x - xVal);
                        if (dist < minDist) { minDist = dist; closest = p; }
                    });
                    displayX = closest.x;
                    displayY = closest.y;
                } else return;

                const px = scaleX(displayX);
                const py = scaleY(displayY);

                hoverPoint.setAttribute('cx', px);
                hoverPoint.setAttribute('cy', py);
                hoverPoint.style.display = 'block';

                tooltip.style.opacity = '1';
                tooltip.style.left = `${(px / 400) * 100}%`;
                tooltip.style.top = `${(py / 200) * 100}%`;
                tooltip.innerHTML = `x: ${displayX.toFixed(2)}<br>y: ${displayY.toFixed(2)}`;
            });

            wrapper.addEventListener('mouseleave', () => {
                hoverPoint.style.display = 'none';
                tooltip.style.opacity = '0';
            });
        }
    });
}

// ─── Neural Network Diagram Engine ───────────────────────────────────────────
//
// Usage: <div class="neural-net"
//   data-layers="3,4,4,2"
//   data-layer-labels="Input,Hidden 1,Hidden 2,Output"
//   data-node-labels="0:0=$x_1$; 0:1=$x_2$; 0:2=$x_3$; 3:0=$\hat{y}_1$; 3:1=$\hat{y}_2$"
//   data-node-colors="3:0=#6366f1; 3:1=#6366f1"
//   data-edges="0:0-1:0=$w_{11}$; 0:0-1:1=$w_{12}$"
//   data-edge-colors="0:0-1:0=#f59e0b"
//   data-title="My Network"
//   data-height="320px"
// ></div>

function initNeuralNetDiagrams() {
    let _nnIdx = 0;
    document.querySelectorAll('.neural-net').forEach(container => {
        const _id = _nnIdx++;
        const layersStr = container.getAttribute('data-layers') || '3,4,2';
        const layerLabels = (container.getAttribute('data-layer-labels') || '').split(',').map(s => s.trim());
        const nodeLabels = parseKVList(container.getAttribute('data-node-labels') || '');   // "L:N=label"
        const nodeColors = parseKVList(container.getAttribute('data-node-colors') || '');   // "L:N=#hex"
        const edgesMeta = parseEdgeList(container.getAttribute('data-edges') || '');        // "L:N-L:N=label"
        const edgeColors = parseEdgeColorList(container.getAttribute('data-edge-colors') || ''); // "L:N-L:N=#hex"
        const title = container.getAttribute('data-title') || '';
        const heightPx = parseInt(container.getAttribute('data-height') || '320', 10);

        const layers = layersStr.split(',').map(n => parseInt(n.trim(), 10)).filter(n => !isNaN(n) && n > 0);
        if (layers.length === 0) return;

        // ── Layout constants ────────────────────────────────────────────────
        const W = 700, H = heightPx;
        const R = 18;                        // node radius
        const PAD_X = 60, PAD_TOP = 48, PAD_BOT = 36;

        const layerX = layers.map((_, li) =>
            PAD_X + li * ((W - 2 * PAD_X) / (layers.length - 1 || 1))
        );

        // Precompute node centres
        const nodePos = layers.map((count, li) => {
            const usable = H - PAD_TOP - PAD_BOT;
            const step = count > 1 ? usable / (count - 1) : 0;
            const startY = PAD_TOP + (count > 1 ? 0 : usable / 2);
            return Array.from({ length: count }, (_, ni) => ({
                x: layerX[li],
                y: startY + ni * step
            }));
        });

        // ── Build SVG markup ────────────────────────────────────────────────
        let edgeSVG = '';
        let nodeSVG = '';
        let labelSVG = ''; // foreignObject labels rendered last (on top)
        let axisLabelSVG = '';

        // ── Edges ───────────────────────────────────────────────────────────
        // Default: draw all connections between adjacent layers
        const defaultEdges = [];
        for (let li = 0; li < layers.length - 1; li++) {
            for (let ni = 0; ni < layers[li]; ni++) {
                for (let nj = 0; nj < layers[li + 1]; nj++) {
                    defaultEdges.push({ l1: li, n1: ni, l2: li + 1, n2: nj, label: '', color: '' });
                }
            }
        }

        // Merge custom edges (override default with label/color)
        const customEdgeMap = {};
        edgesMeta.forEach(e => { customEdgeMap[`${e.l1}:${e.n1}-${e.l2}:${e.n2}`] = e.label; });
        edgeColors.forEach(e => { customEdgeMap[`__col__${e.l1}:${e.n1}-${e.l2}:${e.n2}`] = e.color; });

        // If user specified edges, use only those; otherwise use all defaults
        const edgesToDraw = edgesMeta.length > 0
            ? edgesMeta
            : defaultEdges;

        edgesToDraw.forEach(e => {
            const { l1, n1, l2, n2 } = e;
            if (!nodePos[l1] || !nodePos[l1][n1] || !nodePos[l2] || !nodePos[l2][n2]) return;

            const p1 = nodePos[l1][n1];
            const p2 = nodePos[l2][n2];
            const key = `${l1}:${n1}-${l2}:${n2}`;
            const label = customEdgeMap[key] || e.label || '';
            const color = customEdgeMap[`__col__${key}`] || e.color || 'var(--nn-edge, rgba(148,163,184,0.35))';

            // midpoint for label
            const mx = (p1.x + p2.x) / 2;
            const my = (p1.y + p2.y) / 2;

            edgeSVG += `<line class="nn-edge" x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" stroke="${color}"/>`;

            if (label) {
                // Use foreignObject to support KaTeX
                edgeSVG += `<rect x="${mx - 18}" y="${my - 10}" width="36" height="20" rx="4"
                    fill="var(--bg-primary)" stroke="${color}" stroke-width="0.8" opacity="0.92"/>`;
                labelSVG += `<foreignObject x="${mx - 28}" y="${my - 12}" width="56" height="24" class="nn-edge-fo">
                    <div xmlns="http://www.w3.org/1999/xhtml" class="nn-edge-label" data-latex="${escapeAttr(label)}">${label}</div>
                </foreignObject>`;
            }
        });

        // ── Nodes ───────────────────────────────────────────────────────────
        nodePos.forEach((layer, li) => {
            layer.forEach((pos, ni) => {
                const key = `${li}:${ni}`;
                const color = nodeColors[key] || '';
                const label = nodeLabels[key] || '';

                const fill = color ? color : 'var(--bg-primary)';
                const stroke = color ? color : 'var(--nn-node-border, var(--accent-primary))';
                const glow = color ? `filter: drop-shadow(0 0 6px ${color}88);` : '';

                nodeSVG += `<circle class="nn-node" cx="${pos.x}" cy="${pos.y}" r="${R}"
                    fill="${fill}" stroke="${stroke}" style="${glow}"/>`;

                if (label) {
                    // foreignObject for KaTeX rendering inside node
                    const fw = R * 2 + 8, fh = R * 2 + 8;
                    const textColor = color ? '#fff' : 'var(--text-primary)';
                    labelSVG += `<foreignObject x="${pos.x - fw / 2}" y="${pos.y - fh / 2}" width="${fw}" height="${fh}" class="nn-node-fo">
                        <div xmlns="http://www.w3.org/1999/xhtml" class="nn-node-label" data-latex="${escapeAttr(label)}" style="color:${textColor}">${label}</div>
                    </foreignObject>`;
                }
            });
        });

        // ── Layer axis labels ───────────────────────────────────────────────
        // If the label contains $...$ math, use a foreignObject so KaTeX can render it.
        // Otherwise fall back to a plain SVG <text> element.
        layers.forEach((_, li) => {
            const lbl = layerLabels[li] || '';
            if (!lbl) return;
            const hasMath = /\$[^$]+\$/.test(lbl);
            if (hasMath) {
                // foreignObject centred below the layer column
                const foW = 80, foH = 22;
                axisLabelSVG += `<foreignObject x="${layerX[li] - foW / 2}" y="${H - foH - 2}" width="${foW}" height="${foH}" class="nn-layer-fo">
                    <div xmlns="http://www.w3.org/1999/xhtml" class="nn-layer-label-math" data-latex="${escapeAttr(lbl)}">${lbl}</div>
                </foreignObject>`;
            } else {
                axisLabelSVG += `<text class="nn-layer-label" x="${layerX[li]}" y="${H - 6}" text-anchor="middle">${lbl}</text>`;
            }
        });

        // ── Assemble ────────────────────────────────────────────────────────
        const titleHTML = title ? `<div class="mini-graph-title">${title}</div>` : '';

        container.innerHTML = `
            ${titleHTML}
            <div class="nn-svg-wrap" style="height:${H}px;">
                <svg class="nn-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">
                    <defs>
                        <marker id="nn-arrow-${_id}" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
                            <path d="M0,0 L0,7 L7,3.5 z" fill="var(--accent-primary)"/>
                        </marker>
                    </defs>
                    <g class="nn-edges">${edgeSVG}</g>
                    <g class="nn-nodes">${nodeSVG}</g>
                    <g class="nn-axis-labels">${axisLabelSVG}</g>
                    <g class="nn-foreignobjects">${labelSVG}</g>
                </svg>
            </div>
        `;

        // ── Render LaTeX in labels via KaTeX ────────────────────────────────
        container.querySelectorAll('[data-latex]').forEach(el => {
            const src = el.getAttribute('data-latex');
            if (!src) return;
            // Try inline math first ($...$), else treat as raw string
            const mathMatch = src.match(/^\$(.+)\$$/s);
            if (mathMatch && window.katex) {
                try {
                    el.innerHTML = katex.renderToString(mathMatch[1], { throwOnError: false, displayMode: false });
                    return;
                } catch (_) { }
            }
            // fallback: plain text
            el.textContent = src;
        });
    });
}

// ─── Parsing helpers ──────────────────────────────────────────────────────────
// Parses "L:N=$label$; L:N=$label$" → { 'L:N': 'label' }
function parseKVList(str) {
    const map = {};
    if (!str.trim()) return map;
    str.split(';').forEach(entry => {
        const eqIdx = entry.indexOf('=');
        if (eqIdx === -1) return;
        const key = entry.slice(0, eqIdx).trim();
        const val = entry.slice(eqIdx + 1).trim();
        map[key] = val;
    });
    return map;
}

// Parses "L1:N1-L2:N2=$label$; ..." → [{ l1, n1, l2, n2, label }]
function parseEdgeList(str) {
    if (!str.trim()) return [];
    return str.split(';').map(entry => {
        const eqIdx = entry.indexOf('=');
        const coords = (eqIdx !== -1 ? entry.slice(0, eqIdx) : entry).trim();
        const label = eqIdx !== -1 ? entry.slice(eqIdx + 1).trim() : '';
        const [from, to] = coords.split('-');
        if (!from || !to) return null;
        const [l1, n1] = from.split(':').map(Number);
        const [l2, n2] = to.split(':').map(Number);
        if ([l1, n1, l2, n2].some(isNaN)) return null;
        return { l1, n1, l2, n2, label };
    }).filter(Boolean);
}

// Parses "L1:N1-L2:N2=#hex; ..." → [{ l1, n1, l2, n2, color }]
function parseEdgeColorList(str) {
    if (!str.trim()) return [];
    return str.split(';').map(entry => {
        const [coords, color] = entry.split('=');
        if (!coords || !color) return null;
        const [from, to] = coords.trim().split('-');
        if (!from || !to) return null;
        const [l1, n1] = from.split(':').map(Number);
        const [l2, n2] = to.split(':').map(Number);
        if ([l1, n1, l2, n2].some(isNaN)) return null;
        return { l1, n1, l2, n2, color: color.trim() };
    }).filter(Boolean);
}

function escapeAttr(str) {
    return str.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

document.addEventListener('DOMContentLoaded', () => {
    initNeuralNetDiagrams();
});

// ─── 3-D Convex Plot ─────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    const plotDiv = document.getElementById('convex-3d-plot');
    if (plotDiv) {
        const size = 50;
        const w = [], b = [], z = [];

        for (let i = 0; i < size; i++) {
            w.push(-20 + (40 * i / (size - 1)));
            b.push(-20 + (40 * i / (size - 1)));
        }

        for (let i = 0; i < size; i++) {
            const zRow = [];
            for (let j = 0; j < size; j++) {
                // J(w,b) = w^2 + b^2 (simplified bowl shape)
                zRow.push(w[i] ** 2 + b[j] ** 2);
            }
            z.push(zRow);
        }

        const data = [{
            z: z,
            x: b,
            y: w,
            type: 'surface',
            colorscale: 'Spectral',
            showscale: false
        }];

        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const textColor = isDark ? '#e2e8f0' : '#1e293b';
        const bgColor = isDark ? '#1e293b' : '#ffffff';

        const layout = {
            title: {
                text: 'Squared Error Cost J(w, b)',
                font: { color: textColor, family: 'Inter, sans-serif' }
            },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            margin: { l: 0, r: 0, b: 0, t: 40 },
            scene: {
                xaxis: { title: 'b', color: textColor },
                yaxis: { title: 'w', color: textColor },
                zaxis: { title: 'Cost(w, b)', color: textColor },
                camera: { eye: { x: 1.5, y: -1.5, z: 1.2 } }
            }
        };

        const config = { responsive: true, displayModeBar: false };

        Plotly.newPlot('convex-3d-plot', data, layout, config);
    }
});
