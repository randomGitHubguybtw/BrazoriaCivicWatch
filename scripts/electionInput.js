const supabaseUrl = 'https://wytipsmhzgrtxhpojvjt.supabase.co';
const supabaseKey = 'sb_publishable_95Eiuz84ZNZxm83jTGrF-Q_GS6uViKk';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

const API_BASE = 'https://api.brazoriacivicwatch.org';
const meetingForm = document.querySelector('.js-meeting-form');

const savedPage = sessionStorage.getItem('electionPage') || '1';
let currentPage = parseInt(savedPage);

let city = sessionStorage.getItem('electionCity') || '';
let date = sessionStorage.getItem('electionDate') || '';
let link = sessionStorage.getItem('electionLink') || '';
let electionId = sessionStorage.getItem('electionId') || '';

async function checkAccess() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) window.location.replace("../webpages/login.html");
}

async function getToken() {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
}

const getColumnName = (cityStr) => {
    return cityStr.replace(/'/g, "").replace(/ /g, "_") + "_ballot_link";
};

const saveStepOneData = () => {
    const cityInputElem = document.querySelector('.js-city-input');
    const dateInputElem = document.querySelector('.js-date-input');
    const linkInputElem = document.querySelector('.js-ballot-link-input');
    
    if (cityInputElem) city = cityInputElem.value;
    if (dateInputElem) date = dateInputElem.value;
    if (linkInputElem) link = linkInputElem.value;
    if (date) electionId = date;
    
    sessionStorage.setItem('electionCity', city);
    sessionStorage.setItem('electionDate', date);
    sessionStorage.setItem('electionLink', link);
    sessionStorage.setItem('electionId', electionId);
};

const saveElectionToDB = async () => {
    if (!city || !date) return false;
    const column = getColumnName(city);
    const token = await getToken();
    try {
        const res = await fetch(`${API_BASE}/api/elections`);
        let existingElection = null;
        if (res.ok) {
            const elections = await res.json();
            existingElection = elections.find(el => el.date === date);
        }
        if (existingElection) {
            await fetch(`${API_BASE}/api/elections/${existingElection.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ [column]: link })
            });
        } else {
            await fetch(`${API_BASE}/api/elections`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ date: date, election_id: electionId, [column]: link })
            });
        }
        return true;
    } catch (err) {
        return false;
    }
};

const navigateTo = (page) => {
    currentPage = page;
    sessionStorage.setItem('electionPage', page);
    if (page === 1) renderStepOne();
    else if (page === 2) renderLocations();
    else if (page === 3) renderSeats();
};

const renderStepOne = () => {
    meetingForm.innerHTML = `
        <h3 class="section-heading" style="margin-top: 0;">Election Details</h3>
        
        <label class="form-label" for="cityInput">Location of Election:</label>
        <input list="cityOptions" id="cityInput" class="form-input js-city-input" autocomplete="off" placeholder="Search cities..." value="${city}" required>
        <datalist id="cityOptions">
          <option value="Alvin">
          <option value="Angleton">
          <option value="Bailey's Prairie">
          <option value="Bonney">
          <option value="Brazoria">
          <option value="Brazoria County">
          <option value="Brookside Village">
          <option value="Clute">
          <option value="Danbury">
          <option value="Freeport">
          <option value="Hillcrest Village">
          <option value="Holiday Lakes">
          <option value="Iowa Colony">
          <option value="Jones Creek">
          <option value="Lake Jackson">
          <option value="Liverpool">
          <option value="Manvel">
          <option value="Oyster Creek">
          <option value="Pearland">
          <option value="Quintana">
          <option value="Richwood">
          <option value="Sandy Point">
          <option value="Surfside">
          <option value="Sweeny">
          <option value="West Columbia">
        </datalist>
        
        <label class="form-label" for="dateInput">Date of Election:</label>
        <input type="date" id="dateInput" class="form-input js-date-input" value="${date}" required>
      
        <label class="form-label" for="transcriptionLinkInput">Ballot Link:</label>
        <input type="url" id="transcriptionLinkInput" class="form-input js-ballot-link-input" value="${link}">
        
        <div class="button-container">
          <button type="button" id="electionSaveButton" class="action-button js-hands-off">Next: Locations</button>
        </div>
    `;

    const cityInputElem = document.querySelector('.js-city-input');
    const dateInputElem = document.querySelector('.js-date-input');
    const linkInputElem = document.querySelector('.js-ballot-link-input');

    const checkExistingBallotLink = async () => {
        const c = cityInputElem.value;
        const d = dateInputElem.value;
        if (c && d) {
            try {
                const res = await fetch(`${API_BASE}/api/elections`);
                if (res.ok) {
                    const elections = await res.json();
                    const existingElection = elections.find(el => el.date === d);
                    if (existingElection) {
                        const column = getColumnName(c);
                        linkInputElem.value = existingElection[column] || '';
                    } else {
                        linkInputElem.value = '';
                    }
                }
            } catch (err) {}
        }
    };

    if (cityInputElem) cityInputElem.addEventListener('input', checkExistingBallotLink);
    if (dateInputElem) dateInputElem.addEventListener('input', checkExistingBallotLink);

    document.getElementById('electionSaveButton').addEventListener('click', async () => {
        saveStepOneData();
        if (!city || !date) return;
        await saveElectionToDB();
        navigateTo(2);
    });
};

const renderLocations = async () => {
    meetingForm.innerHTML = `
        <div style="margin-bottom: 15px;">
            <a href="#" class="default-link js-hands-off" id="backToStepOneLink">&larr; Back to Details</a>
        </div>
        <h3 class="section-heading" style="margin-top: 0;">Manage Polling Locations</h3>
        
        <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; justify-content: center;">
            <input type="text" id="newLocName" class="form-input" placeholder="Building Name (e.g., Lake Jackson Civic Center)">
            <input type="text" id="newLocAddress" class="form-input" placeholder="Full Address (e.g., 333 SH 332 Frontage Rd, Lake Jackson, TX 77566">
            <button type="button" id="addNewLocationBtn" class="action-button js-hands-off">Add Location</button>
        </div>

        <ul id="locationsPreviewList" style="margin-bottom: 20px; list-style-type: none; padding: 0;"></ul>

        <div class="button-container">
            <button type="button" id="nextToSeatsButton" class="action-button js-hands-off">Next: Manage Seats</button>
        </div>
    `;

    document.getElementById('backToStepOneLink').addEventListener('click', (e) => {
        e.preventDefault();
        navigateTo(1);
    });

    const locationsPreviewList = document.getElementById('locationsPreviewList');
    let currentLocationsId = null;
    let isParentCreated = false;

    const initParentLocation = async () => {
        try {
            const resPoll = await fetch(`${API_BASE}/api/polling_locations`);
            const pollingLocs = resPoll.ok ? await resPoll.json() : [];
            const existing = pollingLocs.find(pl => pl.election_id === electionId && pl.city === city);
            if (existing) {
                currentLocationsId = existing.locations_id;
                isParentCreated = true;
            } else {
                currentLocationsId = `loc_${city.replace(/[^a-zA-Z0-9]/g, '')}_${electionId}`;
            }
        } catch (err) {
        }
    };
    
    const loadLocations = async () => {
        if (!currentLocationsId) await initParentLocation();

        locationsPreviewList.innerHTML = '<li style="font-family: sans-serif; font-size: 14px;">Loading locations...</li>';
        try {
            const resAddr = await fetch(`${API_BASE}/api/polling_addresses`);
            const pollingAddrs = resAddr.ok ? await resAddr.json() : [];

            const myAddrs = pollingAddrs.filter(pa => pa.locations_id === currentLocationsId);

            if (myAddrs.length > 0) {
                locationsPreviewList.innerHTML = '';
                myAddrs.forEach(addr => {
                    const li = document.createElement('li');
                    li.style.padding = "8px";
                    li.style.borderBottom = "1px solid #ddd";
                    li.style.fontFamily = "sans-serif";
                    li.style.fontSize = "14px";
                    li.innerHTML = `
                        <strong>${addr.name}</strong> - ${addr.address}
                        <button type="button" class="delete-loc-btn js-hands-off" data-id="${addr.id}" style="background-color: var(--primary-color); padding: 4px 8px; font-size: 12px; border: none; border-radius: 4px; color: #fff; cursor: pointer; margin-left: 10px;">Delete</button>
                    `;
                    locationsPreviewList.appendChild(li);
                });

                document.querySelectorAll('.delete-loc-btn').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        e.preventDefault();
                        const token = await getToken();
                        const id = btn.getAttribute('data-id');
                        try {
                            const response = await fetch(`${API_BASE}/api/polling_addresses/${id}`, {
                                method: 'DELETE',
                                headers: { 'Authorization': `Bearer ${token}` }
                            });
                            if (response.ok) {
                                await loadLocations();
                            }
                        } catch (err) {}
                    });
                });
            } else {
                locationsPreviewList.innerHTML = '<li style="font-family: sans-serif; font-size: 14px;">No locations found for this election.</li>';
            }
        } catch (err) {
            locationsPreviewList.innerHTML = '<li style="font-family: sans-serif; font-size: 14px; color: #c62828;">Error connecting to API.</li>';
        }
    };

    await loadLocations();

    document.getElementById('addNewLocationBtn').addEventListener('click', async () => {
        const name = document.getElementById('newLocName').value;
        const address = document.getElementById('newLocAddress').value;

        if (!name || !address) return;

        const token = await getToken();

        try {
            if (!isParentCreated) {
                await fetch(`${API_BASE}/api/polling_locations`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ election_id: electionId, city: city, locations_id: currentLocationsId })
                });
                isParentCreated = true;
            }

            await fetch(`${API_BASE}/api/polling_addresses`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ name: name, address: address, locations_id: currentLocationsId })
            });

            document.getElementById('newLocName').value = '';
            document.getElementById('newLocAddress').value = '';
            await loadLocations(); 
        } catch (err) {}
    });

    document.getElementById('nextToSeatsButton').addEventListener('click', () => {
        navigateTo(3);
    });
};

const renderSeats = async () => {
    meetingForm.innerHTML = `
        <div style="margin-bottom: 15px;">
            <a href="#" class="default-link js-hands-off" id="backToLocationsLink">&larr; Back to Locations</a>
        </div>
        <h3 class="section-heading" style="margin-top: 0;">Manage Seats for ${city}</h3>
        
        <div style="margin-bottom: 20px;">
            <label for="scopeSelector" style="font-family: sans-serif; font-size: 14px; font-weight: bold;">Select Scope:</label>
            <select id="scopeSelector" class="form-input" style="width: auto; display: inline-block; margin-left: 10px;">
                <option value="local">Local</option>
                <option value="state">State</option>
                <option value="general">General</option>
                <option value="major">Major</option>
            </select>
        </div>

        <ul id="seatsPreviewList" style="margin-bottom: 20px; list-style-type: none; padding: 0;"></ul>
        
        <div id="addSeatFormContainer" style="display: none; border: 1px solid #ccc; padding: 15px; margin-bottom: 20px; border-radius: 4px;">
            <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                <input type="text" id="seatNameInput" class="form-input" placeholder="Seat Name" style="flex: 1; min-width: 150px;">
                <input type="text" id="challengerNameInput" class="form-input" placeholder="Candidate Name" style="flex: 1; min-width: 150px;">
                <input type="text" id="candidateWebsiteInput" class="form-input" placeholder="Candidate Website Home Page" style="flex: 1; min-width: 150px;">
                <input type="text" id="candidateWikipediaInput" class="form-input" placeholder="Wikipedia Article" style="flex: 1; min-width: 150px;">
                <label style="font-family: sans-serif; font-size: 14px; display: flex; align-items: center; gap: 5px;">
                    <input type="checkbox" id="incumbentInput"> Incumbent
                </label>
                <select id="partyInput" class="form-input" style="width: auto;">
                    <option value="Democratic">Democratic</option>
                    <option value="Republican">Republican</option>
                    <option value="Green">Green</option>
                    <option value="Libertarian">Libertarian</option>
                </select>
                <button type="button" id="saveNewSeatButton" class="action-button js-hands-off" style="width: auto; padding: 8px 12px;">Save</button>
                <button type="button" id="cancelAddSeatButton" class="action-button js-hands-off" style="width: auto; padding: 8px 12px; background-color: #c62828;">Cancel</button>
            </div>
        </div>

        <button type="button" id="showAddSeatButton" class="action-button js-hands-off" style="margin-bottom: 20px;">+ Add Seat</button>

        <div class="button-container">
            <button type="button" id="finalFinishButton" class="action-button js-hands-off">Save & Finish</button>
        </div>
    `;

    document.getElementById('backToLocationsLink').addEventListener('click', (e) => {
        e.preventDefault();
        navigateTo(2);
    });

    const seatsPreviewList = document.getElementById('seatsPreviewList');
    const scopeSelector = document.getElementById('scopeSelector');

    const loadSeats = async () => {
        seatsPreviewList.innerHTML = '<li style="font-family: sans-serif; font-size: 14px;">Loading seats...</li>';
        try {
            const response = await fetch(`${API_BASE}/api/seats`, { cache: 'no-store' });
            if (!response.ok) throw new Error("Failed to load seats");
            const allSeats = await response.json();
            
            const currentScope = scopeSelector.value;
            const seats = allSeats.filter(s => {
                if (s.election_id !== electionId) return false;
                if (s.scope !== currentScope) return false;
                if (currentScope === 'local' && s.city !== city) return false;
                return true;
            });

            if (seats && seats.length > 0) {
                seatsPreviewList.innerHTML = '';
                seats.forEach(seat => {
                    const li = document.createElement('li');
                    li.style.padding = "8px";
                    li.style.borderBottom = "1px solid #ddd";
                    li.style.fontFamily = "sans-serif";
                    li.style.fontSize = "14px";
                    li.innerHTML = `
                        <div class="highlightable">
                        <strong>${seat.seat_name}</strong> (${seat.party}) | Incumbent: ${seat.incumbent || 'No'} | Challenger: ${seat.name || 'None'} | Website: ${seat.website || 'None'} | Wikipedia: ${seat.wikipedia || 'None'}
                        </div>
                        <button type="button" class="delete-seat-btn js-hands-off" data-id="${seat.id}" style="background-color: var(--primary-color); padding: 4px 8px; font-size: 12px; border: none; border-radius: 4px; color: #fff; cursor: pointer; margin-left: 10px;">Delete</button>
                    `;
                    seatsPreviewList.appendChild(li);
                });

                document.querySelectorAll('.delete-seat-btn').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        e.preventDefault();
                        const token = await getToken();
                        const id = btn.getAttribute('data-id');
                        try {
                            const res = await fetch(`${API_BASE}/api/seats/${id}`, {
                                method: 'DELETE',
                                headers: { 'Authorization': `Bearer ${token}` }
                            });
                            if (res.ok) {
                                await loadSeats();
                            }
                        } catch (err) {}
                    });
                });
            } else {
                seatsPreviewList.innerHTML = `<li style="font-family: sans-serif; font-size: 14px;">No seats found for scope '${currentScope}'.</li>`;
            }
        } catch (err) {
            seatsPreviewList.innerHTML = '<li style="font-family: sans-serif; font-size: 14px; color: #c62828;">Error loading seats from API.</li>';
        }
    };

    scopeSelector.addEventListener('change', loadSeats);
    await loadSeats();

    document.getElementById('showAddSeatButton').addEventListener('click', () => {
        document.getElementById('addSeatFormContainer').style.display = 'block';
        document.getElementById('showAddSeatButton').style.display = 'none';
    });

    document.getElementById('cancelAddSeatButton').addEventListener('click', () => {
        document.getElementById('addSeatFormContainer').style.display = 'none';
        document.getElementById('showAddSeatButton').style.display = 'inline-block';
        document.getElementById('seatNameInput').value = '';
        document.getElementById('challengerNameInput').value = '';
        document.getElementById('candidateWebsiteInput').value = '';
        document.getElementById('candidateWikipediaInput').value = '';
        document.getElementById('incumbentInput').checked = false;
        document.getElementById('partyInput').value = 'Democratic';
    });

    document.getElementById('saveNewSeatButton').addEventListener('click', async () => {
        const seatName = document.getElementById('seatNameInput').value;
        const challengerName = document.getElementById('challengerNameInput').value;
        const candidateWebsite = document.getElementById('candidateWebsiteInput').value;
        const candidateWikipedia = document.getElementById('candidateWikipediaInput').value;
        const isIncumbent = document.getElementById('incumbentInput').checked;
        const party = document.getElementById('partyInput').value;
        const scope = document.getElementById('scopeSelector').value;
        
        if (!seatName) return;

        const safeCity = city.replace(/[^a-zA-Z0-9]/g, "");
        const safeSeatName = seatName.replace(/[^a-zA-Z0-9]/g, "");
        const generatedSeatId = `${safeCity}_${safeSeatName}`;
        const incumbentStr = isIncumbent ? 'Yes' : 'No';

        const token = await getToken();

        const resCheck = await fetch(`${API_BASE}/api/seats`, { cache: 'no-store' });
        if (resCheck.ok) {
            const allExistingSeats = await resCheck.json();
            
            const existing = allExistingSeats.find(s => {
                const matchesCore = (s.seat_name || '') === (seatName || '') &&
                                    (s.name || '') === (challengerName || '') &&
                                    (s.website || '') === (candidateWebsite || '') &&
                                    (s.wikipedia || '') === (candidateWikipedia || '') &&
                                    (s.party || '') === (party || '') &&
                                    (s.scope || '') === (scope || '') &&
                                    (s.incumbent || 'No') === incumbentStr;
                                    
                if (!matchesCore) return false;
                if (scope === 'local' && (s.city || '') !== (city || '')) return false;
                
                return true;
            });
            
            if (existing) {
                if (existing.election_id !== electionId) {
                    const confirmed = confirm(`Warning: this seat is already scheduled for ${existing.election_id}. Only continue if you are scheduling a special election.`);
                    if (!confirmed) return; 
                }
                await fetch(`${API_BASE}/api/seats/${existing.id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            }
        }

        await fetch(`${API_BASE}/api/seats`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
                election_id: electionId, 
                seat_id: generatedSeatId, 
                seat_name: seatName, 
                incumbent: incumbentStr, 
                name: challengerName, 
                party: party, 
                scope: scope, 
                city: city, 
                website: candidateWebsite, 
                wikipedia: candidateWikipedia
            })
        });

        document.getElementById('seatNameInput').value = '';
        document.getElementById('challengerNameInput').value = '';
        document.getElementById('candidateWebsiteInput').value = '';
        document.getElementById('candidateWikipediaInput').value = '';
        document.getElementById('incumbentInput').checked = false;
        document.getElementById('partyInput').value = 'Democratic';
        document.getElementById('addSeatFormContainer').style.display = 'none';
        document.getElementById('showAddSeatButton').style.display = 'inline-block';
        
        loadSeats();
    });

    document.getElementById('finalFinishButton').addEventListener('click', () => {
        sessionStorage.removeItem('electionPage');
        sessionStorage.removeItem('electionCity');
        sessionStorage.removeItem('electionDate');
        sessionStorage.removeItem('electionLink');
        sessionStorage.removeItem('electionId');
        meetingForm.innerHTML = `<h3 class="section-heading" style="color: #2e7d32; text-align: center; margin-top: 40px;">Successfully saved all election data!</h3>`;
        setTimeout(() => { window.location.reload(); }, 2000);
    });
};

if (currentPage === 1) renderStepOne();
else if (currentPage === 2) renderLocations();
else if (currentPage === 3) renderSeats();