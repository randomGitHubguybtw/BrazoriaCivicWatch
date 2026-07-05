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
    const interviewBtn = document.getElementById('interviewFilterBtn');
    if (!searchInput) return;
    
    const searchTerm = searchInput.value.toLowerCase();
    const requireInterview = interviewBtn ? interviewBtn.dataset.filtered === 'true' : false;
    
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
        const textMatch = cardText.includes(searchTerm);
        let interviewMatch = true;

        if (requireInterview) {
            const interviewStatuses = Array.from(card.querySelectorAll('.screen-only-link:nth-child(3)'));
            interviewMatch = interviewStatuses.some(statusNode => 
                !statusNode.textContent.includes('This candidate does not have an interview scheduled')
            );
        }

        if (textMatch && interviewMatch) {
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
        
        const urlParams = new URLSearchParams(window.location.search);
        const savedSearch = urlParams.get('search');
        if (savedSearch) {
            searchInput.value = savedSearch;
        }

        const filterBtn = document.createElement('button');
        filterBtn.id = 'interviewFilterBtn';
        filterBtn.classList.add('interview-filter-btn', 'js-hands-off');
        filterBtn.dataset.filtered = 'false';
        filterBtn.textContent = 'Show Only Candidates With Interviews';

        filterBtn.addEventListener('click', () => {
            if (filterBtn.dataset.filtered === 'false') {
                filterBtn.dataset.filtered = 'true';
                filterBtn.textContent = 'Showing Only Interviews (Click to Show All)';
                filterBtn.classList.add('active');
            } else {
                filterBtn.dataset.filtered = 'false';
                filterBtn.textContent = 'Show Only Candidates With Interviews';
                filterBtn.classList.remove('active');
            }
            applySearch();
        });

        searchContainer.appendChild(searchInput);
        searchContainer.appendChild(filterBtn);

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

function getSeatPriority(seat) {
    const name = (seat.seat_name || '').toLowerCase();
    
    // 1. Federal Offices
    if (name.includes('president')) return 10;
    if (name.includes('united states senator') || name.includes('u.s. senator')) return 11;
    if (name.includes('united states representative') || name.includes('u.s. representative') || name.includes('congress')) return 12;

    // 2. Statewide State Offices
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

    // 3. District State Offices
    if (name.includes('state board of education')) return 40;
    if (name.includes('state senator') || name.includes('state senate')) return 41;
    if (name.includes('state representative')) return 42;
    if (name.includes('chief justice') && name.includes('court of appeals')) return 43;
    if (name.includes('justice') && name.includes('court of appeals')) return 44;
    if (name.includes('district judge')) return 45;
    if (name.includes('district attorney')) return 46;

    // 4. County Offices
    if (name === 'county judge') return 50;
    if (name.includes('county court at law') || name.includes('probate court')) return 51;
    if (name === 'county attorney') return 52;
    if (name === 'district clerk') return 53;
    if (name === 'county clerk') return 54;
    if (name === 'sheriff') return 55;
    if (name.includes('tax assessor')) return 56;
    if (name.includes('county treasurer')) return 57;

    // 5. Precinct Offices
    if (name.includes('county commissioner')) return 60;
    if (name.includes('justice of the peace')) return 61;
    if (name.includes('constable')) return 62;

    // Fallbacks
    const scope = (seat.scope || '').toLowerCase();
    if (scope === 'federal') return 70;
    if (scope === 'state' || scope === 'general' || scope === 'major') return 80;
    if (scope === 'county') return 90;
    if (scope === 'local') return 100;

    return 999;
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

        const [electionsResponse, seatsResponse, locationsResponse, addressesResponse, officialsResponse] = await Promise.all([
            fetch(`${API_BASE}/api/elections`),
            fetch(`${API_BASE}/api/seats`),
            fetch(`${API_BASE}/api/polling_locations`),
            fetch(`${API_BASE}/api/polling_addresses`),
            fetch(`${API_BASE}/api/officials`)
        ]);

        if (!electionsResponse.ok || !seatsResponse.ok || !locationsResponse.ok || !addressesResponse.ok || !officialsResponse.ok) throw new Error();
        
        const allElections = await electionsResponse.json();
        const allSeats = await seatsResponse.json();
        const allLocations = await locationsResponse.json();
        const allAddresses = await addressesResponse.json();
        const allOfficials = await officialsResponse.json();

        const activeOfficials = new Set(
            allOfficials.filter(off => off.is_archived !== 1 && off.name).map(off => off.name.toLowerCase().trim())
        );

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
        printSeats.innerHTML = `<strong>Elected Seats:</strong> ${uniqueSeatsArray.join('<strong class="bold-semi">;</strong> ')}`;

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
            
            const footerLocationsHtml = otherAddresses.map(addr => `<span class="print-location-item-compact"><b>${addr.name}</b> (${addr.address})</span>`).join(' <strong class="bold-semi">|</strong> ');
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

        const sortedSeats = Object.entries(seatsGrouped).sort((a, b) => {
            const priorityA = getSeatPriority(a[1][0]);
            const priorityB = getSeatPriority(b[1][0]);
            
            if (priorityA !== priorityB) {
                return priorityA - priorityB;
            }
            
            return a[0].localeCompare(b[0]);
        });

        if (candidatesContainer) {
            candidatesContainer.classList.add('candidates-grid-layout');
            let gridHTML = '';

            for (const [seatGroupName, candidatesList] of sortedSeats) {
                let candidatesHTML = candidatesList.map(c => {
                    const isIncumbentBool = c.incumbent && (c.incumbent.toString().toLowerCase() === 'y' || c.incumbent.toString().toLowerCase() === 'yes' || c.incumbent.toString() === '1' || c.incumbent.toString().toLowerCase() === 'true');
                    const isIncumbent = isIncumbentBool ? 'Yes' : 'No';

                    let candidateDisplayName = c.name || 'Unknown';
                    if (isIncumbentBool && c.name && activeOfficials.has(c.name.toLowerCase().trim())) {
                        candidateDisplayName = `<a class="highlightable" href="webpages/current-officials.html?search=${encodeURIComponent(c.name.trim())}" style="color: inherit; text-decoration: underline;">${candidateDisplayName}</a>`;
                    }

                    const wikiLink = c.wikipedia ? `<a class="highlightable candidate-link" href="${c.wikipedia}" target="_blank">Wikipedia Article</a>` : '<span class="highlightable candidate-no-link">No wikipedia article available</span>';
                    
                    const webLink = c.website ? `<a class="highlightable candidate-link" href="${c.website}" target="_blank">Campaign Website</a>` : '<span class="highlightable candidate-no-link">No candidate homepage found</span>';

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
                    } else if (interviewData === 'Requested') {
                        interviewHtmlScreen = '<span class="highlightable candidate-no-link">This candidate has an interview request pending</span>';
                        interviewHtmlPaper = '<span class="highlightable candidate-no-link">This candidate has an interview request pending</span>';
                    }
                    else {
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
                                <span class="${partyClass}">${partyName}:</span> ${candidateDisplayName}, Incumbent (${isIncumbent})
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