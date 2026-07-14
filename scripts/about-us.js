import { masterVolunteers } from '../data/volunteers.js';

async function populateCountingSection() {
    const container = document.querySelector('.js-counting-section');
    if (!container) return;

    try {
        const summariesResponse = await fetch('https://api.brazoriacivicwatch.org/api/summaries');
        if (!summariesResponse.ok) throw new Error('Failed to fetch summaries');
        const summariesData = await summariesResponse.json();
        const summariesCount = summariesData.length;

        const donationsResponse = await fetch('https://api.brazoriacivicwatch.org/api/donations');
        if (!donationsResponse.ok) throw new Error('Failed to fetch donations');
        const donationsData = await donationsResponse.json();
        const totalDonations = donationsData.reduce((sum, donation) => sum + (parseFloat(donation.amount) || 0), 0);

        const seatsResponse = await fetch('https://api.brazoriacivicwatch.org/api/seats');
        if (!seatsResponse.ok) throw new Error('Failed to fetch seats');
        const seatsData = await seatsResponse.json();
        
        const interviewedCount = seatsData.filter(seat => {
            return seat.interviewed && (seat.interviewed.includes('http://') || seat.interviewed.includes('https://'));
        }).length;

        const volunteersCount = masterVolunteers.length;

        const htmlContent = `
          Since launch we have...
          <div class="content-column" style="grid-template-columns: 1fr; margin-top: 20px;">
            <div><p>Interviewed <p style="color: var(--accent-color)">${interviewedCount}</p>Political Candidates</div>
            <div><p>Summarized<p style="color: var(--accent-color)">${summariesCount}</p>Meetings</div>
            <div><p>Hired<p style="color: var(--accent-color)">${volunteersCount}</p>Volunteers</div>
            <div><p>Received<p style="color: var(--accent-color)">$${totalDonations.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>In Donations</div>
            <a class="default-link" href="https://forms.gle/oTUAUNgc3TBwZozB6" target="_blank">Volunteer to increase these numbers!</a>
          </div>
        `;

        container.innerHTML = htmlContent;
    } catch (error) {
        container.innerHTML = `<p>Error loading statistics.</p>`;
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', populateCountingSection);
} else {
    populateCountingSection();
}