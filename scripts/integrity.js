async function initializeChart() {
    const chart = document.getElementById('donationBarChart');
    if (!chart) return;
    
    const buckets = [
        { id: 'xxs', count: 0, min: 0, max: 15.9999, labelRange: '$1-$15', types: {} },
        { id: 'xs', count: 0, min: 16, max: 35.9999, labelRange: '$16-$35', types: {} },
        { id: 's', count: 0, min: 36, max: 75.9999, labelRange: '$36-$75', types: {} },
        { id: 'm', count: 0, min: 76, max: 150.9999, labelRange: '$76-$150', types: {} },
        { id: 'l', count: 0, min: 151, max: 300.9999, labelRange: '$151-$300', types: {} },
        { id: 'xl', count: 0, min: 301, max: 500.9999, labelRange: '$301-$500', types: {} },
        { id: 'xxl', count: 0, min: 501, max: Infinity, labelRange: '$501+', types: {} }
    ];

    let donations = [];

    try {
        const apiUrl = 'https://api.brazoriacivicwatch.org/api/donations';
            
        const response = await fetch(apiUrl);
        if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data)) {
                donations = data;
            }
        }
    } catch (err) {}

    let validDonations = 0;

    donations.forEach(d => {
        const amt = parseFloat(d.amount);
        if (isNaN(amt)) return;
        
        for (const b of buckets) {
            if (amt >= b.min && amt <= b.max) {
                b.count++;
                const t = d.type || 'unknown';
                b.types[t] = (b.types[t] || 0) + 1;
                validDonations++; 
                break;
            }
        }
    });

    const total = validDonations;
    const maxCount = Math.max(...buckets.map(b => b.count));
    let maxTotal = Math.ceil(maxCount / 4) * 4;
    if (maxTotal === 0) maxTotal = 4;

    chart.innerHTML = ''; 
    let showByTotals = false;

    const controlsArea = document.createElement('div');
    controlsArea.className = 'chart-controls';
    controlsArea.innerHTML = `
        <label class="toggle-switch">
            <input type="checkbox" id="graphModeToggle">
            <span class="slider"></span>
        </label>
        <span class="toggle-label">show graph by totals</span>
    `;
    chart.appendChild(controlsArea);

    const graphContainer = document.createElement('div');
    graphContainer.className = 'graph-wrapper';
    chart.appendChild(graphContainer);

    const toggleInput = controlsArea.querySelector('#graphModeToggle');
    toggleInput.addEventListener('change', (e) => {
        showByTotals = e.target.checked;
        renderGraph();
    });

    function renderGraph() {
        graphContainer.innerHTML = '';

        const graphArea = document.createElement('div');
        graphArea.className = 'graph-area';

        const xAxisArea = document.createElement('div');
        xAxisArea.className = 'x-axis-area';

        let gridLines = [];
        if (showByTotals) {
            const step = maxTotal / 4;
            gridLines = [
                { percent: 25, label: `${step}` },
                { percent: 50, label: `${step * 2}` },
                { percent: 75, label: `${step * 3}` },
                { percent: 100, label: `${maxTotal}` }
            ];
        } else {
            gridLines = [
                { percent: 25, label: '25%' },
                { percent: 50, label: '50%' },
                { percent: 75, label: '75%' },
                { percent: 100, label: '100%' }
            ];
        }

        gridLines.forEach(lineData => {
            const line = document.createElement('div');
            line.className = 'y-axis-line';
            line.style.bottom = `${lineData.percent}%`;

            const lineLabel = document.createElement('span');
            lineLabel.className = 'y-axis-label';
            lineLabel.textContent = lineData.label;
            line.appendChild(lineLabel);

            graphArea.appendChild(line);
        });

        const zeroLabel = document.createElement('span');
        zeroLabel.className = 'y-axis-label zero-label';
        zeroLabel.textContent = showByTotals ? `0` : `0%`;
        graphArea.appendChild(zeroLabel);

        buckets.forEach(b => {
            let pct = 0;
            let displayMain = '';

            if (showByTotals) {
                pct = (b.count / maxTotal) * 100;
                displayMain = b.count;
            } else {
                pct = total === 0 ? 0 : Math.round((b.count / total) * 100);
                displayMain = `${pct}%`;
            }

            const col = document.createElement('div');
            col.className = 'bar-col';

            const track = document.createElement('div');
            track.className = 'bar-track';

            const bar = document.createElement('div');
            bar.className = 'bar';
            bar.style.height = `${pct}%`;

            const stats = document.createElement('div');
            stats.className = 'bar-stats';
            if (showByTotals) {
                stats.innerHTML = `${b.count}`;
            } else {
                stats.innerHTML = `${displayMain}<span>(${b.count})</span>`;
            }

            const tooltip = document.createElement('div');
            tooltip.className = 'bar-tooltip';

            let tooltipHTML = `<div class="tooltip-title">${b.id.toUpperCase()} TYPE BREAKDOWN</div>`;
            if (b.count === 0) {
                tooltipHTML += `<div class="tooltip-row empty">No donations in range</div>`;
            } else {
                for (const [type, typeCount] of Object.entries(b.types)) {
                    const typePct = Math.round((typeCount / b.count) * 100);
                    const typeName = type.charAt(0).toUpperCase() + type.slice(1);
                    tooltipHTML += `<div class="tooltip-row">
                        <span class="type-name">${typeName}</span>
                        <span class="type-stats">${typePct}% (${typeCount})</span>
                    </div>`;
                }
            }
            tooltip.innerHTML = tooltipHTML;

            bar.appendChild(tooltip);
            bar.appendChild(stats);
            track.appendChild(bar);
            col.appendChild(track);
            graphArea.appendChild(col);

            const labelWrapper = document.createElement('div');
            labelWrapper.className = 'bar-label-wrapper';

            const label = document.createElement('div');
            label.className = 'bar-label';
            label.innerHTML = `<span class="bar-range-text">${b.labelRange}</span> ${b.id}`;

            labelWrapper.appendChild(label);
            xAxisArea.appendChild(labelWrapper);
        });

        graphContainer.appendChild(graphArea);
        graphContainer.appendChild(xAxisArea);
    }

    renderGraph();

    const donorsSection = document.createElement('div');
    donorsSection.className = 'donors-section';
    donorsSection.style.marginTop = '80px';

    const donorsTitle = document.createElement('h2');
    donorsTitle.className = 'donation-chart-title';
    donorsTitle.textContent = 'Corporate and Political Donors';
    donorsSection.appendChild(donorsTitle);

    const searchWrapper = document.createElement('div');
    searchWrapper.className = 'donor-search-wrapper';
    
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.id = 'donorSearchInput';
    searchInput.placeholder = 'Search corporate & political donors...';
    searchWrapper.appendChild(searchInput);
    
    donorsSection.appendChild(searchWrapper);

    const cardsContainer = document.createElement('div');
    cardsContainer.className = 'donors-grid-layout';

    const nonIndividualDonations = donations.filter(d => {
        if (!d.type) return false;
        return d.type.toLowerCase() !== 'individual';
    });

    const renderCards = (searchTerm = '') => {
        cardsContainer.innerHTML = '';
        
        if (nonIndividualDonations.length === 0) {
            cardsContainer.innerHTML = '<p style="text-align: center; width: 100%; grid-column: 1 / -1; color: var(--black-text-color); font-weight: bold; font-size: 1.1rem; padding: 20px;">No corporate or political donors yet.</p>';
            return;
        }

        let renderedCount = 0;
        nonIndividualDonations.forEach(d => {
            const amtNum = parseFloat(d.amount);
            if (isNaN(amtNum)) return;
            const amtStr = `$${amtNum.toFixed(2)}`;
            const name = d.name || 'Unknown';
            const type = d.type || 'Unknown';
            
            const searchStr = `${name} ${type} ${amtStr}`.toLowerCase();
            if (searchTerm && !searchStr.includes(searchTerm.toLowerCase())) return;

            renderedCount++;
            const card = document.createElement('div');
            card.className = 'donor-card';
            
            card.innerHTML = `
                <h3 class="donor-title" style="font-size: 1.25rem;">${name}</h3>
                <div class="donor-info">
                    <p class="donor-detail" style="font-weight: 800; color: var(--primary-color);">Amount: ${amtStr}</p>
                    <p class="donor-detail" style="font-weight: 600;">Type: ${type}</p>
                </div>
            `;
            cardsContainer.appendChild(card);
        });

        if (renderedCount === 0) {
            cardsContainer.innerHTML = '<p style="text-align: center; width: 100%; grid-column: 1 / -1; color: var(--black-text-color); font-weight: bold; font-size: 1.1rem; padding: 20px;">No donors match your search.</p>';
        }
    };

    renderCards();
    
    searchInput.addEventListener('input', (e) => {
        renderCards(e.target.value);
    });

    donorsSection.appendChild(cardsContainer);

    const disclaimer = document.createElement('p');
    disclaimer.className = 'disclaimer-text';
    disclaimer.innerHTML = 'None of these donations were transactional; that is per the <i>Brazoria Civic Watch</i> bylaws, no action or justification was taken by the <i>Brazoria Civic Watch</i> for or in return for these donations. They are displayed for purposes of transparency and public scrutiny';
    disclaimer.style.fontSize = '0.9rem';
    disclaimer.style.textAlign = 'center';
    disclaimer.style.marginTop = '25px';
    donorsSection.appendChild(disclaimer);

    const chartContainer = chart.closest('.donation-chart-container');
    if (chartContainer) {
        chartContainer.parentNode.insertBefore(donorsSection, chartContainer.nextSibling);
    } else {
        chart.parentNode.insertBefore(donorsSection, chart.nextSibling);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeChart);
} else {
    initializeChart();
}