document.addEventListener('DOMContentLoaded', async () => {
    const buckets = [
        { id: 'xxs', count: 0, min: 1, max: 15.999, labelRange: '$1-$15', types: {} },
        { id: 'xs', count: 0, min: 16, max: 35.999, labelRange: '$16-$35', types: {} },
        { id: 's', count: 0, min: 36, max: 75.999, labelRange: '$36-$75', types: {} },
        { id: 'm', count: 0, min: 76, max: 150.999, labelRange: '$76-$150', types: {} },
        { id: 'l', count: 0, min: 151, max: 300.999, labelRange: '$151-$300', types: {} },
        { id: 'xl', count: 0, min: 301, max: 500.999, labelRange: '$301-$500', types: {} },
        { id: 'xxl', count: 0, min: 501, max: Infinity, labelRange: '$501+', types: {} }
    ];

    let donations = [];

    try {
        const apiUrl = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost' 
            ? 'http://localhost:3000/api/donations' 
            : '/api/donations';

        const response = await fetch(apiUrl);
        if (response.ok) {
            donations = await response.json();
        }
    } catch (err) {}

    donations.forEach(d => {
        const amt = d.amount;
        for (const b of buckets) {
            if (amt >= b.min && amt <= b.max) {
                b.count++;
                const t = d.type || 'unknown';
                b.types[t] = (b.types[t] || 0) + 1;
                break;
            }
        }
    });

    const total = donations.length;
    const chart = document.getElementById('donationBarChart');
    if (!chart) return;
    
    chart.innerHTML = '';

    const graphArea = document.createElement('div');
    graphArea.className = 'graph-area';

    const xAxisArea = document.createElement('div');
    xAxisArea.className = 'x-axis-area';

    const gridLines = [25, 50, 75, 100];
    gridLines.forEach(percent => {
        const line = document.createElement('div');
        line.className = 'y-axis-line';
        line.style.bottom = `${percent}%`;

        const lineLabel = document.createElement('span');
        lineLabel.className = 'y-axis-label';
        lineLabel.textContent = `${percent}%`;
        line.appendChild(lineLabel);

        graphArea.appendChild(line);
    });

    const zeroLabel = document.createElement('span');
    zeroLabel.className = 'y-axis-label zero-label';
    zeroLabel.textContent = `0%`;
    graphArea.appendChild(zeroLabel);

    buckets.forEach(b => {
        const pct = total === 0 ? 0 : Math.round((b.count / total) * 100);

        const col = document.createElement('div');
        col.className = 'bar-col';

        const track = document.createElement('div');
        track.className = 'bar-track';

        const bar = document.createElement('div');
        bar.className = 'bar';
        bar.style.height = `${pct}%`;

        const stats = document.createElement('div');
        stats.className = 'bar-stats';
        stats.innerHTML = `${pct}%<span>(${b.count})</span>`;

        const tooltip = document.createElement('div');
        tooltip.className = 'bar-tooltip';

        let tooltipHTML = `<div class="tooltip-title">${b.id.toUpperCase()} TYPE BREAKDOWN</div>`;
        if (b.count === 0) {
            tooltipHTML += `<div class="tooltip-row empty">No donations in this range</div>`;
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
        label.textContent = b.id;

        const range = document.createElement('div');
        range.className = 'bar-range';
        range.textContent = b.labelRange;

        labelWrapper.appendChild(label);
        labelWrapper.appendChild(range);
        xAxisArea.appendChild(labelWrapper);
    });

    chart.appendChild(graphArea);
    chart.appendChild(xAxisArea);
});