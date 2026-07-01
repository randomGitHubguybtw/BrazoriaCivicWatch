import { fixDate } from './utils/fixDate.js';

const API_BASE = 'https://api.brazoriacivicwatch.org';
const officialsContainer = document.querySelector('.js-candidates');
let showArchived = false;

function equalizeRowHeights() {
    const cards = Array.from(document.querySelectorAll('.seat-card')).filter(card => card.style.display !== 'none');
    if (!cards.length) return;

    cards.forEach(card => {
        card.style.minHeight = '';
    });

    let rows = [];
    let currentRow = [];
    let currentTop = -1;

    cards.forEach(card => {
        const top = card.getBoundingClientRect().top;
        if (currentTop === -1 || Math.abs(currentTop - top) > 5) {
            if (currentRow.length > 0) {
                rows.push(currentRow);
            }
            currentRow = [card];
            currentTop = top;
        } else {
            currentRow.push(card);
        }
    });

    if (currentRow.length > 0) {
        rows.push(currentRow);
    }

    rows.forEach(row => {
        const maxHeight = Math.max(...row.map(card => card.offsetHeight));
        row.forEach(card => {
            card.style.minHeight = `${maxHeight}px`;
        });
    });
}

window.addEventListener('resize', equalizeRowHeights);

function applySearch() {
    const searchInput = document.getElementById('officialSearchInput');
    if (!searchInput) return;
    
    const searchTerm = searchInput.value.toLowerCase();
    
    const url = new URL(window.location);
    if (searchInput.value) {
        url.searchParams.set('search', searchInput.value);
    } else {
        url.searchParams.delete('search');
    }
    window.history.replaceState({}, '', url);

    const cards = document.querySelectorAll('.seat-card');
    
    cards.forEach(card => card.style.minHeight = '');

    cards.forEach(card => {
        const cardText = card.textContent.toLowerCase();
        if (cardText.includes(searchTerm)) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
    
    requestAnimationFrame(() => {
        equalizeRowHeights();
    });
}

function initializeSearch() {
    const searchContainer = document.querySelector('.candidate-search');
    if (searchContainer && !searchContainer.querySelector('#officialSearchInput')) {
        
        searchContainer.classList.add('candidate-search-wrapper');

        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.id = 'officialSearchInput';
        searchInput.placeholder = 'Search officials, parties, or positions...';
        searchInput.classList.add('candidate-search-input');
        
        const urlParams = new URLSearchParams(window.location.search);
        const savedSearch = urlParams.get('search');
        if (savedSearch) {
            searchInput.value = savedSearch;
        }
        
        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'toggleArchiveBtn';
        toggleBtn.textContent = 'Show Archived Officials';
        toggleBtn.classList.add('default-btn', 'js-hands-off');
        
        toggleBtn.addEventListener('click', () => {
            showArchived = !showArchived;
            toggleBtn.textContent = showArchived ? 'Show Active Officials' : 'Show Archived Officials';
            loadOfficials();
        });

        searchContainer.appendChild(searchInput);
        searchContainer.appendChild(toggleBtn);

        searchInput.addEventListener('input', applySearch);
    }
}

function checkOfficialMatch(jurisdiction) {
    if (!jurisdiction) return false;
    if (jurisdiction === 'County') return true;

    const firstUnderscore = jurisdiction.indexOf('_');
    let typePart = 'City';
    let valPart = jurisdiction;

    if (firstUnderscore !== -1) {
        typePart = jurisdiction.substring(0, firstUnderscore).trim();
        valPart = jurisdiction.substring(firstUnderscore + 1).trim();
    }

    const sessionMap = {
        "City": "city",
        "ISD": "isd",
        "Board of Education": "boardOfEd",
        "Congressional": "congressDist",
        "Justice of the Peace": "precinct",
        "State Representative": "stateRep",
        "State Senate": "stateSen",
        "College": "college",
        "Drainage": "drainage",
        "Hospital": "hospital",
        "MUD": "mud",
        "Navigation": "navigation"
    };

    const sessionKey = sessionMap[typePart] || 'city';
    const userVal = (sessionStorage.getItem(sessionKey) || 'None').trim();

    if (userVal.startsWith('All ') || userVal === 'All') return true;
    return userVal === valPart;
}

function formatGroupName(jurisdiction, position) {
    if (!jurisdiction) return position;
    const firstUnderscore = jurisdiction.indexOf('_');
    if (firstUnderscore !== -1) {
        const typePart = jurisdiction.substring(0, firstUnderscore).trim();
        const valPart = jurisdiction.substring(firstUnderscore + 1).trim();
        return `${typePart} (${valPart}) - ${position}`;
    }
    return `${jurisdiction} - ${position}`;
}

const loadOfficials = async () => {
    try {
        const userCity = sessionStorage.getItem('city');
        
        if (!userCity) {
            if (officialsContainer) {
                officialsContainer.innerHTML = '<p class="highlightable candidate-message">Please set your city to view your current officials.</p>';
            }
            return;
        }

        const [officialsResponse, seatsResponse] = await Promise.all([
            fetch(`${API_BASE}/api/officials`),
            fetch(`${API_BASE}/api/seats`)
        ]);
        
        if (!officialsResponse.ok || !seatsResponse.ok) throw new Error();
        
        const allOfficials = await officialsResponse.json();
        const allSeats = await seatsResponse.json();

        const runningIncumbents = new Set(
            allSeats
                .filter(s => s.name && (s.incumbent == 1 || s.incumbent === '1' || String(s.incumbent).toLowerCase() === 'yes' || String(s.incumbent).toLowerCase() === 'y' || String(s.incumbent).toLowerCase() === 'true'))
                .map(s => s.name.toLowerCase().trim())
        );

        const relevantOfficials = allOfficials.filter(off => {
            const isArchivedOfficial = off.is_archived === 1;
            
            if (showArchived && !isArchivedOfficial) return false;
            if (!showArchived && isArchivedOfficial) return false;
            
            if (off.scope === 'general' || off.scope === 'state' || off.scope === 'major') return true;
            if (off.scope === 'local') {
                return checkOfficialMatch(off.jurisdiction);
            }
            return false;
        });

        if (relevantOfficials.length === 0) {
            if (officialsContainer) {
                const emptyText = (userCity === 'All' || userCity === 'All Cities' || userCity.startsWith('All ')) ? 'any area' : userCity;
                const statusText = showArchived ? 'archived officials' : 'current officials';
                officialsContainer.innerHTML = `<p class="highlightable candidate-message">No ${statusText} found for ${emptyText}.</p>`;
            }
            return;
        }

        const groupsGrouped = {};
        relevantOfficials.forEach(off => {
            const groupKey = formatGroupName(off.jurisdiction, off.position || 'Unknown Position');
            
            if (!groupsGrouped[groupKey]) {
                groupsGrouped[groupKey] = [];
            }
            groupsGrouped[groupKey].push(off);
        });

        const sortedGroups = Object.entries(groupsGrouped).sort((a, b) => a[0].localeCompare(b[0]));

        if (officialsContainer) {
            officialsContainer.classList.add('candidates-grid-layout');
            let gridHTML = '';

            for (const [groupName, officialsList] of sortedGroups) {
                let officialsHTML = officialsList.map(off => {
                    const wikiLink = off.wikipedia ? `<a class="highlightable candidate-link" href="${off.wikipedia}" target="_blank" rel="noopener noreferrer">Wikipedia Article</a>` : '<span class="highlightable candidate-no-link">No wikipedia article available</span>';
                    
                    const webLink = off.website ? `<a class="highlightable candidate-link" href="${off.website}" target="_blank" rel="noopener noreferrer">Official Website</a>` : '<span class="highlightable candidate-no-link">No official website found</span>';

                    const emailLink = off.email ? `<p>Email: <a class="highlightable candidate-link" href="mailto:${off.email}">${off.email}</a> <span style="font-size: 0.85em; opacity: 0.8;">(<a class="highlightable candidate-link" href="https://mail.google.com/mail/?view=cm&fs=1&to=${off.email}" target="_blank" rel="noopener noreferrer">Gmail</a>)</span></p>` : '';
                    
                    const photoElement = off.photo ? `<div class="candidate-photo"><img src="${off.photo}" alt="${off.name}"></div>` : '';

                    const partyName = off.party || 'Independent';
                    const partyLower = partyName.toLowerCase();
                    let partyClass = 'party-other';

                    if (partyLower.includes('democrat')) partyClass = 'party-democrat';
                    else if (partyLower.includes('republican')) partyClass = 'party-republican';
                    else if (partyLower.includes('green')) partyClass = 'party-green';
                    else if (partyLower.includes('libertarian')) partyClass = 'party-libertarian';

                    const absenteeism = (off.absent_percentage !== null && off.absent_percentage !== undefined) ? `${off.absent_percentage}%` : 'Insufficient data to calculate';
                    
                    let dateEntered = 'Unknown';
                    if (off.date_entered) {
                        try {
                            dateEntered = fixDate(off.date_entered);
                        } catch (e) {
                            dateEntered = off.date_entered;
                        }
                    }
                    
                    let dateLeftHtml = '';
                    if (showArchived && off.date_left) {
                        let dateLeft = 'Unknown';
                        try {
                            dateLeft = fixDate(off.date_left);
                        } catch (e) {
                            dateLeft = off.date_left;
                        }
                        dateLeftHtml = `<p>Left Office: ${dateLeft}</p>`;
                    }

                    const isRunning = off.name && runningIncumbents.has(off.name.toLowerCase().trim());
                    const runningBadge = isRunning ? ` <span style="font-size: 0.85em; font-weight: normal; font-style: italic; opacity: 0.9;">(Running for re-election)</span>` : '';

                    return `
                        <div class="candidate-info">
                            <div class="candidate-text-content">
                                <h4 class="highlightable candidate-name-party">
                                    <span class="${partyClass}">${partyName}:</span> ${off.name || 'Unknown'}${runningBadge}
                                </h4>
                                <div class="candidate-metadata">
                                    <p>Entered Office: ${dateEntered}</p>
                                    ${dateLeftHtml}
                                    <p>Absenteeism: ${absenteeism}</p>
                                    ${emailLink}
                                </div>
                                <div class="candidate-links-container">
                                    <span class="screen-only-link">${webLink}</span>
                                    <span class="screen-only-link">${wikiLink}</span>
                                </div>
                            </div>
                            ${photoElement}
                        </div>
                    `;
                }).join('');

                gridHTML += `
                    <div class="seat-card">
                        <h3 class="highlightable seat-title">${groupName}</h3>
                        <div class="seat-candidates-wrapper">
                            ${officialsHTML}
                        </div>
                    </div>
                `;
            }

            officialsContainer.innerHTML = gridHTML;
            
            initializeSearch();
            applySearch();

            setTimeout(() => {
                equalizeRowHeights();
            }, 150);
        }

    } catch (error) {
        if (officialsContainer) {
            officialsContainer.innerHTML = '<p class="highlightable candidate-message">Error loading officials data. Please try again later.</p>';
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    initializeSearch();
    loadOfficials();
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        setTimeout(loadOfficials, 50);
    }
});