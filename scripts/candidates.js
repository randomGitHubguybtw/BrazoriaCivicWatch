import { fixDate } from './utils/fixDate.js';

const API_BASE = 'https://api.brazoriacivicwatch.org';
const candidatesContainer = document.querySelector('.js-candidates');

const loadCandidates = async () => {
  
    try {
        const userCity = sessionStorage.getItem('city');
        
        if (!userCity) {
            if (candidatesContainer) {
                candidatesContainer.innerHTML = '<p class="highlightable candidate-message">Please set your city to view your ballot candidates.</p>';
            }
            return;
        }

        const isAllCities = userCity === 'All' || userCity === 'All Cities';

        const [electionsResponse, seatsResponse] = await Promise.all([
            fetch(`${API_BASE}/api/elections`),
            fetch(`${API_BASE}/api/seats`)
        ]);

        if (!electionsResponse.ok || !seatsResponse.ok) throw new Error();
        
        const allElections = await electionsResponse.json();
        const allSeats = await seatsResponse.json();

        const relevantSeats = allSeats.filter(seat => 
            seat.scope === 'major' || 
            seat.scope === 'state' || 
            seat.scope === 'general' || 
            (seat.scope === 'local' && (isAllCities || seat.city === userCity))
        );

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

        const targetCandidates = relevantSeats.filter(seat => seat.election_id === targetElectionId);

        if (targetCandidates.length === 0) {
            if (candidatesContainer) {
                const emptyText = isAllCities ? 'any area' : userCity;
                candidatesContainer.innerHTML = `<p class="highlightable candidate-message">No candidates currently listed for ${emptyText}.</p>`;
            }
            return;
        }

        const seatsGrouped = {};
        targetCandidates.forEach(cand => {
            const seatName = cand.seat_name || "Unknown Seat";
            if (!seatsGrouped[seatName]) {
                seatsGrouped[seatName] = [];
            }
            seatsGrouped[seatName].push(cand);
        });

        if (candidatesContainer) {
            candidatesContainer.classList.add('candidates-grid-layout');

            let gridHTML = '';

            for (const [seatName, candidatesList] of Object.entries(seatsGrouped)) {
                let candidatesHTML = candidatesList.map(c => {
                    const isIncumbent = (c.incumbent && (c.incumbent.toLowerCase() === 'y' || c.incumbent.toLowerCase() === 'yes')) ? 'Yes' : 'No';
                    const wikiLink = c.wikipedia ? `<a class="highlightable candidate-link" href="${c.wikipedia}" target="_blank">Wikipedia Article</a>` : '<span class="highlightable candidate-no-link">No wikipedia article available</span>';
                    const webLink = c.website ? `<a class="highlightable candidate-link" href="${c.website}" target="_blank">Campaign Website</a>` : '';

                    let interviewHtml = '';
                    const interviewData = c.interviewed ? c.interviewed.trim() : '';

                    if (interviewData === 'None scheduled' || interviewData === 'Not scheduled' || interviewData === '') {
                        interviewHtml = '<span class="highlightable candidate-no-link">This candidate does not have an interview scheduled</span>';
                    } else if (interviewData === 'Scheduled') {
                        interviewHtml = '<span class="highlightable candidate-no-link">This candidates interview is scheduled</span>';
                    } else if (interviewData === 'Refused to comment' || interviewData === 'Refused') {
                        interviewHtml = '<span class="highlightable candidate-no-link">This candidate has refused an interview</span>';
                    } else {
                        interviewHtml = `<a class="highlightable candidate-link" href="${interviewData}" target="_blank">Candidate Interview</a>`;
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
                                ${webLink}
                                ${wikiLink}
                                ${interviewHtml}
                            </div>
                        </div>
                    `;
                }).join('');

                gridHTML += `
                    <div class="seat-card">
                        <h3 class="highlightable seat-title">${seatName}</h3>
                        <div class="seat-candidates-wrapper">
                            ${candidatesHTML}
                        </div>
                    </div>
                `;
            }

            candidatesContainer.innerHTML = gridHTML;
        }

    } catch (error) {
        if (candidatesContainer) {
            candidatesContainer.innerHTML = '<p class="highlightable candidate-message">Error loading candidate data. Please try again later.</p>';
        }
    }
};

document.addEventListener('DOMContentLoaded', loadCandidates);

document.addEventListener('click', () => {
    setTimeout(loadCandidates, 50);
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        setTimeout(loadCandidates, 50);
    }
});