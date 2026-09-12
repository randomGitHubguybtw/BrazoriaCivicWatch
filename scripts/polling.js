let votesData = [];
let currentRace = "Which party do you generally support more?";
let sortedRaces = [];
let availableFilterOptions = {};
let seatsData = [];
let selectedFilters = {
    demoCategory: '',
    demoValue: '',
    districtCategory: '',
    districtValue: ''
};

const API_BASE = 'https://api.brazoriacivicwatch.org';

const staticQuestions = [
    "Would you vote down-ballot for any party?",
    "Which party do you generally support more?",
    "Which party do you generally align yourself with?",
    "Do you approve of Republicans in Brazoria County?",
    "Do you approve of Republicans in general?",
    "Do you approve of Democrats in general?",
    "Do you approve of Democrats in Brazoria County?",
    "How motivated are you to vote?"
];

const demoCategoriesMap = {
    'Race / Ethnicity': 'race_ethnicity',
    'Age Bracket': 'age_bracket',
    'Gender': 'gender',
    'Education': 'education',
    'LGBTQ+ Status': 'lgbtq_plus_status',
    'Party Identified': 'party_identified',
    'Household Income': 'household_income',
    'Employment Status': 'employment_status',
    'Religion': 'religion',
    'Marital Status': 'marital_status',
    'Veteran Status': 'veteran_status',
    'Primary Home Language': 'primary_home_language'
};

const distCategoriesMap = {
    'City': 'city_jurisdiction',
    'Independent School District': 'independent_school_district',
    'State Board of Education District': 'state_board_of_education_district',
    'Congressional District': 'congressional_district',
    'Commissioner / JP Precinct': 'precinct_jp_commissioner',
    'State Representative District': 'state_representative_district',
    'State Senate District': 'state_senate_district',
    'College District': 'college_district',
    'Drainage District': 'drainage_district',
    'Hospital District': 'hospital_district',
    'Municipal Utility District': 'municipal_utility_district',
    'Navigation District': 'navigation_district'
};

function getSeatPriority(seatName) {
    const name = (seatName || '').toLowerCase();
    if (name.includes('president')) return 10;
    if (name.includes('united states senator') || name.includes('u.s. senator')) return 11;
    if (name.includes('united states representative') || name.includes('u.s. representative') || name.includes('congress')) return 12;
    if (name === 'governor') return 20;
    if (name === 'lieutenant governor') return 21;
    if (name === 'attorney general') return 22;
    if (name.includes('comptroller of public accounts')) return 23;
    if (name.includes('commissioner of the general land office')) return 24;
    if (name.includes('commissioner of agriculture')) return 25;
    if (name.includes('railroad commissioner')) return 26;
    if (name.includes('chief justice, supreme court')) return 27;
    if (name.includes('justice, supreme court')) return 28;
    if (name.includes('presiding judge, court of criminal appeals')) return 29;
    if (name.includes('judge, court of criminal appeals')) return 30;
    if (name.includes('state board of education')) return 40;
    if (name.includes('state senator') || name.includes('state senate')) return 41;
    if (name.includes('state representative')) return 42;
    if (name.includes('chief justice') && name.includes('court of appeals')) return 43;
    if (name.includes('justice') && name.includes('court of appeals')) return 44;
    if (name.includes('district judge')) return 45;
    if (name.includes('district attorney')) return 46;
    if (name === 'county judge') return 50;
    if (name.includes('county court at law') || name.includes('probate court')) return 51;
    if (name === 'county attorney') return 52;
    if (name.includes('district clerk')) return 53;
    if (name === 'county clerk') return 54;
    if (name === 'sheriff') return 55;
    if (name.includes('tax assessor')) return 56;
    if (name.includes('county treasurer')) return 57;
    if (name.includes('county commissioner')) return 60;
    if (name.includes('justice of the peace')) return 61;
    if (name.includes('constable')) return 62;
    return 999;
}

document.addEventListener('DOMContentLoaded', initPolling);

async function initPolling() {
    try {
        const nextElectionRes = await fetch(`${API_BASE}/api/elections/next`);
        let nextElection;
        try { nextElection = await nextElectionRes.json(); } catch(e) {}
        
        let queryStr = '';
        if (nextElection && nextElection.election_id) {
            queryStr = `?election_cycle=${nextElection.election_id}`;
        }

        const [votesRes, seatsRes] = await Promise.all([
            fetch(`${API_BASE}/api/votes${queryStr}`),
            fetch(`${API_BASE}/api/seats`)
        ]);
        
        votesData = await votesRes.json();
        seatsData = await seatsRes.json();
        
        const uniqueRaces = [...new Set(votesData.map(v => v.race_slug))];
        
        if (uniqueRaces.length === 0) {
            document.getElementById('raceSearchInput').value = "No polling data available for this cycle yet.";
            document.getElementById('raceSearchInput').disabled = true;
            document.getElementById('pollingGraph').innerHTML = '<p style="color: #fcf6ee; text-align: center; margin-top: 30px;">No polling data found.</p>';
            return;
        }
        
        uniqueRaces.sort((a, b) => {
            const idxA = staticQuestions.indexOf(a);
            const idxB = staticQuestions.indexOf(b);
            if (idxA !== -1 && idxB !== -1) return idxA - idxB;
            if (idxA !== -1) return -1;
            if (idxB !== -1) return 1;
            const pA = getSeatPriority(a);
            const pB = getSeatPriority(b);
            if (pA !== pB) return pA - pB;
            return a.localeCompare(b);
        });
        
        sortedRaces = uniqueRaces;
        if (!sortedRaces.includes(currentRace)) {
            currentRace = sortedRaces[0];
        }
        
        extractFilterOptions();
        setupDropdown();
        setupFilterControls();
        initSVG();
        fetchFilteredVotes();
    } catch(e) {
        console.error('Error initializing polling data:', e);
        document.getElementById('pollingGraph').innerHTML = `<p style="color: #fcf6ee; text-align: center;">Error loading data. Please check connection to the API.</p>`;
    }
}

function extractFilterOptions() {
    availableFilterOptions = {};
    Object.values(demoCategoriesMap).forEach(col => availableFilterOptions[col] = new Set());
    Object.values(distCategoriesMap).forEach(col => availableFilterOptions[col] = new Set());

    votesData.forEach(v => {
        Object.keys(availableFilterOptions).forEach(key => {
            if (v[key]) availableFilterOptions[key].add(v[key]);
        });
    });

    Object.keys(availableFilterOptions).forEach(key => {
        availableFilterOptions[key] = [...availableFilterOptions[key]].sort();
    });
}

function setupFilterControls() {
    const demoCatInput = document.getElementById('demoCategorySearchInput');
    const demoCatList = document.getElementById('demoCategoryDropdownList');
    const demoWrapper = document.getElementById('demoValueDropdownWrapper');
    const demoInput = document.getElementById('demoValueSearchInput');
    const demoList = document.getElementById('demoValueDropdownList');

    const distCatInput = document.getElementById('districtCategorySearchInput');
    const distCatList = document.getElementById('districtCategoryDropdownList');
    const distWrapper = document.getElementById('districtValueDropdownWrapper');
    const distInput = document.getElementById('districtValueSearchInput');
    const distList = document.getElementById('districtValueDropdownList');

    const clearBtn = document.getElementById('clearFiltersBtn');

    const renderCatList = (inputVal, map, listEl, type) => {
        listEl.innerHTML = '';
        const q = inputVal.toLowerCase();
        const entries = Object.entries(map).filter(([label, val]) => label.toLowerCase().includes(q));

        entries.forEach(([label, val]) => {
            const div = document.createElement('div');
            div.className = 'dropdown-item';
            div.textContent = label;
            div.onmousedown = () => {
                if (type === 'demo') {
                    selectedFilters.demoCategory = val;
                    selectedFilters.demoValue = '';
                    demoCatInput.value = label;
                    demoInput.value = '';
                    demoWrapper.style.display = 'block';
                } else {
                    selectedFilters.districtCategory = val;
                    selectedFilters.districtValue = '';
                    distCatInput.value = label;
                    distInput.value = '';
                    distWrapper.style.display = 'block';
                }
                fetchFilteredVotes();
            };
            listEl.appendChild(div);
        });
    };

    demoCatInput.addEventListener('focus', () => {
        demoCatList.classList.add('show');
        demoCatInput.value = '';
        renderCatList('', demoCategoriesMap, demoCatList, 'demo');
    });
    demoCatInput.addEventListener('blur', () => {
        setTimeout(() => {
            demoCatList.classList.remove('show');
            const matchedLabel = Object.keys(demoCategoriesMap).find(key => demoCategoriesMap[key] === selectedFilters.demoCategory);
            demoCatInput.value = matchedLabel || '';
        }, 200);
    });
    demoCatInput.addEventListener('input', (e) => renderCatList(e.target.value, demoCategoriesMap, demoCatList, 'demo'));

    distCatInput.addEventListener('focus', () => {
        distCatList.classList.add('show');
        distCatInput.value = '';
        renderCatList('', distCategoriesMap, distCatList, 'district');
    });
    distCatInput.addEventListener('blur', () => {
        setTimeout(() => {
            distCatList.classList.remove('show');
            const matchedLabel = Object.keys(distCategoriesMap).find(key => distCategoriesMap[key] === selectedFilters.districtCategory);
            distCatInput.value = matchedLabel || '';
        }, 200);
    });
    distCatInput.addEventListener('input', (e) => renderCatList(e.target.value, distCategoriesMap, distCatList, 'district'));

    demoInput.addEventListener('focus', () => {
        demoList.classList.add('show');
        renderSubFilterList('demo', '');
    });
    demoInput.addEventListener('blur', () => {
        setTimeout(() => {
            demoList.classList.remove('show');
            demoInput.value = selectedFilters.demoValue;
        }, 200);
    });
    demoInput.addEventListener('input', (e) => renderSubFilterList('demo', e.target.value));

    distInput.addEventListener('focus', () => {
        distList.classList.add('show');
        renderSubFilterList('district', '');
    });
    distInput.addEventListener('blur', () => {
        setTimeout(() => {
            distList.classList.remove('show');
            distInput.value = selectedFilters.districtValue;
        }, 200);
    });
    distInput.addEventListener('input', (e) => renderSubFilterList('district', e.target.value));

    if(clearBtn) {
        clearBtn.addEventListener('click', () => {
            selectedFilters.demoCategory = '';
            selectedFilters.demoValue = '';
            selectedFilters.districtCategory = '';
            selectedFilters.districtValue = '';
            
            demoCatInput.value = '';
            demoInput.value = '';
            distCatInput.value = '';
            distInput.value = '';
            
            demoWrapper.style.display = 'none';
            distWrapper.style.display = 'none';
            
            fetchFilteredVotes();
        });
    }
}

function renderSubFilterList(type, query) {
    const cat = type === 'demo' ? selectedFilters.demoCategory : selectedFilters.districtCategory;
    const inputId = type === 'demo' ? 'demoValueSearchInput' : 'districtValueSearchInput';
    const listId = type === 'demo' ? 'demoValueDropdownList' : 'districtValueDropdownList';
    
    const list = document.getElementById(listId);
    list.innerHTML = '';
    
    if (!cat || !availableFilterOptions[cat]) return;
    
    const q = query.toLowerCase();
    const values = availableFilterOptions[cat].filter(v => v.toLowerCase().includes(q));
    
    const allDiv = document.createElement('div');
    allDiv.className = 'dropdown-item';
    allDiv.textContent = 'Clear Filter';
    allDiv.onmousedown = () => {
        if (type === 'demo') {
            selectedFilters.demoValue = '';
            document.getElementById('demoCategorySearchInput').value = '';
            selectedFilters.demoCategory = '';
            document.getElementById('demoValueDropdownWrapper').style.display = 'none';
        } else {
            selectedFilters.districtValue = '';
            document.getElementById('districtCategorySearchInput').value = '';
            selectedFilters.districtCategory = '';
            document.getElementById('districtValueDropdownWrapper').style.display = 'none';
        }
        document.getElementById(inputId).value = '';
        fetchFilteredVotes();
    };
    list.appendChild(allDiv);

    values.forEach(v => {
        const div = document.createElement('div');
        div.className = 'dropdown-item';
        div.textContent = v;
        div.onmousedown = () => {
            if (type === 'demo') selectedFilters.demoValue = v;
            else selectedFilters.districtValue = v;
            document.getElementById(inputId).value = v;
            fetchFilteredVotes();
        };
        list.appendChild(div);
    });
}

function updateShowingIndicator() {
    const ind = document.getElementById('showingIndicator');
    const clearBtn = document.getElementById('clearFiltersBtn');
    if (!ind) return;
    
    let demo = "All Voters";
    if (selectedFilters.demoValue) {
        demo = selectedFilters.demoValue;
    }
    
    let place = "Brazoria County";
    if (selectedFilters.districtValue) {
        place = selectedFilters.districtValue;
    } else {
        let seat = seatsData.find(s => s.seat_name === currentRace);
        if (seat && seat.scope === 'local' && seat.city && seat.city !== 'County') {
            let seatCity = seat.city;
            if (seatCity.includes('_')) {
                let parts = seatCity.split('_');
                if (parts[0] === 'City') place = parts[1];
                else if (parts[0] === 'Precinct') place = 'Precinct ' + parts[1];
                else place = parts[1] + ' ' + parts[0];
            } else {
                place = seatCity;
            }
        }
    }
    
    let targetText = `Showing: ${demo} in ${place}`;
    if (demo === "All Voters" && place === "Brazoria County") {
        targetText = `Showing: Brazoria County`;
    }
    
    if (ind.textContent !== targetText) {
        ind.style.opacity = '0';
        setTimeout(() => {
            ind.textContent = targetText;
            ind.style.opacity = '1';
        }, 300);
    }
    
    if (clearBtn) {
        if (selectedFilters.demoValue || selectedFilters.districtValue) {
            clearBtn.style.display = 'inline-block';
        } else {
            clearBtn.style.display = 'none';
        }
    }
}

async function fetchFilteredVotes() {
    try {
        let url = `${API_BASE}/api/votes?`;
        const params = new URLSearchParams();
        if (selectedFilters.demoCategory && selectedFilters.demoValue) {
            params.append('demo_cat', selectedFilters.demoCategory);
            params.append('demo_val', selectedFilters.demoValue);
        }
        if (selectedFilters.districtCategory && selectedFilters.districtValue) {
            params.append('dist_cat', selectedFilters.districtCategory);
            params.append('dist_val', selectedFilters.districtValue);
        }
        const res = await fetch(url + params.toString());
        votesData = await res.json();
        renderGraph();
    } catch (e) {
        console.error('Error fetching filtered votes:', e);
    }
}

function setupDropdown() {
    const input = document.getElementById('raceSearchInput');
    input.value = currentRace;
    renderDropdownList('');

    input.addEventListener('focus', () => {
        document.getElementById('raceDropdownList').classList.add('show');
        input.value = '';
        renderDropdownList('');
    });

    input.addEventListener('blur', () => {
        setTimeout(() => {
            document.getElementById('raceDropdownList').classList.remove('show');
            input.value = currentRace;
        }, 200);
    });

    input.addEventListener('input', (e) => {
        renderDropdownList(e.target.value);
    });

    document.getElementById('prevRaceBtn').addEventListener('click', () => cycleRace(-1));
    document.getElementById('nextRaceBtn').addEventListener('click', () => cycleRace(1));

    document.addEventListener('keydown', (e) => {
        if (document.activeElement === input || 
            document.activeElement.id === 'demoCategorySearchInput' || 
            document.activeElement.id === 'districtCategorySearchInput' ||
            document.activeElement.id === 'demoValueSearchInput' ||
            document.activeElement.id === 'districtValueSearchInput') return; 
        if (e.key === 'ArrowLeft') cycleRace(-1);
        if (e.key === 'ArrowRight') cycleRace(1);
    });
}

function renderDropdownList(query = '') {
    const list = document.getElementById('raceDropdownList');
    list.innerHTML = '';
    const q = query.toLowerCase();
    
    const filtered = sortedRaces.filter(r => r.toLowerCase().includes(q));
    
    if (filtered.length === 0) {
        const div = document.createElement('div');
        div.className = 'dropdown-item';
        div.textContent = 'No matches found';
        div.style.pointerEvents = 'none';
        div.style.color = 'rgba(255,255,255,0.5)';
        list.appendChild(div);
        return;
    }

    filtered.forEach(r => {
        const div = document.createElement('div');
        div.className = 'dropdown-item';
        if (r === currentRace) div.classList.add('selected');
        div.textContent = r;
        div.onmousedown = () => { 
            currentRace = r;
            document.getElementById('raceSearchInput').value = r;
            renderGraph();
        };
        list.appendChild(div);
    });
}

function cycleRace(dir) {
    if (!sortedRaces.length) return;
    let idx = sortedRaces.indexOf(currentRace);
    idx += dir;
    if (idx < 0) idx = sortedRaces.length - 1;
    if (idx >= sortedRaces.length) idx = 0;
    currentRace = sortedRaces[idx];
    document.getElementById('raceSearchInput').value = currentRace;
    
    const input = document.getElementById('raceSearchInput');
    if (document.activeElement === input) {
        input.blur();
    }
    
    renderGraph();
}

function getColorForCandidate(name) {
    const n = name.toLowerCase();
    if (n.includes('dem') || n.includes('democrat')) return '#5bc0de';
    if (n.includes('rep') || n.includes('republican') || n.includes('gop')) return '#d9534f';
    if (n.includes('grn') || n.includes('green')) return '#5cb85c';
    if (n.includes('lib') || n.includes('libertarian')) return '#f0ad4e';
    if (n.includes('unsure') || n.includes('don\'t know') || n.includes('dont know')) return '#999999';
    
    const grays = ['#777777', '#888888', '#aaaaaa', '#cccccc'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return grays[Math.abs(hash) % grays.length];
}

const svgNS = "http://www.w3.org/2000/svg";
let svg, gGrid, gRibbons, gLines, gHoverLines, gDots, gPills, gLabels, tooltip;

const width = 850;
const height = 480;
const padding = { top: 50, right: 80, bottom: 60, left: 70 };
const chartW = width - padding.left - padding.right;
const chartH = height - padding.top - padding.bottom;

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function initSVG() {
    const container = document.getElementById('pollingGraph');
    let existingEmptyState = document.getElementById('pollingEmptyState');
    
    let innerElements = '';
    if (existingEmptyState) {
        innerElements = existingEmptyState.outerHTML;
    }
    
    container.innerHTML = innerElements;
    tooltip = document.getElementById('pollingTooltip');
    
    svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.classList.add('svg-chart');
    
    gGrid = document.createElementNS(svgNS, 'g');
    
    const guideLine = document.createElementNS(svgNS, 'line');
    guideLine.id = 'hoverGuideLine';
    guideLine.setAttribute('stroke', '#c4a46a');
    guideLine.setAttribute('stroke-dasharray', '5, 5');
    guideLine.setAttribute('stroke-width', '2');
    guideLine.setAttribute('y2', padding.top + chartH);
    guideLine.style.opacity = '0';
    guideLine.style.transition = 'opacity 0.2s ease, x1 0.1s, x2 0.1s, y1 0.1s';
    guideLine.style.pointerEvents = 'none';
    gGrid.appendChild(guideLine);
    
    for (let i = 0; i <= 4; i++) {
        const pct = i * 25;
        const y = padding.top + chartH - (pct / 100) * chartH;
        
        const line = document.createElementNS(svgNS, 'line');
        line.setAttribute('x1', padding.left);
        line.setAttribute('x2', padding.left + chartW);
        line.setAttribute('y1', y);
        line.setAttribute('y2', y);
        line.classList.add('chart-grid');
        gGrid.appendChild(line);
        
        const text = document.createElementNS(svgNS, 'text');
        text.setAttribute('x', padding.left - 15);
        text.setAttribute('y', y);
        text.setAttribute('text-anchor', 'end');
        text.setAttribute('dominant-baseline', 'central');
        text.classList.add('chart-label');
        text.textContent = `${pct}%`;
        gGrid.appendChild(text);
    }
    
    const yAxis = document.createElementNS(svgNS, 'line');
    yAxis.setAttribute('x1', padding.left);
    yAxis.setAttribute('x2', padding.left);
    yAxis.setAttribute('y1', padding.top);
    yAxis.setAttribute('y2', padding.top + chartH);
    yAxis.classList.add('chart-axis');
    gGrid.appendChild(yAxis);
    
    const xAxis = document.createElementNS(svgNS, 'line');
    xAxis.setAttribute('x1', padding.left);
    xAxis.setAttribute('x2', padding.left + chartW);
    xAxis.setAttribute('y1', padding.top + chartH);
    xAxis.setAttribute('y2', padding.top + chartH);
    xAxis.classList.add('chart-axis');
    gGrid.appendChild(xAxis);
    
    svg.appendChild(gGrid);
    
    gRibbons = document.createElementNS(svgNS, 'g');
    svg.appendChild(gRibbons);
    
    gLines = document.createElementNS(svgNS, 'g');
    svg.appendChild(gLines);
    
    gHoverLines = document.createElementNS(svgNS, 'g');
    svg.appendChild(gHoverLines);
    
    gDots = document.createElementNS(svgNS, 'g');
    svg.appendChild(gDots);
    
    gPills = document.createElementNS(svgNS, 'g');
    svg.appendChild(gPills);
    
    gLabels = document.createElementNS(svgNS, 'g');
    svg.appendChild(gLabels);
    
    container.appendChild(svg);
}

let hoverTimeout = null;
let currentHoverCluster = null;

function clearAllHovers() {
    Array.from(gLines.children).forEach(l => l.classList.remove('hovered'));
    Array.from(gPills.children).forEach(p => p.classList.remove('hovered'));
    Array.from(gDots.children).forEach(dg => {
        dg.classList.remove('hovered');
        dg.style.transform = '';
    });
    Array.from(gHoverLines.children).forEach(l => l.style.transform = '');
    Array.from(gRibbons.children).forEach(r => r.classList.remove('hovered'));
    
    const guideLine = document.getElementById('hoverGuideLine');
    if (guideLine) guideLine.style.opacity = '0';
    if (tooltip) tooltip.classList.remove('visible');
}

function handleHoverInteraction(cand, pct, color, e, isHovering, monthStr, hoverType, moe, n) {
    let clusterKey = null;
    if (hoverType === 'dot') clusterKey = `dot-${e.currentTarget.dataset.idx}-${e.currentTarget.dataset.pct}`;
    else if (hoverType === 'line') clusterKey = `line-${e.currentTarget.getAttribute('d')}`;
    else clusterKey = `pill-${cand}`;

    if (isHovering) {
        if (hoverTimeout) {
            clearTimeout(hoverTimeout);
            hoverTimeout = null;
        }
        
        if (currentHoverCluster !== clusterKey) {
            clearAllHovers();
            currentHoverCluster = clusterKey;
        } else {
            Array.from(gLines.children).forEach(l => l.classList.remove('hovered'));
            Array.from(gPills.children).forEach(p => p.classList.remove('hovered'));
            Array.from(gDots.children).forEach(dg => dg.classList.remove('hovered'));
            Array.from(gRibbons.children).forEach(r => r.classList.remove('hovered'));
        }
        
        const line = Array.from(gLines.children).find(el => el.dataset.cand === cand && !el.dataset.leaving);
        const group = Array.from(gPills.children).find(el => el.dataset.cand === cand && !el.dataset.leaving);
        const dotGroups = Array.from(gDots.children).filter(el => el.dataset.cand === cand && !el.dataset.leaving);
        const ribbon = Array.from(gRibbons.children).find(el => el.dataset.cand === cand && !el.dataset.leaving);
        const guideLine = document.getElementById('hoverGuideLine');
        
        if (ribbon) { ribbon.classList.add('hovered'); ribbon.parentNode.appendChild(ribbon); }
        if (line) { line.classList.add('hovered'); line.parentNode.appendChild(line); }
        if (group) { group.classList.add('hovered'); group.parentNode.appendChild(group); }
        dotGroups.forEach(dg => { dg.classList.add('hovered'); dg.parentNode.appendChild(dg); });
        
        if (hoverType === 'dot') {
            const mIdx = e.currentTarget.dataset.idx;
            const mPct = e.currentTarget.dataset.pct;
            
            if (parseInt(mIdx) < 2) {
                const sameDots = Array.from(gDots.children).filter(d => d.dataset.idx === mIdx && d.dataset.pct === mPct && !d.dataset.leaving);
                sameDots.sort((a, b) => a.dataset.cand.localeCompare(b.dataset.cand));
                
                sameDots.forEach((d, idx) => {
                    const shiftY = -(idx * 24); 
                    d.style.transform = `translateY(${shiftY}px)`;
                    if (d.dataset.cand === cand) {
                        d.parentNode.appendChild(d);
                    }
                });
                
                if (guideLine) {
                    const cx = e.currentTarget.querySelector('.chart-dot').getAttribute('cx');
                    const baseCy = e.currentTarget.querySelector('.chart-dot').getAttribute('cy');
                    guideLine.setAttribute('x1', cx);
                    guideLine.setAttribute('x2', cx);
                    guideLine.setAttribute('y1', baseCy);
                    guideLine.style.opacity = '0.6';
                }
            }
        }
        
        if (hoverType === 'line') {
            const hoverL = e.currentTarget;
            if (hoverL && hoverL.parentNode) hoverL.parentNode.appendChild(hoverL);
        }
        
        if (e) {
            tooltip.classList.add('visible');
            
            let upper = Math.min(100, pct + moe).toFixed(1);
            let lower = Math.max(0, pct - moe).toFixed(1);
            
            if (monthStr) {
                tooltip.innerHTML = `
                    <div style="font-size: 11px; opacity: 0.8; text-transform: uppercase; margin-bottom: 2px; font-weight: 900;">${monthStr} Polling</div>
                    <div style="margin-bottom: 4px;">${cand} | ${pct}%</div>
                    <div style="font-size: 11px; opacity: 0.8;">95% CI: [${lower}%, ${upper}%]</div>
                    <div style="font-size: 11px; opacity: 0.8;">Unweighted n = ${n}</div>
                `;
            } else {
                tooltip.innerHTML = `
                    <div style="margin-bottom: 4px;">${cand} | ${pct}%</div>
                    <div style="font-size: 11px; opacity: 0.8;">95% CI: [${lower}%, ${upper}%]</div>
                    <div style="font-size: 11px; opacity: 0.8;">Unweighted n = ${n}</div>
                `;
            }
            tooltip.style.borderColor = color;
            
            const rect = tooltip.getBoundingClientRect();
            let left = e.clientX + 15;
            let top = e.clientY + 15;
            
            if (left + rect.width > window.innerWidth - 10) {
                left = e.clientX - rect.width - 15;
            }
            if (top + rect.height > window.innerHeight - 10) {
                top = e.clientY - rect.height - 15;
            }
            
            left = Math.max(10, Math.min(left, window.innerWidth - rect.width - 10));
            top = Math.max(10, Math.min(top, window.innerHeight - rect.height - 10));
            
            tooltip.style.left = left + 'px';
            tooltip.style.top = top + 'px';
        }
    } else {
        hoverTimeout = setTimeout(() => {
            clearAllHovers();
            currentHoverCluster = null;
        }, 300); 
    }
}

function renderGraph() {
    updateShowingIndicator();

    const questionTitle = document.getElementById('currentQuestionTitle');
    if (questionTitle) {
        if (!questionTitle.textContent) {
            questionTitle.textContent = currentRace;
            questionTitle.dataset.targetRace = currentRace;
        } else if (questionTitle.dataset.targetRace !== currentRace) {
            questionTitle.dataset.targetRace = currentRace;
            questionTitle.style.opacity = '0';
            setTimeout(() => {
                if (questionTitle.dataset.targetRace === currentRace) {
                    questionTitle.textContent = currentRace;
                    questionTitle.style.opacity = '1';
                }
            }, 300);
        }
    }
    
    let tableTitleEl = document.getElementById('currentTableTitle');
    if (tableTitleEl) {
        if (!tableTitleEl.textContent) {
            tableTitleEl.textContent = currentRace;
            tableTitleEl.dataset.targetRace = currentRace;
        } else if (tableTitleEl.dataset.targetRace !== currentRace) {
            tableTitleEl.dataset.targetRace = currentRace;
            tableTitleEl.style.opacity = '0';
            setTimeout(() => {
                if (tableTitleEl.dataset.targetRace === currentRace) {
                    tableTitleEl.textContent = currentRace;
                    tableTitleEl.style.opacity = '1';
                }
            }, 300);
        }
    }

    const raceVotes = votesData.filter(v => v.race_slug === currentRace);
    const n = raceVotes.length;
    
    const emptyState = document.getElementById('pollingEmptyState');
    const subtitle = document.getElementById('pollingSubtitle');
    const tableContainer = document.getElementById('pollingTableWrapper');
    
    let validCandidates = [];
    let moe = 0;
    
    if (n < 40) {
        if(emptyState) emptyState.classList.add('show');
        if(subtitle) subtitle.style.opacity = '0';
        if(tableContainer) tableContainer.style.opacity = '0';
        if(tableTitleEl) tableTitleEl.style.opacity = '0';
    } else {
        if(emptyState) emptyState.classList.remove('show');
        moe = (0.98 / Math.sqrt(n)) * 100;
        if(subtitle) {
            subtitle.textContent = `Sample Size: n = ${n} | Margin of Error: ±${moe.toFixed(1)}% (95% Confidence Level)`;
            subtitle.style.opacity = '1';
        }
        if(tableContainer) tableContainer.style.opacity = '1';
        if(tableTitleEl) tableTitleEl.style.opacity = '1';
        validCandidates = [...new Set(raceVotes.map(v => v.candidate_choice))];
    }
    
    const date = new Date();
    const currentMonthNum = date.getMonth() + 1; 
    
    const getM = (offset) => {
        let val = currentMonthNum + offset;
        if (val <= 0) val += 12;
        if (val > 12) val -= 12;
        return val;
    };
    
    const months = [getM(-2), getM(-1), getM(0), getM(1)];
    
    gLabels.innerHTML = '';
    const xOffsets = [
        padding.left, 
        padding.left + chartW * 0.33, 
        padding.left + chartW * 0.66, 
        padding.left + chartW
    ];
    
    const bottomY = padding.top + chartH;
    
    months.forEach((m, idx) => {
        const text = document.createElementNS(svgNS, 'text');
        text.setAttribute('x', xOffsets[idx]);
        text.setAttribute('y', bottomY + 30);
        text.setAttribute('text-anchor', 'middle');
        text.classList.add('chart-label');
        text.textContent = monthNames[m - 1];
        gLabels.appendChild(text);
    });
    
    const getPct = (cand, monthNum) => {
        const mVotes = raceVotes.filter(v => parseInt(v.survey_month) === monthNum);
        const totalWeight = mVotes.reduce((sum, v) => sum + (v.weight || 1), 0);
        if (totalWeight === 0) return 0;
        const cVotes = mVotes.filter(v => v.candidate_choice === cand);
        const cWeight = cVotes.reduce((sum, v) => sum + (v.weight || 1), 0);
        return Math.round((cWeight / totalWeight) * 100);
    };
    
    let endpoints = [];
    
    const pathsData = validCandidates.map(cand => {
        let pts = [];
        for (let i = 0; i < 3; i++) {
            const pct = getPct(cand, months[i]);
            const x = xOffsets[i];
            const y = bottomY - (pct / 100) * chartH;
            pts.push({ x, y, pct, cand });
        }
        return { cand, pts, color: getColorForCandidate(cand) };
    });
    
    let colorCounts = {};
    pathsData.forEach(pd => {
        if (colorCounts[pd.color] === undefined) colorCounts[pd.color] = 0;
        pd.key = `${pd.color}-${colorCounts[pd.color]}`;
        colorCounts[pd.color]++;
    });

    endpoints.forEach(ep => {
        const pd = pathsData.find(p => p.cand === ep.cand);
        ep.key = pd.key;
    });
    
    pathsData.forEach(pd => {
        pd.pts.forEach(pt => pt.adjustedY = pt.y);
    });

    endpoints = pathsData.map(pd => {
        let ep = pd.pts[2];
        return { cand: pd.cand, pct: ep.pct, x: ep.x, y: ep.y, adjustedY: ep.y, color: pd.color, key: pd.key };
    });
    
    const newKeySet = new Set(pathsData.map(pd => pd.key));
    
    const bottomD = `M ${xOffsets[0]} ${bottomY} L ${xOffsets[1]} ${bottomY} L ${xOffsets[2]} ${bottomY}`;
    const bottomRibbonD = `M ${xOffsets[0]} ${bottomY} L ${xOffsets[1]} ${bottomY} L ${xOffsets[2]} ${bottomY} L ${xOffsets[2]} ${bottomY} L ${xOffsets[1]} ${bottomY} L ${xOffsets[0]} ${bottomY} Z`;

    Array.from(gRibbons.children).forEach(el => {
        if (!newKeySet.has(el.dataset.key) && !el.dataset.leaving) {
            el.dataset.leaving = 'true';
            el.setAttribute('d', bottomRibbonD);
            el.style.opacity = 0;
            setTimeout(() => el.remove(), 600);
        }
    });

    Array.from(gLines.children).forEach(el => {
        if (!newKeySet.has(el.dataset.key) && !el.dataset.leaving) {
            el.dataset.leaving = 'true';
            el.setAttribute('d', bottomD);
            el.style.opacity = 0;
            setTimeout(() => el.remove(), 600);
        }
    });

    Array.from(gHoverLines.children).forEach(el => {
        if (!newKeySet.has(el.dataset.key)) {
            el.remove();
        }
    });
    
    pathsData.forEach(pd => {
        const dx1 = pd.pts[1].x - pd.pts[0].x;
        const dx2 = pd.pts[2].x - pd.pts[1].x;
        
        const cp1x = pd.pts[0].x + (dx1 * 0.4);
        const cp1y = pd.pts[0].y;
        const cp2x = pd.pts[1].x - (dx1 * 0.4);
        const cp2y = pd.pts[1].y;
        
        const cp3x = pd.pts[1].x + (dx2 * 0.4);
        const cp3y = pd.pts[1].y;
        const cp4x = pd.pts[2].x - (dx2 * 0.4);
        const cp4y = pd.pts[2].adjustedY;

        const targetD = `M ${pd.pts[0].x} ${pd.pts[0].y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${pd.pts[1].x} ${pd.pts[1].y} C ${cp3x} ${cp3y}, ${cp4x} ${cp4y}, ${pd.pts[2].x} ${pd.pts[2].adjustedY}`;
        
        const moePx = (moe / 100) * chartH;
        
        const u0y = Math.max(padding.top, pd.pts[0].y - moePx);
        const u1y = Math.max(padding.top, pd.pts[1].y - moePx);
        const u2y = Math.max(padding.top, pd.pts[2].adjustedY - moePx);
        
        const d0y = Math.min(bottomY, pd.pts[0].y + moePx);
        const d1y = Math.min(bottomY, pd.pts[1].y + moePx);
        const d2y = Math.min(bottomY, pd.pts[2].adjustedY + moePx);
        
        const targetRibbonD = `M ${pd.pts[0].x} ${u0y} 
                               C ${cp1x} ${u0y}, ${cp2x} ${u1y}, ${pd.pts[1].x} ${u1y} 
                               C ${cp3x} ${u1y}, ${cp4x} ${u2y}, ${pd.pts[2].x} ${u2y} 
                               L ${pd.pts[2].x} ${d2y} 
                               C ${cp4x} ${d2y}, ${cp3x} ${d1y}, ${pd.pts[1].x} ${d1y} 
                               C ${cp2x} ${d1y}, ${cp1x} ${d0y}, ${pd.pts[0].x} ${d0y} Z`;
        
        let ribbon = Array.from(gRibbons.children).find(el => el.dataset.key === pd.key && !el.dataset.leaving);
        if (!ribbon) {
            ribbon = document.createElementNS(svgNS, 'path');
            ribbon.dataset.key = pd.key;
            ribbon.dataset.cand = pd.cand;
            ribbon.classList.add('chart-ribbon');
            ribbon.setAttribute('fill', pd.color);
            ribbon.setAttribute('d', bottomRibbonD);
            ribbon.style.opacity = 0;
            gRibbons.appendChild(ribbon);
            
            ribbon.getBoundingClientRect(); 
            
            ribbon.setAttribute('d', targetRibbonD);
            ribbon.style.opacity = 1;
        } else {
            ribbon.dataset.cand = pd.cand; 
            ribbon.setAttribute('d', targetRibbonD);
            ribbon.setAttribute('fill', pd.color);
        }

        let path = Array.from(gLines.children).find(el => el.dataset.key === pd.key && !el.dataset.leaving);
        if (!path) {
            path = document.createElementNS(svgNS, 'path');
            path.dataset.key = pd.key;
            path.dataset.cand = pd.cand;
            path.classList.add('chart-line');
            path.setAttribute('stroke', pd.color);
            path.setAttribute('d', bottomD);
            path.style.opacity = 0;
            gLines.appendChild(path);
            
            path.getBoundingClientRect(); 
            
            path.setAttribute('d', targetD);
            path.style.opacity = 1;
        } else {
            path.dataset.cand = pd.cand; 
            path.setAttribute('d', targetD);
            path.setAttribute('stroke', pd.color);
        }

        let hoverPath = Array.from(gHoverLines.children).find(el => el.dataset.key === pd.key);
        if (!hoverPath) {
            hoverPath = document.createElementNS(svgNS, 'path');
            hoverPath.dataset.key = pd.key;
            hoverPath.dataset.cand = pd.cand;
            hoverPath.classList.add('chart-hover-line');
            hoverPath.setAttribute('d', targetD);
            gHoverLines.appendChild(hoverPath);
        } else {
            hoverPath.dataset.cand = pd.cand; 
            hoverPath.setAttribute('d', targetD);
        }
        
        hoverPath.onmousemove = (e) => handleHoverInteraction(pd.cand, pd.pts[2].pct, pd.color, e, true, null, 'line', hoverPath, moe, n);
        hoverPath.onmouseleave = (e) => handleHoverInteraction(pd.cand, pd.pts[2].pct, pd.color, e, false, null, 'line', hoverPath, moe, n);
    });

    Array.from(gDots.children).forEach(el => {
        if (!newKeySet.has(el.dataset.key) && !el.dataset.leaving) {
            el.dataset.leaving = 'true';
            
            const dot = el.querySelector('.chart-dot');
            const hoverDot = el.querySelector('.chart-hover-dot');
            if(dot) dot.setAttribute('cy', bottomY);
            if(hoverDot) hoverDot.setAttribute('cy', bottomY);
            
            el.style.opacity = 0;
            setTimeout(() => el.remove(), 600);
        }
    });

    pathsData.forEach(pd => {
        for(let i=0; i<2; i++) {
            let dotGroup = Array.from(gDots.children).find(el => el.dataset.key === pd.key && parseInt(el.dataset.idx) === i && !el.dataset.leaving);
            if (!dotGroup) {
                dotGroup = document.createElementNS(svgNS, 'g');
                dotGroup.dataset.key = pd.key;
                dotGroup.dataset.cand = pd.cand;
                dotGroup.dataset.idx = i;
                dotGroup.dataset.pct = pd.pts[i].pct;
                dotGroup.classList.add('dot-group');
                
                const dot = document.createElementNS(svgNS, 'circle');
                dot.classList.add('chart-dot');
                if (i < 2) dot.classList.add('past-dot');
                dot.setAttribute('fill', pd.color);
                dot.setAttribute('cx', pd.pts[i].x);
                dot.setAttribute('cy', bottomY);
                
                const hoverDot = document.createElementNS(svgNS, 'circle');
                hoverDot.classList.add('chart-hover-dot');
                hoverDot.setAttribute('r', '25');
                hoverDot.setAttribute('cx', pd.pts[i].x);
                hoverDot.setAttribute('cy', bottomY);
                
                dotGroup.appendChild(dot);
                dotGroup.appendChild(hoverDot);
                gDots.appendChild(dotGroup);
                
                dotGroup.getBoundingClientRect();
                
                dot.setAttribute('cy', pd.pts[i].y);
                hoverDot.setAttribute('cy', pd.pts[i].y);
            } else {
                dotGroup.dataset.cand = pd.cand; 
                dotGroup.dataset.pct = pd.pts[i].pct;
                
                const dot = dotGroup.querySelector('.chart-dot');
                const hoverDot = dotGroup.querySelector('.chart-hover-dot');
                
                dot.setAttribute('fill', pd.color);
                dot.setAttribute('cx', pd.pts[i].x);
                dot.setAttribute('cy', pd.pts[i].y);
                
                hoverDot.setAttribute('cx', pd.pts[i].x);
                hoverDot.setAttribute('cy', pd.pts[i].y);
            }
            
            dotGroup.onmousemove = (e) => {
                e.stopPropagation();
                handleHoverInteraction(pd.cand, pd.pts[i].pct, pd.color, e, true, monthNames[months[i] - 1], 'dot', null, moe, n);
            };
            dotGroup.onmouseleave = (e) => handleHoverInteraction(pd.cand, pd.pts[i].pct, pd.color, e, false, null, 'dot', null, moe, n);
        }
    });
    
    const pillW = 56;
    const pillH = 30;
    
    Array.from(gPills.children).forEach(group => {
        if (!newKeySet.has(group.dataset.key) && !group.dataset.leaving) {
            group.dataset.leaving = 'true';
            const rect = group.querySelector('rect');
            const text = group.querySelector('text');
            if (rect) rect.setAttribute('y', bottomY - pillH / 2);
            if (text) text.setAttribute('y', bottomY);
            
            group.style.opacity = 0;
            setTimeout(() => group.remove(), 600);
        }
    });
    
    endpoints.forEach(ep => {
        let group = Array.from(gPills.children).find(el => el.dataset.key === ep.key && !el.dataset.leaving);
        if (!group) {
            group = document.createElementNS(svgNS, 'g');
            group.dataset.key = ep.key;
            group.dataset.cand = ep.cand;
            
            const rect = document.createElementNS(svgNS, 'rect');
            rect.classList.add('chart-pill');
            rect.setAttribute('fill', ep.color);
            rect.setAttribute('rx', 15);
            
            const text = document.createElementNS(svgNS, 'text');
            text.classList.add('pill-text');
            text.setAttribute('fill', '#ffffff');
            text.textContent = ep.pct + '%';
            
            rect.setAttribute('x', ep.x - pillW / 2);
            rect.setAttribute('y', bottomY - pillH / 2);
            rect.setAttribute('width', pillW);
            rect.setAttribute('height', pillH);
            
            text.setAttribute('x', ep.x);
            text.setAttribute('y', bottomY);
            
            group.appendChild(rect);
            group.appendChild(text);
            group.style.opacity = 0;
            group.style.transition = 'opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
            
            gPills.appendChild(group);
            
            group.getBoundingClientRect();
            
            rect.setAttribute('y', ep.adjustedY - pillH / 2);
            text.setAttribute('y', ep.adjustedY);
            group.style.opacity = 1;
        } else {
            group.dataset.cand = ep.cand; 
            
            const rect = group.querySelector('rect');
            const text = group.querySelector('text');
            
            rect.setAttribute('x', ep.x - pillW / 2);
            rect.setAttribute('y', ep.adjustedY - pillH / 2);
            rect.setAttribute('fill', ep.color);
            
            text.setAttribute('x', ep.x);
            text.setAttribute('y', ep.adjustedY);
            text.textContent = ep.pct + '%';
        }
        
        group.onmousemove = (e) => {
            e.stopPropagation();
            handleHoverInteraction(ep.cand, ep.pct, ep.color, e, true, monthNames[months[2] - 1], 'pill', null, moe, n);
        };
        group.onmouseleave = (e) => handleHoverInteraction(ep.cand, ep.pct, ep.color, e, false, null, 'pill', null, moe, n);
    });

    const dataTable = document.getElementById('pollingDataTable');
    if (dataTable && validCandidates.length > 0) {
        let theadHTMLInner = `
            <tr>
                <th>Candidate / Choice</th>
                <th>${monthNames[months[0] - 1]}</th>
                <th>${monthNames[months[1] - 1]}</th>
                <th>${monthNames[months[2] - 1]}</th>
                <th>Margin</th>
            </tr>
        `;
        let tbodyHTMLInner = ``;
        
        const sortedPaths = [...pathsData].sort((a, b) => b.pts[2].pct - a.pts[2].pct);
        const topPct = sortedPaths.length > 0 ? sortedPaths[0].pts[2].pct : 0;
        const secondPct = sortedPaths.length > 1 ? sortedPaths[1].pts[2].pct : 0;
        const isOverallTied = topPct === secondPct;
        
        sortedPaths.forEach((pd, index) => {
            let marginText = "";
            let marginClass = "";
            
            if (isOverallTied && pd.pts[2].pct === topPct) {
                marginText = "+0";
                marginClass = "margin-tied";
            } else if (index === 0) {
                const diff = topPct - secondPct;
                marginText = `+${diff}`;
                marginClass = "margin-positive";
            } else {
                const diff = topPct - pd.pts[2].pct;
                marginText = `-${diff}`;
                marginClass = "margin-negative";
            }
            
            tbodyHTMLInner += `
                <tr>
                    <td><span class="table-cand-color" style="background-color: ${pd.color};"></span>${pd.cand}</td>
                    <td>${pd.pts[0].pct}%</td>
                    <td>${pd.pts[1].pct}%</td>
                    <td>${pd.pts[2].pct}%</td>
                    <td><span class="${marginClass}">${marginText}</span></td>
                </tr>
            `;
        });
        
        let oldThead = dataTable.querySelector('thead');
        let oldTbody = dataTable.querySelector('tbody');
        
        if (!oldThead) {
            dataTable.innerHTML = `<thead>${theadHTMLInner}</thead><tbody>${tbodyHTMLInner}</tbody>`;
        } else {
            oldTbody.style.opacity = '0';
            setTimeout(() => {
                oldThead.innerHTML = theadHTMLInner;
                oldTbody.innerHTML = tbodyHTMLInner;
                oldTbody.style.opacity = '1';
            }, 300);
        }
    }
}