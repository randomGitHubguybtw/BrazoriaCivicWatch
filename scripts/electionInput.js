const supabaseUrl = 'https://wytipsmhzgrtxhpojvjt.supabase.co';
const supabaseKey = 'sb_publishable_95Eiuz84ZNZxm83jTGrF-Q_GS6uViKk';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

const API_BASE = 'https://api.brazoriacivicwatch.org';
const meetingForm = document.querySelector('.js-meeting-form');

const savedPage = sessionStorage.getItem('electionPage') || '1';
let currentPage = parseInt(savedPage);

let originalDate = sessionStorage.getItem('originalElectionDate') || '';

const cleanSessionVar = (key) => {
    let val = sessionStorage.getItem(`election${key.charAt(0).toUpperCase() + key.slice(1)}`) || sessionStorage.getItem(key) || 'None';
    return val.startsWith('All ') ? 'None' : val;
};

let city = cleanSessionVar('city');
let isd = cleanSessionVar('isd');
let boardOfEd = cleanSessionVar('boardOfEd');
let congressDist = cleanSessionVar('congressDist');
let precinct = cleanSessionVar('precinct');
let stateRep = cleanSessionVar('stateRep');
let stateSen = cleanSessionVar('stateSen');
let college = cleanSessionVar('college');
let drainage = cleanSessionVar('drainage');
let hospital = cleanSessionVar('hospital');
let mud = cleanSessionVar('mud');
let navigation = cleanSessionVar('navigation');

let date = sessionStorage.getItem('electionDate') || '';
let electionId = sessionStorage.getItem('electionId') || '';
let isPrimary = sessionStorage.getItem('electionIsPrimary') === 'true';

if (!originalDate && date) {
    originalDate = date;
    sessionStorage.setItem('originalElectionDate', originalDate);
}

async function checkAccess() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) window.location.replace("../webpages/login.html");
}

async function getToken() {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
}

function checkSeatMatch(seatCity) {
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

    const baseKey = sessionMap[typePart] || 'city';
    const electionKey = `election${baseKey.charAt(0).toUpperCase() + baseKey.slice(1)}`;
    const userVal = (sessionStorage.getItem(electionKey) || sessionStorage.getItem(baseKey) || 'None').trim();

    if (userVal.startsWith('All ') || userVal === 'All') return true;
    return userVal === valPart;
}

document.addEventListener('click', (e) => {
    const clickedInput = e.target.closest('.js-elec-dropdown-input');
    if (clickedInput) {
        closeAllElecDropdowns(clickedInput);
        const box = clickedInput.closest('.js-elec-dropdown-box');
        const list = box.querySelector('.js-elec-dropdown-list');
        clickedInput.readOnly = false;
        clickedInput.removeAttribute('readonly');
        clickedInput.focus();
        if (list && !list.classList.contains('show')) {
            clickedInput.dataset.originalValue = clickedInput.value;
            clickedInput.value = '';
            list.style.display = 'block';
            list.classList.add('show');
            Array.from(list.children).forEach(li => li.style.display = 'block');
        }
        return;
    }

    const clickedItem = e.target.closest('.js-elec-dropdown-item');
    if (clickedItem) {
        const box = clickedItem.closest('.js-elec-dropdown-box');
        const input = box.querySelector('.js-elec-dropdown-input');
        input.value = clickedItem.textContent;
        closeAllElecDropdowns();
        input.dispatchEvent(new Event('change', { bubbles: true }));
        return;
    }

    if (!e.target.closest('.js-elec-dropdown-box')) {
        closeAllElecDropdowns();
    }
});

document.addEventListener('input', (e) => {
    if (e.target.classList.contains('js-elec-dropdown-input')) {
        const filterText = e.target.value.toLowerCase();
        const box = e.target.closest('.js-elec-dropdown-box');
        const list = box.querySelector('.js-elec-dropdown-list');
        if (list) {
            Array.from(list.children).forEach(li => {
                const itemText = li.textContent.toLowerCase();
                li.style.display = itemText.includes(filterText) ? 'block' : 'none';
            });
        }
    }
});

document.addEventListener('touchstart', (e) => {
  const touchInput = e.target.closest('.js-elec-dropdown-input');
  if (touchInput) {
    touchInput.readOnly = false;
    touchInput.removeAttribute('readonly');
  }
}, { passive: true });

function closeAllElecDropdowns(exceptInput = null) {
    document.querySelectorAll('.js-elec-dropdown-box').forEach(box => {
        const input = box.querySelector('.js-elec-dropdown-input');
        const list = box.querySelector('.js-elec-dropdown-list');
        if (input && list && input !== exceptInput) {
            list.style.display = 'none';
            list.classList.remove('show');
            input.setAttribute('readonly', 'true');
            input.readOnly = true;
            let isValid = false;
            Array.from(list.children).forEach(li => {
                if (li.textContent === input.value) {
                    isValid = true;
                }
            });
            if (!isValid && input.dataset.originalValue !== undefined) {
                input.value = input.dataset.originalValue;
            }
        }
    });
}

const saveStepOneData = () => {
    const dateInputElem = document.querySelector('.js-date-input');
    const isPrimaryElem = document.getElementById('isPrimaryInput');

    city = document.getElementById('elecCityInput')?.value || city;
    isd = document.getElementById('elecIsdInput')?.value || isd;
    boardOfEd = document.getElementById('elecBoardOfEdInput')?.value || boardOfEd;
    congressDist = document.getElementById('elecCongressDistInput')?.value || congressDist;
    precinct = document.getElementById('elecPrecinctInput')?.value || precinct;
    stateRep = document.getElementById('elecStateRepInput')?.value || stateRep;
    stateSen = document.getElementById('elecStateSenInput')?.value || stateSen;
    college = document.getElementById('elecCollegeInput')?.value || college;
    drainage = document.getElementById('elecDrainageInput')?.value || drainage;
    hospital = document.getElementById('elecHospitalInput')?.value || hospital;
    mud = document.getElementById('elecMudInput')?.value || mud;
    navigation = document.getElementById('elecNavigationInput')?.value || navigation;

    if (dateInputElem) date = dateInputElem.value;
    if (date) electionId = date;
    isPrimary = isPrimaryElem ? isPrimaryElem.checked : false;

    sessionStorage.setItem('electionCity', city);
    sessionStorage.setItem('electionIsd', isd);
    sessionStorage.setItem('electionBoardOfEd', boardOfEd);
    sessionStorage.setItem('electionCongressDist', congressDist);
    sessionStorage.setItem('electionPrecinct', precinct);
    sessionStorage.setItem('electionStateRep', stateRep);
    sessionStorage.setItem('electionStateSen', stateSen);
    sessionStorage.setItem('electionCollege', college);
    sessionStorage.setItem('electionDrainage', drainage);
    sessionStorage.setItem('electionHospital', hospital);
    sessionStorage.setItem('electionMud', mud);
    sessionStorage.setItem('electionNavigation', navigation);
    sessionStorage.setItem('electionDate', date);
    sessionStorage.setItem('electionId', electionId);
    sessionStorage.setItem('electionIsPrimary', isPrimary);
};

const saveElectionToDB = async () => {
    if (!date) return false;
    const token = await getToken();
    try {
        if (originalDate && originalDate !== date) {
            const resChange = await fetch(`${API_BASE}/api/elections/change-date`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ oldDate: originalDate, newDate: date })
            });
            if (!resChange.ok) {
                const errData = await resChange.json();
                alert("Could not change date: " + (errData.error || "Unknown error"));
                return false;
            }
            originalDate = date;
            sessionStorage.setItem('originalElectionDate', originalDate);
        }

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
                body: JSON.stringify({ isPrimary: isPrimary })
            });
        } else {
            await fetch(`${API_BASE}/api/elections`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ date: date, election_id: electionId, isPrimary: isPrimary })
            });
        }

        if (!originalDate) {
            originalDate = date;
            sessionStorage.setItem('originalElectionDate', originalDate);
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

const genOpts = (list) => {
    return list.map(item => `<li class="js-elec-dropdown-item highlightable" style="padding: 8px; cursor: pointer; border-bottom: 1px solid var(--secondary-color); color: var(--black-text-color); font-family: sans-serif;">${item}</li>`).join('');
};

const updateSeatCount = async () => {
    saveStepOneData();
    const countDisplay = document.getElementById('seatCountDisplay');
    if (!countDisplay) return;
    if (!date) {
        countDisplay.textContent = 'Please select a date to see seat count.';
        return;
    }
    try {
        const res = await fetch(`${API_BASE}/api/seats`);
        if (!res.ok) return;
        const allSeats = await res.json();
        const count = allSeats.filter(s => {
            if (s.election_id !== date) return false;
            if (s.scope === 'general' || s.scope === 'state' || s.scope === 'major') return true;
            if (s.scope === 'local') return checkSeatMatch(s.city);
            return false;
        }).length;
        countDisplay.textContent = `Total matching seats for this election: ${count}`;
    } catch (err) {
        countDisplay.textContent = 'Could not load seat count.';
    }
};

const renderStepOne = () => {
    const cityList = ["None", "Alvin", "Angleton", "Bailey's Prairie", "Bonney", "Brazoria", "Brookside Village", "Clute", "Danbury", "Freeport", "Hillcrest Village", "Holiday Lakes", "Iowa Colony", "Jones Creek", "Lake Jackson", "Liverpool", "Manvel", "Oyster Creek", "Pearland", "Quintana", "Richwood", "Sandy Point", "Surfside", "Sweeny", "West Columbia"];
    const isdList = ["None", "Alvin ISD", "Angleton ISD", "Brazosport ISD", "Columbia-Brazoria ISD", "Damon ISD", "Danbury ISD", "Friendswood ISD", "Pearland ISD", "Sweeny ISD"];
    const boardOfEdList = ["None", "District 7", "District 8"];
    const congressDistList = ["None", "District 9", "District 14", "District 22"];
    const precinctList = ["None", "Precinct 1", "Precinct 2", "Precinct 3", "Precinct 4"];
    const stateRepList = ["None", "District 25", "District 29"];
    const stateSenList = ["None", "District 11", "District 17"];
    const collegeList = ["None", "Alvin Community College District", "Brazosport College District"];
    const drainageList = ["None", "Angleton Drainage Dist.", "Brazoria Co. Conservation & Reclamation Dist.", "Danbury Drainage Dist.", "Iowa Colony Drainage Dist.", "Pearland Drainage Dist.", "Velasco Drainage Dist.", "West Brazoria County Drainage Dist."];
    const hospitalList = ["None", "Angleton-Danbury Hospital District", "Sweeny Hospital District", "West Columbia-Damon Hospital District"];
    const mudList = ["None", "Brazoria / Fort Bend MUD (#3)", "Brazoria County Fresh Water Supply District (#1)", "Brazoria County Fresh Water Supply District (#2)", "Brazoria County MUD (#2)", "Brazoria County MUD (#3)", "Brazoria County MUD (#6)", "Brazoria County MUD (#12)", "Brazoria County MUD (#13)", "Brazoria County MUD (#14)", "Brazoria County MUD (#15)", "Brazoria County MUD (#16)", "Brazoria County MUD (#17)", "Brazoria County MUD (#18)", "Brazoria County MUD (#19)", "Brazoria County MUD (#23)", "Brazoria County MUD (#24)", "Brazoria County MUD (#25)", "Brazoria County MUD (#28)", "Brazoria County MUD (#29)", "Brazoria County MUD (#30)", "Brazoria County MUD (#34)", "Brazoria County MUD (#35)", "Brazoria County MUD (#36)", "Brazoria County MUD (#38)", "Brazoria County MUD (#39)", "Brazoria County MUD (#40)", "Brazoria County MUD (#42)", "Brazoria County MUD (#43)", "Brazoria County MUD (#44)", "Brazoria County MUD (#47)", "Brazoria County MUD (#48)", "Brazoria County MUD (#49)", "Brazoria County MUD (#51)", "Brazoria County MUD (#53)", "Brazoria County MUD (#55)", "Brazoria County MUD (#56)", "Brazoria County MUD (#57)", "Brazoria County MUD (#61)", "Brazoria County MUD (#62)", "Brazoria County MUD (#64)", "Brazoria County MUD (#66)", "Brazoria County MUD (#67)", "Brazoria County MUD (#69)", "Brazoria County MUD (#70)", "Brazoria County MUD (#73)", "Brazoria County MUD (#81)", "Brazoria County MUD (#82)", "Brazoria County MUD (#83)", "Brazoria County MUD (#87)", "Brazoria County MUD (#88)", "Brazoria County MUD (#89)", "Brazoria County MUD (#92)", "Brazoria-Fort Bend County MUD (#1)", "Commodore Cove Improvement District", "Folletts Island Water Supply District", "Freeport MUD (#1)", "Harris-Brazoria Counties MUD (#509)", "Inactive Brazoria County MUD (#63)", "Inactive Brazoria County MUD (#65)", "Inactive Brazoria County MUD (#80)", "Inactive Rancho Isabella MUD", "Meridiana MUD (#31)", "Meridiana MUD (#32)", "Oak Manor MUD", "Rancho Isabella MUD", "Sedona Lakes MUD (#1)", "Shadow Creek Ranch MUD (#21)", "Shadow Creek Ranch MUD (#22)", "Shadow Creek Ranch MUD (#26)", "Treasure Island MUD", "Varner Creek Utility District"];
    const navigationList = ["None", "Precinct 1", "Precinct 2", "Precinct 3", "Precinct 4"];

    meetingForm.innerHTML = `
        <h3 class="section-heading" style="margin-top: 0; color: var(--black-text-color);">Election Details</h3>
        <p id="seatCountDisplay" style="text-align: center; font-weight: bold; color: var(--black-text-color); margin-bottom: 15px;">Loading seat count...</p>
        
        <label class="form-label" for="dateInput" style="color: var(--black-text-color);">Date of Election:</label>
        <input type="date" id="dateInput" class="form-input js-date-input" value="${date}" required style="margin-bottom: 20px; color: var(--black-text-color);">

        <label class="form-label" style="display: flex; align-items: center; gap: 10px; cursor: pointer; margin-bottom: 25px; color: var(--black-text-color);">
            <input type="checkbox" id="isPrimaryInput" style="transform: scale(1.5);" ${isPrimary ? 'checked' : ''}>
            Is Primary Election?
        </label>

        <label class="form-label" style="color: var(--black-text-color);">City Jurisdiction:</label>
        <div class="js-elec-dropdown-box" style="position: relative; width: 50vw; margin-bottom: 15px;">
            <input type="text" id="elecCityInput" placeholder="Select City..." class="form-input js-elec-dropdown-input" value="${city}" style="width: 100%; box-sizing: border-box; cursor: pointer; color: var(--black-text-color);" readonly>
            <ul class="js-elec-dropdown-list" style="display: none; position: absolute; z-index: 1000; width: 100%; max-height: 200px; overflow-y: auto; background-color: var(--primary-color); border: outset 3px var(--secondary-color); list-style-type: none; margin: 0; padding: 0; box-sizing: border-box;">
                ${genOpts(cityList)}
            </ul>
        </div>

        <label class="form-label" style="color: var(--black-text-color);">Independent School District:</label>
        <div class="js-elec-dropdown-box" style="position: relative; width: 50vw; margin-bottom: 15px;">
            <input type="text" id="elecIsdInput" placeholder="Select ISD..." class="form-input js-elec-dropdown-input" value="${isd}" style="width: 100%; box-sizing: border-box; cursor: pointer; color: var(--black-text-color);" readonly>
            <ul class="js-elec-dropdown-list" style="display: none; position: absolute; z-index: 1000; width: 100%; max-height: 200px; overflow-y: auto; background-color: var(--primary-color); border: outset 3px var(--secondary-color); list-style-type: none; margin: 0; padding: 0; box-sizing: border-box;">
                ${genOpts(isdList)}
            </ul>
        </div>

        <label class="form-label" style="color: var(--black-text-color);">State Board of Education District:</label>
        <div class="js-elec-dropdown-box" style="position: relative; width: 50vw; margin-bottom: 15px;">
            <input type="text" id="elecBoardOfEdInput" placeholder="Select Board of Education..." class="form-input js-elec-dropdown-input" value="${boardOfEd}" style="width: 100%; box-sizing: border-box; cursor: pointer; color: var(--black-text-color);" readonly>
            <ul class="js-elec-dropdown-list" style="display: none; position: absolute; z-index: 1000; width: 100%; max-height: 200px; overflow-y: auto; background-color: var(--primary-color); border: outset 3px var(--secondary-color); list-style-type: none; margin: 0; padding: 0; box-sizing: border-box;">
                ${genOpts(boardOfEdList)}
            </ul>
        </div>

        <label class="form-label" style="color: var(--black-text-color);">Congressional District:</label>
        <div class="js-elec-dropdown-box" style="position: relative; width: 50vw; margin-bottom: 15px;">
            <input type="text" id="elecCongressDistInput" placeholder="Select Congress District..." class="form-input js-elec-dropdown-input" value="${congressDist}" style="width: 100%; box-sizing: border-box; cursor: pointer; color: var(--black-text-color);" readonly>
            <ul class="js-elec-dropdown-list" style="display: none; position: absolute; z-index: 1000; width: 100%; max-height: 200px; overflow-y: auto; background-color: var(--primary-color); border: outset 3px var(--secondary-color); list-style-type: none; margin: 0; padding: 0; box-sizing: border-box;">
                ${genOpts(congressDistList)}
            </ul>
        </div>

        <label class="form-label" style="color: var(--black-text-color);">Justice of the Peace Precinct:</label>
        <div class="js-elec-dropdown-box" style="position: relative; width: 50vw; margin-bottom: 15px;">
            <input type="text" id="elecPrecinctInput" placeholder="Select Precinct..." class="form-input js-elec-dropdown-input" value="${precinct}" style="width: 100%; box-sizing: border-box; cursor: pointer; color: var(--black-text-color);" readonly>
            <ul class="js-elec-dropdown-list" style="display: none; position: absolute; z-index: 1000; width: 100%; max-height: 200px; overflow-y: auto; background-color: var(--primary-color); border: outset 3px var(--secondary-color); list-style-type: none; margin: 0; padding: 0; box-sizing: border-box;">
                ${genOpts(precinctList)}
            </ul>
        </div>

        <label class="form-label" style="color: var(--black-text-color);">State Representative District:</label>
        <div class="js-elec-dropdown-box" style="position: relative; width: 50vw; margin-bottom: 15px;">
            <input type="text" id="elecStateRepInput" placeholder="Select State Rep District..." class="form-input js-elec-dropdown-input" value="${stateRep}" style="width: 100%; box-sizing: border-box; cursor: pointer; color: var(--black-text-color);" readonly>
            <ul class="js-elec-dropdown-list" style="display: none; position: absolute; z-index: 1000; width: 100%; max-height: 200px; overflow-y: auto; background-color: var(--primary-color); border: outset 3px var(--secondary-color); list-style-type: none; margin: 0; padding: 0; box-sizing: border-box;">
                ${genOpts(stateRepList)}
            </ul>
        </div>

        <label class="form-label" style="color: var(--black-text-color);">State Senate District:</label>
        <div class="js-elec-dropdown-box" style="position: relative; width: 50vw; margin-bottom: 15px;">
            <input type="text" id="elecStateSenInput" placeholder="Select State Sen District..." class="form-input js-elec-dropdown-input" value="${stateSen}" style="width: 100%; box-sizing: border-box; cursor: pointer; color: var(--black-text-color);" readonly>
            <ul class="js-elec-dropdown-list" style="display: none; position: absolute; z-index: 1000; width: 100%; max-height: 200px; overflow-y: auto; background-color: var(--primary-color); border: outset 3px var(--secondary-color); list-style-type: none; margin: 0; padding: 0; box-sizing: border-box;">
                ${genOpts(stateSenList)}
            </ul>
        </div>

        <label class="form-label" style="color: var(--black-text-color);">College District:</label>
        <div class="js-elec-dropdown-box" style="position: relative; width: 50vw; margin-bottom: 15px;">
            <input type="text" id="elecCollegeInput" placeholder="Select College District..." class="form-input js-elec-dropdown-input" value="${college}" style="width: 100%; box-sizing: border-box; cursor: pointer; color: var(--black-text-color);" readonly>
            <ul class="js-elec-dropdown-list" style="display: none; position: absolute; z-index: 1000; width: 100%; max-height: 200px; overflow-y: auto; background-color: var(--primary-color); border: outset 3px var(--secondary-color); list-style-type: none; margin: 0; padding: 0; box-sizing: border-box;">
                ${genOpts(collegeList)}
            </ul>
        </div>

        <label class="form-label" style="color: var(--black-text-color);">Drainage District:</label>
        <div class="js-elec-dropdown-box" style="position: relative; width: 50vw; margin-bottom: 15px;">
            <input type="text" id="elecDrainageInput" placeholder="Select Drainage District..." class="form-input js-elec-dropdown-input" value="${drainage}" style="width: 100%; box-sizing: border-box; cursor: pointer; color: var(--black-text-color);" readonly>
            <ul class="js-elec-dropdown-list" style="display: none; position: absolute; z-index: 1000; width: 100%; max-height: 200px; overflow-y: auto; background-color: var(--primary-color); border: outset 3px var(--secondary-color); list-style-type: none; margin: 0; padding: 0; box-sizing: border-box;">
                ${genOpts(drainageList)}
            </ul>
        </div>

        <label class="form-label" style="color: var(--black-text-color);">Hospital District:</label>
        <div class="js-elec-dropdown-box" style="position: relative; width: 50vw; margin-bottom: 15px;">
            <input type="text" id="elecHospitalInput" placeholder="Select Hospital District..." class="form-input js-elec-dropdown-input" value="${hospital}" style="width: 100%; box-sizing: border-box; cursor: pointer; color: var(--black-text-color);" readonly>
            <ul class="js-elec-dropdown-list" style="display: none; position: absolute; z-index: 1000; width: 100%; max-height: 200px; overflow-y: auto; background-color: var(--primary-color); border: outset 3px var(--secondary-color); list-style-type: none; margin: 0; padding: 0; box-sizing: border-box;">
                ${genOpts(hospitalList)}
            </ul>
        </div>

        <label class="form-label" style="color: var(--black-text-color);">Municipal Utility District (MUD):</label>
        <div class="js-elec-dropdown-box" style="position: relative; width: 50vw; margin-bottom: 15px;">
            <input type="text" id="elecMudInput" placeholder="Select MUD..." class="form-input js-elec-dropdown-input" value="${mud}" style="width: 100%; box-sizing: border-box; cursor: pointer; color: var(--black-text-color);" readonly>
            <ul class="js-elec-dropdown-list" style="display: none; position: absolute; z-index: 1000; width: 100%; max-height: 200px; overflow-y: auto; background-color: var(--primary-color); border: outset 3px var(--secondary-color); list-style-type: none; margin: 0; padding: 0; box-sizing: border-box;">
                ${genOpts(mudList)}
            </ul>
        </div>

        <label class="form-label" style="color: var(--black-text-color);">Navigation District:</label>
        <div class="js-elec-dropdown-box" style="position: relative; width: 50vw; margin-bottom: 15px;">
            <input type="text" id="elecNavigationInput" placeholder="Select Navigation District..." class="form-input js-elec-dropdown-input" value="${navigation}" style="width: 100%; box-sizing: border-box; cursor: pointer; color: var(--black-text-color);" readonly>
            <ul class="js-elec-dropdown-list" style="display: none; position: absolute; z-index: 1000; width: 100%; max-height: 200px; overflow-y: auto; background-color: var(--primary-color); border: outset 3px var(--secondary-color); list-style-type: none; margin: 0; padding: 0; box-sizing: border-box;">
                ${genOpts(navigationList)}
            </ul>
        </div>
        
        <div class="button-container">
          <button type="button" id="electionSaveButton" class="action-button js-hands-off" style="color: var(--black-text-color);">Next: Locations</button>
        </div>
    `;

    document.querySelectorAll('.js-elec-dropdown-input').forEach(input => {
        input.setAttribute('readonly', 'true');
        input.readOnly = true;
    });

    meetingForm.addEventListener('change', updateSeatCount);
    updateSeatCount();

    document.getElementById('electionSaveButton').addEventListener('click', async () => {
        saveStepOneData();
        if (!date) return;
        const success = await saveElectionToDB();
        if (success) {
            navigateTo(2);
        }
    });
};

const renderLocations = async () => {
    meetingForm.innerHTML = `
        <div style="margin-bottom: 15px;">
            <a href="#" class="default-link js-hands-off" id="backToStepOneLink" style="color: var(--black-text-color);">← Back to Details</a>
        </div>
        <h3 class="section-heading" style="margin-top: 0; color: var(--black-text-color);">Manage Polling Locations</h3>
        
        <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; justify-content: center; width: 50vw;">
            <input type="text" id="newLocName" class="form-input" placeholder="Building Name (e.g., Lake Jackson Civic Center)" style="width: 100%; box-sizing: border-box; color: var(--black-text-color);">
            <input type="text" id="newLocAddress" class="form-input" placeholder="Full Address (e.g., 333 SH 332 Frontage Rd, Lake Jackson, TX 77566" style="width: 100%; box-sizing: border-box; color: var(--black-text-color);">
            <button type="button" id="addNewLocationBtn" class="action-button js-hands-off" style="width: 100%; color: var(--black-text-color);">Add Location</button>
        </div>

        <ul id="locationsPreviewList" style="margin-bottom: 20px; list-style-type: none; padding: 0; width: 50vw;"></ul>

        <div class="button-container">
            <button type="button" id="nextToSeatsButton" class="action-button js-hands-off" style="color: var(--black-text-color);">Next: Manage Seats</button>
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
        } catch (err) {}
    };
    
    const loadLocations = async () => {
        if (!currentLocationsId) await initParentLocation();

        locationsPreviewList.innerHTML = '<li style="font-family: sans-serif; font-size: 14px; color: var(--black-text-color);">Loading locations...</li>';
        try {
            const resAddr = await fetch(`${API_BASE}/api/polling_addresses`);
            const pollingAddrs = resAddr.ok ? await resAddr.json() : [];

            const myAddrs = pollingAddrs.filter(pa => pa.locations_id === currentLocationsId);

            if (myAddrs.length > 0) {
                locationsPreviewList.innerHTML = '';
                myAddrs.forEach(addr => {
                    const li = document.createElement('li');
                    li.style.padding = "8px";
                    li.style.borderBottom = "1px solid var(--secondary-color)";
                    li.style.fontFamily = "sans-serif";
                    li.style.fontSize = "14px";
                    li.style.color = "var(--black-text-color)";
                    li.innerHTML = `
                        <strong>${addr.name}</strong> - ${addr.address}
                        <button type="button" class="edit-loc-btn js-hands-off" data-id="${addr.id}" data-name="${addr.name.replace(/"/g, '&quot;')}" data-address="${addr.address.replace(/"/g, '&quot;')}" style="background-color: var(--secondary-color); padding: 4px 8px; font-size: 12px; border: inset 2px var(--accent-color); border-radius: 4px; color: var(--black-text-color); cursor: pointer; margin-left: 10px;">Edit</button>
                        <button type="button" class="delete-loc-btn js-hands-off" data-id="${addr.id}" style="background-color: var(--primary-color); padding: 4px 8px; font-size: 12px; border: none; border-radius: 4px; color: var(--black-text-color); cursor: pointer; margin-left: 5px;">Delete</button>
                    `;
                    locationsPreviewList.appendChild(li);
                });

                document.querySelectorAll('.edit-loc-btn').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        e.preventDefault();
                        const token = await getToken();
                        const id = btn.getAttribute('data-id');
                        document.getElementById('newLocName').value = btn.getAttribute('data-name');
                        document.getElementById('newLocAddress').value = btn.getAttribute('data-address');
                        try {
                            await fetch(`${API_BASE}/api/polling_addresses/${id}`, {
                                method: 'DELETE',
                                headers: { 'Authorization': `Bearer ${token}` }
                            });
                            await loadLocations();
                        } catch (err) {}
                    });
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
                locationsPreviewList.innerHTML = '<li style="font-family: sans-serif; font-size: 14px; color: var(--black-text-color);">No locations found for this election.</li>';
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
            <a href="#" class="default-link js-hands-off" id="backToLocationsLink" style="color: var(--black-text-color);">← Back to Locations</a>
        </div>
        <h3 class="section-heading" style="margin-top: 0; color: var(--black-text-color);">Manage Seats for Election Date: ${date}</h3>
        
        <div style="margin-bottom: 20px;">
            <label for="scopeSelector" style="font-family: sans-serif; font-size: 14px; font-weight: bold; color: var(--black-text-color);">Select Scope:</label>
            <select id="scopeSelector" class="form-input" style="width: auto; display: inline-block; margin-left: 10px; color: var(--black-text-color);">
                <option value="local">Local</option>
                <option value="general">General</option>
            </select>
        </div>

        <ul id="seatsPreviewList" style="margin-bottom: 20px; list-style-type: none; padding: 0; width: 50vw;"></ul>
        
        <div id="addSeatFormContainer" style="display: none; border: 1px solid var(--accent-color); padding: 15px; margin-bottom: 20px; border-radius: 4px; width: 50vw; box-sizing: border-box;">
            <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                
                <select id="districtTypeInput" class="form-input" style="width: auto; color: var(--black-text-color);">
                    <option value="City">City</option>
                    <option value="ISD">ISD</option>
                    <option value="Board of Education">Board of Education</option>
                    <option value="Congressional">Congressional</option>
                    <option value="Justice of the Peace">Justice of the Peace</option>
                    <option value="State Representative">State Representative</option>
                    <option value="State Senate">State Senate</option>
                    <option value="College">College</option>
                    <option value="Drainage">Drainage</option>
                    <option value="Hospital">Hospital</option>
                    <option value="MUD">MUD</option>
                    <option value="Navigation">Navigation</option>
                </select>

                <input type="text" id="seatNameInput" class="form-input" placeholder="Seat Name" style="flex: 1; min-width: 150px; color: var(--black-text-color);">
                <input type="text" id="challengerNameInput" class="form-input" placeholder="Candidate Name" style="flex: 1; min-width: 150px; color: var(--black-text-color);">
                <input type="text" id="candidateWebsiteInput" class="form-input" placeholder="Candidate Website Home Page" style="flex: 1; min-width: 150px; color: var(--black-text-color);">
                <input type="text" id="candidateWikipediaInput" class="form-input" placeholder="Wikipedia Article" style="flex: 1; min-width: 150px; color: var(--black-text-color);">
                
                <input list="interviewOptions" id="interviewedInput" class="form-input" placeholder="Interview link" autocomplete="off" style="flex: 1; min-width: 150px; color: var(--black-text-color);">
                <datalist id="interviewOptions">
                    <option value="None scheduled">
                    <option value="Refused to comment">
                    <option value="Scheduled">
                </datalist>

                <label style="font-family: sans-serif; font-size: 14px; display: flex; align-items: center; gap: 5px; color: var(--black-text-color);">
                    <input type="checkbox" id="incumbentInput"> Incumbent
                </label>
                
                <input list="partyOptionsList" id="partyInput" class="form-input" placeholder="Party" style="width: auto; color: var(--black-text-color);">
                <datalist id="partyOptionsList">
                    <option value="Democratic">
                    <option value="Republican">
                    <option value="Green">
                    <option value="Libertarian">
                    <option value="Nonpartisan">
                    <option value="Independent">
                </datalist>
                
                <button type="button" id="saveNewSeatButton" class="action-button js-hands-off" style="width: auto; padding: 8px 12px; color: var(--black-text-color);">Save</button>
                <button type="button" id="cancelAddSeatButton" class="action-button js-hands-off" style="width: auto; padding: 8px 12px; background-color: #c62828; color: var(--black-text-color); border: none;">Cancel</button>
            </div>
        </div>

        <button type="button" id="showAddSeatButton" class="action-button js-hands-off" style="margin-bottom: 20px; color: var(--black-text-color);">+ Add Seat</button>

        <div class="button-container">
            <button type="button" id="finalFinishButton" class="action-button js-hands-off" style="color: var(--black-text-color);">Save & Finish</button>
        </div>
    `;

    document.getElementById('backToLocationsLink').addEventListener('click', (e) => {
        e.preventDefault();
        navigateTo(2);
    });

    const seatsPreviewList = document.getElementById('seatsPreviewList');
    const scopeSelector = document.getElementById('scopeSelector');
    const districtTypeInput = document.getElementById('districtTypeInput');

    const loadSeats = async () => {
        seatsPreviewList.innerHTML = '<li style="font-family: sans-serif; font-size: 14px; color: var(--black-text-color);">Loading seats...</li>';
        try {
            const response = await fetch(`${API_BASE}/api/seats`, { cache: 'no-store' });
            if (!response.ok) throw new Error("Failed to load seats");
            const allSeats = await response.json();
            
            const currentScope = scopeSelector.value;

            const seats = allSeats.filter(s => {
                if (s.election_id !== electionId) return false;
                if (s.scope !== currentScope) return false;
                if (currentScope === 'local') {
                    return checkSeatMatch(s.city);
                }
                return true;
            });

            if (seats && seats.length > 0) {
                seatsPreviewList.innerHTML = '';
                seats.forEach(seat => {
                    const li = document.createElement('li');
                    li.style.padding = "8px";
                    li.style.borderBottom = "1px solid var(--secondary-color)";
                    li.style.fontFamily = "sans-serif";
                    li.style.fontSize = "14px";
                    li.style.color = "var(--black-text-color)";
                    
                    let districtDisplay = seat.scope === 'general' ? 'County' : seat.city;
                    if (seat.scope === 'local' && seat.city && seat.city.includes('_')) {
                        const firstIdx = seat.city.indexOf('_');
                        const dType = seat.city.substring(0, firstIdx);
                        const dVal = seat.city.substring(firstIdx + 1);
                        districtDisplay = `${dType} (${dVal})`;
                    }

                    li.innerHTML = `
                        <div class="highlightable">
                        <strong>District: ${districtDisplay}</strong><br/>
                        <strong>${seat.seat_name}</strong> (${seat.party}) | Incumbent: ${seat.incumbent || 'No'} | Challenger: ${seat.name || 'None'} | Website: ${seat.website || 'None'} | Wikipedia: ${seat.wikipedia || 'None'} | Interview: ${seat.interviewed || 'None'}
                        </div>
                        <button type="button" class="edit-seat-btn js-hands-off" data-id="${seat.id}" style="background-color: var(--secondary-color); padding: 4px 8px; font-size: 12px; border: inset 2px var(--accent-color); border-radius: 4px; color: var(--black-text-color); cursor: pointer; margin-top: 10px;">Edit</button>
                        <button type="button" class="delete-seat-btn js-hands-off" data-id="${seat.id}" style="background-color: var(--primary-color); padding: 4px 8px; font-size: 12px; border: none; border-radius: 4px; color: var(--black-text-color); cursor: pointer; margin-top: 10px; margin-left: 5px;">Delete</button>
                    `;
                    seatsPreviewList.appendChild(li);
                });

                document.querySelectorAll('.edit-seat-btn').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        e.preventDefault();
                        const id = parseInt(btn.getAttribute('data-id'));
                        const seatToEdit = seats.find(s => s.id === id);
                        if (seatToEdit) {
                            document.getElementById('addSeatFormContainer').style.display = 'block';
                            document.getElementById('showAddSeatButton').style.display = 'none';
                            
                            document.getElementById('seatNameInput').value = seatToEdit.seat_name || '';
                            document.getElementById('challengerNameInput').value = seatToEdit.name || '';
                            document.getElementById('candidateWebsiteInput').value = seatToEdit.website || '';
                            document.getElementById('candidateWikipediaInput').value = seatToEdit.wikipedia || '';
                            document.getElementById('interviewedInput').value = seatToEdit.interviewed || '';
                            document.getElementById('incumbentInput').checked = (seatToEdit.incumbent === 'Yes');
                            document.getElementById('partyInput').value = seatToEdit.party || '';
                            
                            document.getElementById('scopeSelector').value = seatToEdit.scope || 'local';
                            if (seatToEdit.scope === 'general') {
                                document.getElementById('districtTypeInput').style.display = 'none';
                            } else {
                                document.getElementById('districtTypeInput').style.display = 'inline-block';
                                document.getElementById('districtTypeInput').value = seatToEdit.district_type || 'City';
                            }
                            
                            const token = await getToken();
                            await fetch(`${API_BASE}/api/seats/${id}`, {
                                method: 'DELETE',
                                headers: { 'Authorization': `Bearer ${token}` }
                            });
                            await loadSeats();
                        }
                    });
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
                seatsPreviewList.innerHTML = `<li style="font-family: sans-serif; font-size: 14px; color: var(--black-text-color);">No seats found for scope '${currentScope}'.</li>`;
            }
        } catch (err) {
            seatsPreviewList.innerHTML = '<li style="font-family: sans-serif; font-size: 14px; color: #c62828;">Error loading seats from API.</li>';
        }
    };

    scopeSelector.addEventListener('change', () => {
        if (scopeSelector.value === 'general') {
            districtTypeInput.style.display = 'none';
        } else {
            districtTypeInput.style.display = 'inline-block';
        }
        loadSeats();
    });

    if (scopeSelector.value === 'general') {
        districtTypeInput.style.display = 'none';
    }

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
        document.getElementById('interviewedInput').value = '';
        document.getElementById('incumbentInput').checked = false;
        document.getElementById('partyInput').value = '';
    });

    document.getElementById('saveNewSeatButton').addEventListener('click', async () => {
        const seatName = document.getElementById('seatNameInput').value;
        const challengerName = document.getElementById('challengerNameInput').value;
        const candidateWebsite = document.getElementById('candidateWebsiteInput').value;
        const candidateWikipedia = document.getElementById('candidateWikipediaInput').value;
        const interviewed = document.getElementById('interviewedInput').value;
        const isIncumbent = document.getElementById('incumbentInput').checked;
        const party = document.getElementById('partyInput').value || 'Unknown';
        const scope = document.getElementById('scopeSelector').value;
        const districtType = scope === 'general' ? 'General' : districtTypeInput.value;
        
        if (!seatName) return;

        const mapTypeToSession = {
            "City": city,
            "ISD": isd,
            "Board of Education": boardOfEd,
            "Congressional": congressDist,
            "Justice of the Peace": precinct,
            "State Representative": stateRep,
            "State Senate": stateSen,
            "College": college,
            "Drainage": drainage,
            "Hospital": hospital,
            "MUD": mud,
            "Navigation": navigation
        };

        const actualDistrictValue = scope === 'general' ? 'County' : `${districtType}_${mapTypeToSession[districtType]}`;

        const safeCity = actualDistrictValue.replace(/[^a-zA-Z0-9]/g, "");
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
                                    (s.interviewed || '') === (interviewed || '') &&
                                    (s.party || '') === (party || '') &&
                                    (s.scope || '') === (scope || '') &&
                                    (s.incumbent || 'No') === incumbentStr;
                                    
                if (!matchesCore) return false;
                
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
                city: actualDistrictValue, 
                website: candidateWebsite, 
                wikipedia: candidateWikipedia,
                interviewed: interviewed,
                district_type: districtType
            })
        });

        document.getElementById('seatNameInput').value = '';
        document.getElementById('challengerNameInput').value = '';
        document.getElementById('candidateWebsiteInput').value = '';
        document.getElementById('candidateWikipediaInput').value = '';
        document.getElementById('interviewedInput').value = '';
        document.getElementById('incumbentInput').checked = false;
        document.getElementById('partyInput').value = '';
        document.getElementById('addSeatFormContainer').style.display = 'none';
        document.getElementById('showAddSeatButton').style.display = 'inline-block';
        
        loadSeats();
    });

    document.getElementById('finalFinishButton').addEventListener('click', () => {
        sessionStorage.removeItem('electionPage');
        sessionStorage.removeItem('electionCity');
        sessionStorage.removeItem('electionIsd');
        sessionStorage.removeItem('electionBoardOfEd');
        sessionStorage.removeItem('electionCongressDist');
        sessionStorage.removeItem('electionPrecinct');
        sessionStorage.removeItem('electionStateRep');
        sessionStorage.removeItem('electionStateSen');
        sessionStorage.removeItem('electionCollege');
        sessionStorage.removeItem('electionDrainage');
        sessionStorage.removeItem('electionHospital');
        sessionStorage.removeItem('electionMud');
        sessionStorage.removeItem('electionNavigation');
        sessionStorage.removeItem('electionDate');
        sessionStorage.removeItem('electionId');
        sessionStorage.removeItem('electionIsPrimary');
        sessionStorage.removeItem('originalElectionDate');
        meetingForm.innerHTML = `<h3 class="section-heading" style="color: #2e7d32; text-align: center; margin-top: 40px;">Successfully saved all election data!</h3>`;
        setTimeout(() => { window.location.reload(); }, 2000);
    });
};

if (currentPage === 1) renderStepOne();
else if (currentPage === 2) renderLocations();
else if (currentPage === 3) renderSeats();