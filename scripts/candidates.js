import { fixDate } from './utils/fixDate.js';

const API_BASE = 'https://api.brazoriacivicwatch.org';
const candidatesContainer = document.querySelector('.js-candidates');

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
    const searchInput = document.getElementById('candidateSearchInput');
    if (!searchInput) return;
    
    const searchTerm = searchInput.value.toLowerCase();
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
    if (searchContainer && !searchContainer.querySelector('input')) {
        
        searchContainer.classList.add('candidate-search-wrapper');

        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.id = 'candidateSearchInput';
        searchInput.placeholder = 'Search candidates, parties, or seats...';
        searchInput.classList.add('candidate-search-input');
        
        searchContainer.appendChild(searchInput);

        searchInput.addEventListener('input', applySearch);
    }
}

function checkCandidateMatch(seatCity) {
    if (!seatCity) return false;
    if (seatCity === 'County') return true;

    const firstUnderscore = seatCity.indexOf('_');
    let typePart = 'City';
    let valPart = seatCity;

    if (firstUnderscore !== -1) {
        typePart = seatCity.substring(0, firstUnderscore).trim();
        valPart = seatCity.substring(firstUnderscore + 1).trim();
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

const loadCandidates = async () => {
    try {
        const userCity = sessionStorage.getItem('city');
        
        if (!userCity) {
            if (candidatesContainer) {
                candidatesContainer.innerHTML = '<p class="highlightable candidate-message">Please set your city to view your ballot candidates.</p>';
            }
            return;
        }

        const isAllCities = userCity === 'All' || userCity === 'All Cities' || userCity.startsWith('All ');

        const [electionsResponse, seatsResponse, locationsResponse, addressesResponse] = await Promise.all([
            fetch(`${API_BASE}/api/elections`),
            fetch(`${API_BASE}/api/seats`),
            fetch(`${API_BASE}/api/polling_locations`),
            fetch(`${API_BASE}/api/polling_addresses`)
        ]);

        if (!electionsResponse.ok || !seatsResponse.ok || !locationsResponse.ok || !addressesResponse.ok) throw new Error();
        
        const allElections = await electionsResponse.json();
        const allSeats = await seatsResponse.json();
        const allLocations = await locationsResponse.json();
        const allAddresses = await addressesResponse.json();

        const relevantSeats = allSeats.filter(seat => {
            if (seat.scope === 'general' || seat.scope === 'state' || seat.scope === 'major') return true;
            if (seat.scope === 'local') {
                return checkCandidateMatch(seat.city);
            }
            return false;
        });

        const validElectionIds = new Set(relevantSeats.map(seat => seat.election_id));
        const now = new Date();

        const upcoming = allElections
            .filter(el => {
                if (!validElectionIds.has(el.election_id)) return false;
                const [y, m, d] = el.date.split('-');
                const electionDate = new Date(y, m - 1, d);
                return electionDate >= new Date(now.getFullYear(), now.getMonth(), now.getDate());
            })
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        if (upcoming.length === 0) {
            if (candidatesContainer) candidatesContainer.innerHTML = '<p class="highlightable candidate-message">No upcoming elections found.</p><a href="https://forms.gle/oTUAUNgc3TBwZozB6" target="_blank" class="default-link candidate-message" style="color: var(--accent-color);" >Volunteer to Add Some!</a>';
            return;
        }

        const targetElectionId = sessionStorage.getItem('nextElection') || sessionStorage.getItem('targetElection') || upcoming[0].election_id;

        const dateDisplay = document.querySelector('.election-date');
        if (dateDisplay) {
            dateDisplay.innerHTML = fixDate(targetElectionId);
        }

        const activeElection = allElections.find(el => el.election_id === targetElectionId);
        const existingIndicator = document.querySelector('.primary-election-label');
        if (existingIndicator) existingIndicator.remove();

        let isPrimaryElection = false;

        if (activeElection && activeElection.isPrimary === 1) {
            isPrimaryElection = true;
            const dateContainer = document.querySelector('.voting-time-container');
            if (dateContainer) {
                const primaryLabel = document.createElement('h3');
                primaryLabel.className = 'primary-election-label highlightable';
                primaryLabel.textContent = 'Primary Election';
                dateContainer.appendChild(primaryLabel);
            }
        }

        const targetCandidates = relevantSeats.filter(seat => seat.election_id === targetElectionId);

        if (targetCandidates.length === 0) {
            if (candidatesContainer) {
                const emptyText = isAllCities ? 'any area' : userCity;
                candidatesContainer.innerHTML = `<p class="highlightable candidate-message">No candidates currently listed for ${emptyText}.</p>`;
            }
            return;
        }

        const cityLocations = allLocations.filter(loc => 
            loc.election_id === targetElectionId && (isAllCities || loc.city === userCity)
        );
        const validLocationIds = new Set(cityLocations.map(loc => loc.locations_id));
        const mainAddresses = allAddresses.filter(addr => validLocationIds.has(addr.locations_id));

        const otherLocations = allLocations.filter(loc => 
            loc.election_id === targetElectionId && (!isAllCities && loc.city !== userCity)
        );
        const otherLocationIds = new Set(otherLocations.map(loc => loc.locations_id));
        const otherAddresses = allAddresses.filter(addr => otherLocationIds.has(addr.locations_id) && !validLocationIds.has(addr.locations_id));

        document.querySelectorAll('.print-only-header, .print-only-locations, .print-only-footer, .print-only-seats').forEach(el => el.remove());

        const uniqueSeatsArray = Array.from(new Set(targetCandidates.map(c => c.seat_name || "Unknown Seat")));

        const printHeader = document.createElement('h1');
        printHeader.className = 'print-only-header';
        printHeader.innerHTML = '<i>Brazoria Civic Watch</i> Sample Ballot';
        
        const printSeats = document.createElement('div');
        printSeats.className = 'print-only-seats';
        printSeats.innerHTML = `<strong>Elected Seats:</strong> ${uniqueSeatsArray.join('<strong>;</strong> ')}`;

        const printLocations = document.createElement('div');
        printLocations.className = 'print-only-locations';
        
        if (mainAddresses.length > 0) {
            const locationsHtml = mainAddresses.map(addr => `<div class="print-location-item"><b>${addr.name}</b><br>${addr.address}</div>`).join('');
            printLocations.innerHTML = `<div class="print-location-title">Your Polling Locations:</div><div class="print-location-grid">${locationsHtml}</div>`;
        } else {
            printLocations.innerHTML = `<div class="print-location-title">Your Polling Locations:</div><p>No specific locations listed for your area.</p>`;
        }

        const dateContainer = document.querySelector('.voting-time-container');
        if (dateContainer && dateContainer.parentNode) {
            dateContainer.parentNode.insertBefore(printHeader, dateContainer);
            dateContainer.parentNode.insertBefore(printSeats, dateContainer.nextSibling);
            dateContainer.parentNode.insertBefore(printLocations, printSeats.nextSibling);
        } else if (candidatesContainer && candidatesContainer.parentNode) {
            candidatesContainer.parentNode.insertBefore(printHeader, candidatesContainer);
            candidatesContainer.parentNode.insertBefore(printSeats, candidatesContainer);
            candidatesContainer.parentNode.insertBefore(printLocations, candidatesContainer);
        }

        if (otherAddresses.length > 0) {
            const printFooter = document.createElement('div');
            printFooter.className = 'print-only-footer';
            
            const footerLocationsHtml = otherAddresses.map(addr => `<span class="print-location-item-compact"><b>${addr.name}</b> (${addr.address})</span>`).join(' <strong>|</strong> ');
            printFooter.innerHTML = `<div class="print-location-title">Other Polling Locations:</div><div class="print-location-compact-list">${footerLocationsHtml}</div>`;

            if (candidatesContainer && candidatesContainer.parentNode) {
                candidatesContainer.parentNode.insertBefore(printFooter, candidatesContainer.nextSibling);
            }
        }

        const seatsGrouped = {};
        targetCandidates.forEach(cand => {
            const seatName = cand.seat_name || "Unknown Seat";
            const partyName = cand.party || "Independent";
            
            const groupKey = isPrimaryElection ? `${seatName} - ${partyName}` : seatName;
            
            if (!seatsGrouped[groupKey]) {
                seatsGrouped[groupKey] = [];
            }
            seatsGrouped[groupKey].push(cand);
        });

        const sortedSeats = Object.entries(seatsGrouped).sort((a, b) => b[1].length - a[1].length);

        if (candidatesContainer) {
            candidatesContainer.classList.add('candidates-grid-layout');
            let gridHTML = '';

            for (const [seatGroupName, candidatesList] of sortedSeats) {
                let candidatesHTML = candidatesList.map(c => {
                    const isIncumbent = (c.incumbent && (c.incumbent.toLowerCase() === 'y' || c.incumbent.toLowerCase() === 'yes')) ? 'Yes' : 'No';

                    const wikiLink = c.wikipedia ? `<a class="highlightable candidate-link" href="${c.wikipedia}" target="_blank">Wikipedia Article</a>` : '<span class="highlightable candidate-no-link">No wikipedia article available</span>';
                    const webLink = c.website ? `<a class="highlightable candidate-link" href="${c.website}" target="_blank">Campaign Website</a>` : '';

                    let interviewHtmlScreen = '';
                    let interviewHtmlPaper = '';
                    const interviewData = c.interviewed ? c.interviewed.trim() : '';

                    if (interviewData === 'None scheduled' || interviewData === 'Not scheduled' || interviewData === '') {
                        interviewHtmlScreen = '<span class="highlightable candidate-no-link">This candidate does not have an interview scheduled</span>';
                        interviewHtmlPaper = '<span class="highlightable candidate-no-link">This candidate does not have an interview scheduled</span>';
                    } else if (interviewData === 'Scheduled') {
                        interviewHtmlScreen = '<span class="highlightable candidate-no-link">This candidate\'s interview is scheduled</span>';
                        interviewHtmlPaper = '<span class="highlightable candidate-no-link">This candidate\'s interview is scheduled</span>';
                    } else if (interviewData === 'Refused to comment' || interviewData === 'Refused') {
                        interviewHtmlScreen = '<span class="highlightable candidate-no-link">This candidate has refused an interview</span>';
                        interviewHtmlPaper = '<span class="highlightable candidate-no-link">This candidate has refused an interview</span>';
                    } else {
                        interviewHtmlScreen = `<a class="highlightable candidate-link" href="${interviewData}" target="_blank">Candidate Interview</a>`;
                        interviewHtmlPaper = '<span class="highlightable candidate-no-link">This candidate has agreed to an interview</span>';
                    }

                    const partyName = c.party || 'Independent';
                    const partyLower = partyName.toLowerCase();
                    let partyClass = 'party-other';

                    if (partyLower.includes('democrat')) partyClass = 'party-democrat';
                    else if (partyLower.includes('republican')) partyClass = 'party-republican';
                    else if (partyLower.includes('green')) partyClass = 'party-green';
                    else if (partyLower.includes('libertarian')) partyClass = 'party-libertarian';

                    return `
                        <div class="candidate-info">
                            <h4 class="highlightable candidate-name-party">
                                <span class="${partyClass}">${partyName}:</span> ${c.name || 'Unknown'}, Incumbent (${isIncumbent})
                            </h4>
                            <div class="candidate-links-container">
                                <span class="screen-only-link">${webLink}</span>
                                <span class="screen-only-link">${wikiLink}</span>
                                <span class="screen-only-link">${interviewHtmlScreen}</span>
                                <span class="print-only-link">${interviewHtmlPaper}</span>
                            </div>
                        </div>
                    `;
                }).join('');

                gridHTML += `
                    <div class="seat-card">
                        <h3 class="highlightable seat-title">${seatGroupName}</h3>
                        <div class="seat-candidates-wrapper">
                            ${candidatesHTML}
                        </div>
                    </div>
                `;
            }

            candidatesContainer.innerHTML = gridHTML;
            
            initializeSearch();
            applySearch();

            setTimeout(() => {
                equalizeRowHeights();

                const urlParams = new URLSearchParams(window.location.search);
                if (sessionStorage.getItem('printRequested') === 'true' || urlParams.get('print') === 'true') {
                    setTimeout(() => {
                        window.print();
                        sessionStorage.removeItem('printRequested');
                        
                        if (urlParams.get('print') === 'true') {
                            urlParams.delete('print');
                            const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
                            window.history.replaceState({}, document.title, newUrl);
                        }
                    }, 500); 
                }
            }, 150);
        }

    } catch (error) {
        if (candidatesContainer) {
            candidatesContainer.innerHTML = '<p class="highlightable candidate-message">Error loading candidate data. Please try again later.</p>';
        }
    }
};

document.addEventListener('DOMContentLoaded', loadCandidates);

document.addEventListener('click', (event) => {
    const printBtn = event.target.closest('[data-print="true"]');
    if (printBtn) {
        sessionStorage.setItem('printRequested', 'true');
    }
    setTimeout(loadCandidates, 50);
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        setTimeout(loadCandidates, 50);
    }
});