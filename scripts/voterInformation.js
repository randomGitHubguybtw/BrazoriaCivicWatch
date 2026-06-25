import { fixDate } from './utils/fixDate.js';

const API_BASE = 'https://api.brazoriacivicwatch.org';
const addressesContainer = document.querySelector('.js-addresses-container');

const loadVoterInformation = async () => {
    try {
        const userCity = sessionStorage.getItem('city');
        
        if (!userCity) {
            if (addressesContainer) {
                addressesContainer.innerHTML = '<p class="highlightable voter-message">Please set your city to view your specific polling locations.</p>';
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
            if (addressesContainer) addressesContainer.innerHTML = '<p class="highlightable voter-message">No upcoming elections found.</p>';
            return;
        }

        const targetElectionId = sessionStorage.getItem('nextElection') || sessionStorage.getItem('targetElection') || upcoming[0].election_id;

        const dateDisplay = document.querySelector('.election-date');
        if (dateDisplay) {
            dateDisplay.innerHTML = fixDate(targetElectionId);
        }

        const [locationsResponse, addressesResponse] = await Promise.all([
            fetch(`${API_BASE}/api/polling_locations`),
            fetch(`${API_BASE}/api/polling_addresses`)
        ]);

        if (!locationsResponse.ok || !addressesResponse.ok) throw new Error();

        const allLocations = await locationsResponse.json();
        const allAddresses = await addressesResponse.json();

        const cityLocations = allLocations.filter(loc => 
            loc.election_id === targetElectionId && (isAllCities || loc.city === userCity)
        );

        if (cityLocations.length === 0) {
            if (addressesContainer) {
                const emptyText = isAllCities ? 'any area' : userCity;
                addressesContainer.innerHTML = `<p class="highlightable voter-message">No polling locations currently assigned for ${emptyText}.</p>`;
            }
            return;
        }

        const validLocationIds = new Set(cityLocations.map(loc => loc.locations_id));

        const pollingAddresses = allAddresses.filter(addr => validLocationIds.has(addr.locations_id));

        if (pollingAddresses.length === 0) {
            if (addressesContainer) addressesContainer.innerHTML = '<p class="highlightable voter-message">No physical addresses listed for these polling locations yet.</p>';
            return;
        }

        if (addressesContainer) {
            addressesContainer.classList.add('voter-addresses-grid');

            const addressesHTML = pollingAddresses.map(addr => `
                <div class="polling-card">
                    <h3 class="highlightable polling-card-title">${addr.name}</h3>
                    <p class="highlightable polling-card-address">${addr.address}</p>
                    <a class="highlightable polling-card-btn" 
                       href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr.name + ' ' + addr.address)}" 
                       target="_blank">
                       Get Directions
                    </a>
                </div>
            `).join('');

            addressesContainer.innerHTML = `
                <h2 class="highlightable voter-addresses-title">Vote at:</h2>
                ${addressesHTML}
            `;
        }

    } catch (error) {
        if (addressesContainer) {
            addressesContainer.innerHTML = '<p class="highlightable voter-message">Error loading polling data. Please try again later.</p>';
        }
    }
};

document.addEventListener('DOMContentLoaded', loadVoterInformation);

document.addEventListener('click', () => {
    setTimeout(loadVoterInformation, 50);
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        setTimeout(loadVoterInformation, 50);
    }
});