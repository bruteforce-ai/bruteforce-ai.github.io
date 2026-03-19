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
                        
                        <path class="mini-graph-path" d=""></path>
                        <circle class="mini-graph-point" r="5" style="display:none;"></circle>
                    </svg>
                </div>
                <div class="mini-graph-x-axis-labels" style="grid-area: labels-x; position: relative; height: 20px;"></div>
                ${xTitleDiv}
            </div>
        `;

        const svg = container.querySelector('.mini-graph-svg');
        const path = container.querySelector('.mini-graph-path');
        const point = container.querySelector('.mini-graph-point');
        const tooltip = container.querySelector('.mini-graph-tooltip');
        const wrapper = container.querySelector('.mini-graph-svg-wrapper');
        const xAxisLabels = container.querySelector('.mini-graph-x-axis-labels');
        const yAxisLabels = container.querySelector('.mini-graph-y-axis-labels');

        // Evaluate Function
        let f;
        try {
            if (funcStr.includes('=>') || funcStr.trim().startsWith('function')) {
                f = new Function(`return (${funcStr})`)();
            } else {
                f = new Function('x', `return ${funcStr}`);
            }
        } catch (e) {
            console.error("Error parsing function:", e);
            return;
        }

        const points = [];
        const steps = 100;
        let minY = Infinity, maxY = -Infinity;

        for (let i = 0; i <= steps; i++) {
            const x = minX + (i / steps) * (maxX - minX);
            try {
                const y = f(x);
                if (!isNaN(y) && isFinite(y)) {
                    points.push({ x, y });
                    minY = Math.min(minY, y);
                    maxY = Math.max(maxY, y);
                }
            } catch (e) { console.error("Math error:", e); }
        }

        // Add some padding to Y axis
        const rangeY = maxY - minY;
        const padY = rangeY === 0 ? 1 : rangeY * 0.1;
        const drawMinY = minY - padY;
        const drawMaxY = maxY + padY;

        // Draw X Ticks
        let xTicks = [];
        if (xTicksStr) {
            xTicks = xTicksStr.split(',').map(n => parseFloat(n.trim()));
        } else {
            xTicks = [minX, (minX + maxX) / 2, maxX];
        }
        let pxHtml = '';
        xTicks.forEach(val => {
            if (isNaN(val)) return;
            const pct = ((val - minX) / (maxX - minX)) * 100;
            if (pct >= 0 && pct <= 100) {
                pxHtml += `<div class="mini-graph-tick-x" style="left: ${pct}%;">${Number.isInteger(val) ? val : val.toFixed(2)}</div>`;
            }
        });
        xAxisLabels.innerHTML = pxHtml;

        // Draw Y Ticks
        let yTicks = [];
        if (yTicksStr) {
            yTicks = yTicksStr.split(',').map(n => parseFloat(n.trim()));
        } else {
            yTicks = [minY, (minY + maxY) / 2, maxY];
        }
        let pyHtml = '';
        yTicks.forEach(val => {
            if (isNaN(val)) return;
            const pct = ((val - drawMinY) / (drawMaxY - drawMinY)) * 100;
            if (pct >= 0 && pct <= 100) {
                pyHtml += `<div class="mini-graph-tick-y" style="bottom: ${pct}%;">${Number.isInteger(val) ? val : val.toFixed(2)}</div>`;
            }
        });
        yAxisLabels.innerHTML = pyHtml;

        // Create Path D string
        const scaleX = (val) => ((val - minX) / (maxX - minX)) * 400;
        const scaleY = (val) => 200 - ((val - drawMinY) / (drawMaxY - drawMinY)) * 200;

        let d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(p.x)} ${scaleY(p.y)}`).join(' ');
        path.setAttribute('d', d);
        if (color) path.style.stroke = color;

        // Interaction
        wrapper.addEventListener('mousemove', (e) => {
            const rect = wrapper.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const xPercent = mouseX / rect.width;
            const xVal = minX + xPercent * (maxX - minX);

            if (points.length === 0) return;
            // Find closest data point
            let closest = points[0];
            let minDist = Math.abs(points[0].x - xVal);
            points.forEach(p => {
                const dist = Math.abs(p.x - xVal);
                if (dist < minDist) {
                    minDist = dist;
                    closest = p;
                }
            });

            const px = scaleX(closest.x);
            const py = scaleY(closest.y);

            point.setAttribute('cx', px);
            point.setAttribute('cy', py);
            point.style.display = 'block';

            tooltip.style.opacity = '1';
            tooltip.style.left = `${(px / 400) * 100}%`;
            tooltip.style.top = `${(py / 200) * 100}%`;
            tooltip.innerHTML = `x: ${closest.x.toFixed(2)}<br>y: ${closest.y.toFixed(3)}`;
        });

        wrapper.addEventListener('mouseleave', () => {
            point.style.display = 'none';
            tooltip.style.opacity = '0';
        });
    });
}

