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
        const minX = parseFloat(container.getAttribute('data-min') || '0');
        const maxX = parseFloat(container.getAttribute('data-max') || '1');
        const title = container.getAttribute('data-title') || '';
        const color = container.getAttribute('data-color') || 'var(--accent-primary)';
        const xTitle = container.getAttribute('data-x-title') || '';
        const yTitle = container.getAttribute('data-y-title') || '';
        const xTicksStr = container.getAttribute('data-x-ticks') || '';
        const yTicksStr = container.getAttribute('data-y-ticks') || '';
        const heightVal = container.getAttribute('data-height') || '300px';
        const widthVal = container.getAttribute('data-width') || '100%';
        const pointsStr = container.getAttribute('data-points') || '';
        const showResiduals = container.getAttribute('data-show-residuals') === 'true';

        // Setup Container
        container.classList.add('mini-graph-container');

        const titleHtml = title ? `<div class="mini-graph-title">${title}</div>` : '';
        const yTitleDiv = yTitle ? `<div style="grid-area: title-y; writing-mode: vertical-rl; transform: rotate(180deg); text-align: center; font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); display: flex; align-items: center; justify-content: center;">${yTitle}</div>` : '';
        const xTitleDiv = xTitle ? `<div style="grid-area: title-x; text-align: center; font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); padding-top: 5px;">${xTitle}</div>` : '';

        // CSS Grid Layout
        container.innerHTML = `
            ${titleHtml}
            <div style="display: grid; grid-template-areas: '${yTitle ? 'title-y' : ''} labels-y svg' '. . labels-x' '. . title-x'; grid-template-columns: ${yTitle ? 'auto' : '0px'} auto 1fr; grid-template-rows: ${heightVal} auto auto; width: ${widthVal}; max-width: 100%; gap: 0px 8px;">
                ${yTitleDiv}
                <div class="mini-graph-y-axis-labels" style="grid-area: labels-y; position: relative; width: 35px;"></div>
                <div class="mini-graph-svg-wrapper" style="grid-area: svg; position: relative; cursor: crosshair;">
                    <div class="mini-graph-tooltip"></div>
                    <svg class="mini-graph-svg" viewBox="0 0 400 200" preserveAspectRatio="none" style="width: 100%; height: 100%; overflow: visible; display: block;">
                        <defs>
                            <linearGradient id="graphGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" style="stop-color:var(--accent-primary);stop-opacity:1" />
                                <stop offset="100%" style="stop-color:var(--accent-secondary, #6366f1);stop-opacity:1" />
                            </linearGradient>
                        </defs>
                        <!-- Grid Lines -->
                        <line x1="0" y1="0" x2="0" y2="200" class="mini-graph-axis"/>
                        <line x1="0" y1="200" x2="400" y2="200" class="mini-graph-axis"/>
                        <line x1="0" y1="100" x2="400" y2="100" class="mini-graph-grid"/>
                        <line x1="200" y1="0" x2="200" y2="200" class="mini-graph-grid"/>
                        
                        <g class="mini-graph-residuals"></g>
                        <path class="mini-graph-path" d=""></path>
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
        const hoverPoint = container.querySelector('.mini-graph-hover-point');
        const dataPointsGroup = container.querySelector('.mini-graph-data-points');
        const residualsGroup = container.querySelector('.mini-graph-residuals');
        const tooltip = container.querySelector('.mini-graph-tooltip');
        const wrapper = container.querySelector('.mini-graph-svg-wrapper');
        const xAxisLabels = container.querySelector('.mini-graph-x-axis-labels');
        const yAxisLabels = container.querySelector('.mini-graph-y-axis-labels');

        // Parse explicit points
        let scatteredPoints = [];
        if (pointsStr) {
            scatteredPoints = pointsStr.split(';').map(p => {
                const parts = p.trim().split(',').map(n => parseFloat(n));
                return { x: parts[0], y: parts[1] };
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

        const curvePoints = [];
        const steps = 100;
        let minY = Infinity, maxY = -Infinity;

        // Collect Y-range from scattered points
        scatteredPoints.forEach(p => {
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

        // Draw Residuals and Scattered Points
        scatteredPoints.forEach(p => {
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
            }

            const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            c.setAttribute("cx", px);
            c.setAttribute("cy", py);
            c.setAttribute("r", "4");
            c.classList.add("mini-graph-point");
            dataPointsGroup.appendChild(c);
        });

        // Interaction
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
    });
}

