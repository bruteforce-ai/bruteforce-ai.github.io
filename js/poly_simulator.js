document.addEventListener('DOMContentLoaded', () => {
    // Only continue if the simulator section is present
    const slider = document.getElementById('poly-degree-slider');
    if (!slider) return;

    const degreeLabel = document.getElementById('poly-degree-label');
    const plotFitDiv = document.getElementById('plot-fit');
    const plotErrorDiv = document.getElementById('plot-error');

    let simulationData = null;

    // Fetch the JSON data
    fetch('data/poly_regression.json')
        .then(response => response.json())
        .then(data => {
            simulationData = data;
            initPlots();
            updatePlots(parseInt(slider.value));
        })
        .catch(err => console.error("Error loading polynomial regression data:", err));

    function initPlots() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const textColor = isDark ? '#e2e8f0' : '#1e293b';
        const gridColor = isDark ? '#334155' : '#e2e8f0';

        // Base layout for Fit Plot
        const layoutFit = {
            title: { text: 'Polynomial Fit', font: { color: textColor, family: 'Inter, sans-serif' } },
            paper_bgcolor: 'transparent',
            plot_bgcolor: 'transparent',
            margin: { l: 40, r: 15, t: 40, b: 80 },
            xaxis: { title: 'X', color: textColor, gridcolor: gridColor, zerolinecolor: gridColor },
            yaxis: { title: 'Y', color: textColor, gridcolor: gridColor, zerolinecolor: gridColor },
            showlegend: true,
            legend: { font: { color: textColor }, orientation: 'h', x: 0.5, xanchor: 'center', y: -0.25 }
        };

        // Base layout for Error Plot
        const layoutError = {
            title: { text: 'Train vs Test Error', font: { color: textColor, family: 'Inter, sans-serif' } },
            paper_bgcolor: 'transparent',
            plot_bgcolor: 'transparent',
            margin: { l: 50, r: 15, t: 40, b: 80 },
            xaxis: { title: 'Polynomial Degree', color: textColor, gridcolor: gridColor, zerolinecolor: gridColor, dtick: 1 },
            yaxis: { title: 'Mean Squared Error', type: 'log', color: textColor, gridcolor: gridColor, zerolinecolor: gridColor },
            showlegend: true,
            legend: { font: { color: textColor }, orientation: 'h', x: 0.5, xanchor: 'center', y: -0.25 }
        };

        Plotly.newPlot(plotFitDiv, [], layoutFit, { responsive: true, displayModeBar: false });
        Plotly.newPlot(plotErrorDiv, [], layoutError, { responsive: true, displayModeBar: false });
    }

    function updatePlots(degree) {
        if (!simulationData) return;

        // Update UI Label
        degreeLabel.textContent = degree;

        // Get specific degree data
        const degreeData = simulationData.degrees.find(d => d.degree === degree);
        if (!degreeData) return;

        // --- Plot Fit ---
        const traceTrainPoint = {
            x: simulationData.train_x,
            y: simulationData.train_y,
            mode: 'markers',
            type: 'scatter',
            name: 'Train Data',
            marker: { color: '#ef4444', size: 8 }
        };

        const traceTestPoint = {
            x: simulationData.test_x,
            y: simulationData.test_y,
            mode: 'markers',
            type: 'scatter',
            name: 'Test Data',
            marker: { color: '#3b82f6', size: 8 }
        };

        const traceCurve = {
            x: simulationData.curve_x,
            y: degreeData.curve_y,
            mode: 'lines',
            type: 'scatter',
            name: `Degree ${degree} Fit`,
            line: { color: '#10b981', width: 3 }
        };

        const fitData = [traceTrainPoint, traceTestPoint, traceCurve];
        Plotly.react(plotFitDiv, fitData, plotFitDiv.layout);

        // --- Plot Error ---
        const degrees = simulationData.degrees.map(d => d.degree);
        const trainErrors = simulationData.degrees.map(d => d.train_err);
        const testErrors = simulationData.degrees.map(d => d.test_err);

        const traceTrainErr = {
            x: degrees,
            y: trainErrors,
            mode: 'lines+markers',
            type: 'scatter',
            name: 'Train Error',
            line: { color: '#ef4444', width: 2 }
        };

        const traceTestErr = {
            x: degrees,
            y: testErrors,
            mode: 'lines+markers',
            type: 'scatter',
            name: 'Test Error',
            line: { color: '#3b82f6', width: 2 }
        };

        const traceCurrentDegree = {
            x: [degree, degree],
            y: [Math.min(...trainErrors), Math.max(...testErrors)],
            mode: 'lines',
            type: 'scatter',
            name: 'Current Degree',
            line: { color: '#10b981', width: 2, dash: 'dash' },
            showlegend: false
        };

        const errorData = [traceTrainErr, traceTestErr, traceCurrentDegree];
        Plotly.react(plotErrorDiv, errorData, plotErrorDiv.layout);
    }

    // Slider listener
    slider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        updatePlots(val);
    });
});
