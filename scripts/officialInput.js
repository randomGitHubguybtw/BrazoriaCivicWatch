const supabaseUrl = 'https://wytipsmhzgrtxhpojvjt.supabase.co';
const supabaseKey = 'sb_publishable_95Eiuz84ZNZxm83jTGrF-Q_GS6uViKk';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

const API_BASE = 'https://api.brazoriacivicwatch.org';
const meetingForm = document.querySelector('.js-meeting-form');

const savedPage = sessionStorage.getItem('electionPage') || '1';
let currentPage = parseInt(savedPage);
let showArchivedAdmin = false;

async function getToken() {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
}

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

function checkJurisdictionMatch(jurisdictionStr) {
    if (!jurisdictionStr) return false;
    if (jurisdictionStr === 'County') return true;

    const firstUnderscore = jurisdictionStr.indexOf('_');
    let typePart = 'City';
    let valPart = jurisdictionStr;

    if (firstUnderscore !== -1) {
        typePart = jurisdictionStr.substring(0, firstUnderscore).trim();
        valPart = jurisdictionStr.substring(firstUnderscore + 1).trim();
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
};

const navigateTo = (page) => {
    currentPage = page;
    sessionStorage.setItem('electionPage', page);
    if (page === 1) renderStepOne();
    else if (page === 2) renderOfficials();
};

const genOpts = (list) => {
    return list.map(item => `<li class="js-elec-dropdown-item highlightable" style="padding: 8px; cursor: pointer; border-bottom: 1px solid var(--secondary-color); color: var(--black-text-color); font-family: sans-serif;">${item}</li>`).join('');
};

async function fetchFile(names) {
    for (let name of names) {
        try {
            let res = await fetch(name);
            if (res.ok) return await res.json();
        } catch(e) {}
    }
    return null;
}

function doBBoxesIntersect(b1, b2) {
    return !(b2[0] > b1[2] || b2[2] < b1[0] || b2[1] > b1[3] || b2[3] < b1[1]);
}

async function loadDynamicDistricts() {
    try {
        const countiesRes = await fetchFile(['./locationJSON/counties.json', 'counties.json', '../counties.json', '/counties.json']);
        const congressRes = await fetchFile(['./locationJSON/congressDistricts.json', 'congressDistricts.json', '../locationJSON/congressDistricts.json']);
        const senateRes = await fetchFile(['./locationJSON/stateSenDistricts.json', 'stateSenDistricts.json', '../locationJSON/stateSenDistricts.json']);
        const repRes = await fetchFile(['./locationJSON/stateRepDistricts.json', 'stateRepDistricts.json', '../locationJSON/stateRepDistricts.json']);

        if (!countiesRes || !window.turf) return;

        const brazoria = countiesRes.features.find(f => f.properties && String(f.properties.CNTY_NM || '').toLowerCase() === 'brazoria');
        if (!brazoria || !brazoria.geometry) return;

        const brazoriaBbox = window.turf.bbox(brazoria);

        const getDistName = (feat) => {
            let p = feat.properties;
            if (!p) return 'Unknown';
            if (p.District) return p.District;
            if (p.DIST_NBR) return p.DIST_NBR;
            if (p.DISTRICT) return p.DISTRICT;
            if (p.DIST_NM) return p.DIST_NM;
            for (let k in p) {
                if (k.toUpperCase().includes('DIST')) return p[k];
            }
            return 'Unknown';
        };

        const processGeo = (geoData, inputId) => {
            if (!geoData || !geoData.features) return;
            const valid = [];
            
            geoData.features.forEach(f => {
                if (!f.geometry) return;
                
                const featureBbox = window.turf.bbox(f);
                
                if (doBBoxesIntersect(brazoriaBbox, featureBbox)) {
                    try {
                        const overlap = window.turf.intersect(brazoria, f);
                        if (overlap && window.turf.area(overlap) > 10000) {
                            let name = getDistName(f);
                            if (!valid.includes(name)) valid.push(name);
                        }
                    } catch (err) {
                        if (window.turf.booleanIntersects(brazoria, f)) {
                             let name = getDistName(f);
                             if (!valid.includes(name)) valid.push(name);
                        }
                    }
                }
            });
            
            valid.sort((a, b) => {
                let na = parseInt(String(a).replace(/\D/g, '')) || 0;
                let nb = parseInt(String(b).replace(/\D/g, '')) || 0;
                return na - nb;
            });

            const input = document.getElementById(inputId);
            if (input && input.nextElementSibling) {
                const ul = input.nextElementSibling;
                const opts = ['None', ...valid.map(v => `District ${v}`)];
                ul.innerHTML = genOpts(opts);
            }
        };

        setTimeout(() => processGeo(congressRes, 'elecCongressDistInput'), 10);
        setTimeout(() => processGeo(senateRes, 'elecStateSenInput'), 50);
        setTimeout(() => processGeo(repRes, 'elecStateRepInput'), 100);

    } catch (e) {
        console.error("Error dynamically loading districts:", e);
    }
}

const renderStepOne = () => {
    const cityList = ["None", "Alvin", "Angleton", "Bailey's Prairie", "Bonney", "Brazoria", "Brookside Village", "Clute", "Danbury", "Freeport", "Hillcrest Village", "Holiday Lakes", "Iowa Colony", "Jones Creek", "Lake Jackson", "Liverpool", "Manvel", "Oyster Creek", "Pearland", "Quintana", "Richwood", "Sandy Point", "Surfside", "Sweeny", "West Columbia"];
    const isdList = ["None", "Alvin ISD", "Angleton ISD", "Brazosport ISD", "Columbia-Brazoria ISD", "Damon ISD", "Danbury ISD", "Friendswood ISD", "Pearland ISD", "Sweeny ISD"];
    const boardOfEdList = ["None", "District 7", "District 8"];
    const congressDistList = ["Loading Districts..."];
    const precinctList = ["None", "Precinct 1", "Precinct 2", "Precinct 3", "Precinct 4"];
    const stateRepList = ["Loading Districts..."];
    const stateSenList = ["Loading Districts..."];
    const collegeList = ["None", "Alvin Community College District", "Brazosport College District"];
    const drainageList = ["None", "Angleton Drainage Dist.", "Brazoria Co. Conservation & Reclamation Dist.", "Danbury Drainage Dist.", "Iowa Colony Drainage Dist.", "Pearland Drainage Dist.", "Velasco Drainage Dist.", "West Brazoria County Drainage Dist."];
    const hospitalList = ["None", "Angleton-Danbury Hospital District", "Sweeny Hospital District", "West Columbia-Damon Hospital District"];
    const mudList = ["None", "Brazoria / Fort Bend MUD (#3)", "Brazoria County Fresh Water Supply District (#1)", "Brazoria County Fresh Water Supply District (#2)", "Brazoria County MUD (#2)", "Brazoria County MUD (#3)", "Brazoria County MUD (#6)", "Brazoria County MUD (#12)", "Brazoria County MUD (#13)", "Brazoria County MUD (#14)", "Brazoria County MUD (#15)", "Brazoria County MUD (#16)", "Brazoria County MUD (#17)", "Brazoria County MUD (#18)", "Brazoria County MUD (#19)", "Brazoria County MUD (#23)", "Brazoria County MUD (#24)", "Brazoria County MUD (#25)", "Brazoria County MUD (#28)", "Brazoria County MUD (#29)", "Brazoria County MUD (#30)", "Brazoria County MUD (#34)", "Brazoria County MUD (#35)", "Brazoria County MUD (#36)", "Brazoria County MUD (#38)", "Brazoria County MUD (#39)", "Brazoria County MUD (#40)", "Brazoria County MUD (#42)", "Brazoria County MUD (#43)", "Brazoria County MUD (#44)", "Brazoria County MUD (#47)", "Brazoria County MUD (#48)", "Brazoria County MUD (#49)", "Brazoria County MUD (#51)", "Brazoria County MUD (#53)", "Brazoria County MUD (#55)", "Brazoria County MUD (#56)", "Brazoria County MUD (#57)", "Brazoria County MUD (#61)", "Brazoria County MUD (#62)", "Brazoria County MUD (#64)", "Brazoria County MUD (#66)", "Brazoria County MUD (#67)", "Brazoria County MUD (#69)", "Brazoria County MUD (#70)", "Brazoria County MUD (#73)", "Brazoria County MUD (#81)", "Brazoria County MUD (#82)", "Brazoria County MUD (#83)", "Brazoria County MUD (#87)", "Brazoria County MUD (#88)", "Brazoria County MUD (#89)", "Brazoria County MUD (#92)", "Brazoria-Fort Bend County MUD (#1)", "Commodore Cove Improvement District", "Folletts Island Water Supply District", "Freeport MUD (#1)", "Harris-Brazoria Counties MUD (#509)", "Inactive Brazoria County MUD (#63)", "Inactive Brazoria County MUD (#65)", "Inactive Brazoria County MUD (#80)", "Inactive Rancho Isabella MUD", "Meridiana MUD (#31)", "Meridiana MUD (#32)", "Oak Manor MUD", "Rancho Isabella MUD", "Sedona Lakes MUD (#1)", "Shadow Creek Ranch MUD (#21)", "Shadow Creek Ranch MUD (#22)", "Shadow Creek Ranch MUD (#26)", "Treasure Island MUD", "Varner Creek Utility District"];
    const navigationList = ["None", "Precinct 1", "Precinct 2", "Precinct 3", "Precinct 4"];

    meetingForm.innerHTML = `
        <h3 style="margin-top: 0; color: var(--black-text-color); text-align: center; margin: 0px 10px;">Select the jurisdictions you would like to view</h3>

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
          <button type="button" id="electionSaveButton" class="action-button js-hands-off" style="color: var(--black-text-color);">Next: Manage Officials</button>
        </div>
    `;

    document.querySelectorAll('.js-elec-dropdown-input').forEach(input => {
        input.setAttribute('readonly', 'true');
        input.readOnly = true;
    });

    document.getElementById('electionSaveButton').addEventListener('click', () => {
        saveStepOneData();
        navigateTo(2);
    });

    loadDynamicDistricts();
};

const renderOfficials = async () => {
    meetingForm.innerHTML = `
        <div style="margin-bottom: 15px;">
            <a href="#" class="default-link js-hands-off" id="backToStepOneLink" style="color: var(--black-text-color);">← Back to Details</a>
        </div>
        <h3 class="section-heading" id="manageOfficialsHeading" style="margin-top: 0; color: var(--black-text-color);">Manage Active Officials</h3>
        
        <div style="margin-bottom: 20px; display: flex; align-items: center; flex-wrap: wrap; gap: 15px;">
            <div>
                <label for="scopeSelector" style="font-family: sans-serif; font-size: 14px; font-weight: bold; color: var(--black-text-color);">Select Scope:</label>
                <select id="scopeSelector" class="form-input" style="width: auto; display: inline-block; margin-left: 10px; color: var(--black-text-color);">
                    <option value="local">Local</option>
                    <option value="general">General</option>
                </select>
            </div>
            <button type="button" id="toggleArchivedAdminBtn" class="action-button js-hands-off" style="width: auto; padding: 4px 12px; font-size: 14px; color: var(--black-text-color);">View Archived Officials</button>
        </div>
        
        <button type="button" id="showAddOfficialButton" class="action-button js-hands-off" style="margin-bottom: 20px; color: var(--black-text-color);">+ Add Official</button>

        <div class="button-container">
            <button type="button" id="finalFinishButton" class="action-button js-hands-off" style="color: var(--black-text-color);">Save & Finish</button>
        </div>

        <div id="addOfficialFormContainer" style="display: none; border: 1px solid var(--accent-color); padding: 15px; margin-bottom: 20px; border-radius: 4px; width: 50vw; box-sizing: border-box;">
            <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                
                <select id="districtTypeInput" class="form-input" style="width: auto; color: var(--black-text-color);">
                    ${(() => {
                        const opts = [];
                        if (city && city !== 'None') opts.push('<option value="City">City</option>');
                        if (isd && isd !== 'None') opts.push('<option value="ISD">ISD</option>');
                        if (boardOfEd && boardOfEd !== 'None') opts.push('<option value="Board of Education">Board of Education</option>');
                        if (congressDist && congressDist !== 'None') opts.push('<option value="Congressional">Congressional</option>');
                        if (precinct && precinct !== 'None') opts.push('<option value="Justice of the Peace">Justice of the Peace</option>');
                        if (stateRep && stateRep !== 'None') opts.push('<option value="State Representative">State Representative</option>');
                        if (stateSen && stateSen !== 'None') opts.push('<option value="State Senate">State Senate</option>');
                        if (college && college !== 'None') opts.push('<option value="College">College</option>');
                        if (drainage && drainage !== 'None') opts.push('<option value="Drainage">Drainage</option>');
                        if (hospital && hospital !== 'None') opts.push('<option value="Hospital">Hospital</option>');
                        if (mud && mud !== 'None') opts.push('<option value="MUD">MUD</option>');
                        if (navigation && navigation !== 'None') opts.push('<option value="Navigation">Navigation</option>');
                        return opts.length > 0 ? opts.join('') : '<option value="">No local districts set</option>';
                    })()}
                </select>

                <input type="text" id="positionInput" class="form-input" placeholder="Position (e.g., Mayor)" style="flex: 1; min-width: 150px; color: var(--black-text-color);">
                <input type="text" id="nameInput" class="form-input" placeholder="Official Name" style="flex: 1; min-width: 150px; color: var(--black-text-color);">
                <input type="text" id="websiteInput" class="form-input" placeholder="Website" style="flex: 1; min-width: 150px; color: var(--black-text-color);">
                <input type="text" id="wikipediaInput" class="form-input" placeholder="Wikipedia Article" style="flex: 1; min-width: 150px; color: var(--black-text-color);">
                <input type="email" id="emailInput" class="form-input" placeholder="Email Address" style="flex: 1; min-width: 150px; color: var(--black-text-color);">
                <input type="text" id="photoInput" class="form-input" placeholder="Photo URL" style="flex: 1; min-width: 150px; color: var(--black-text-color);">
                <input type="text" id="absentPercentageInput" class="form-input" placeholder="Absent Percentage (e.g. 5.5 or blank)" style="flex: 1; min-width: 150px; color: var(--black-text-color);">
                <input type="date" id="dateEnteredInput" class="form-input" placeholder="Date Entered Office" style="flex: 1; min-width: 150px; color: var(--black-text-color);">
                <input type="date" id="dateLeftFormInput" class="form-input" placeholder="Date Left Office" style="flex: 1; min-width: 150px; color: var(--black-text-color); display: none;">
                
                <input list="partyOptionsList" id="partyInput" class="form-input" placeholder="Party" style="width: auto; color: var(--black-text-color);">
                <datalist id="partyOptionsList">
                    <option value="Democratic">
                    <option value="Republican">
                    <option value="Green">
                    <option value="Libertarian">
                    <option value="Nonpartisan">
                    <option value="Independent">
                </datalist>
                
                <button type="button" id="saveNewOfficialButton" class="action-button js-hands-off" style="width: auto; padding: 8px 12px; color: var(--black-text-color);">Save</button>
                <button type="button" id="cancelAddOfficialButton" class="action-button js-hands-off" style="width: auto; padding: 8px 12px; background-color: #c62828; color: var(--black-text-color); border: none;">Cancel</button>
            </div>
        </div>

        <ul id="officialsPreviewList" style="margin-bottom: 20px; list-style-type: none; padding: 0; width: 50vw;"></ul>

        <div id="archiveModal" style="display: none; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: var(--primary-color); border: 2px solid var(--accent-color); padding: 20px; z-index: 2000; flex-direction: column; gap: 10px; border-radius: 8px;">
            <h4 style="margin-top:0; color: var(--black-text-color); text-align: center;">Archive Official</h4>
            <label style="color: var(--black-text-color); font-family: sans-serif; font-size: 14px;">Date Left Office:</label>
            <input type="date" id="dateLeftInput" class="form-input" style="color: var(--black-text-color);">
            <div style="display: flex; gap: 10px; margin-top: 10px;">
                <button type="button" id="confirmArchiveBtn" class="action-button js-hands-off" style="flex: 1; color: var(--black-text-color);">Confirm</button>
                <button type="button" id="cancelArchiveBtn" class="action-button js-hands-off" style="flex: 1; background-color: #c62828; color: var(--black-text-color); border: none;">Cancel</button>
            </div>
        </div>
    `;

    document.getElementById('backToStepOneLink').addEventListener('click', (e) => {
        e.preventDefault();
        navigateTo(1);
    });

    document.getElementById('toggleArchivedAdminBtn').addEventListener('click', () => {
        showArchivedAdmin = !showArchivedAdmin;
        document.getElementById('toggleArchivedAdminBtn').textContent = showArchivedAdmin ? 'View Active Officials' : 'View Archived Officials';
        document.getElementById('manageOfficialsHeading').textContent = showArchivedAdmin ? 'Manage Archived Officials' : 'Manage Active Officials';
        document.getElementById('showAddOfficialButton').textContent = showArchivedAdmin ? '+ Add Archived Official' : '+ Add Official';
        document.getElementById('dateLeftFormInput').style.display = showArchivedAdmin ? 'inline-block' : 'none';
        loadOfficials();
    });

    const officialsPreviewList = document.getElementById('officialsPreviewList');
    const scopeSelector = document.getElementById('scopeSelector');
    const districtTypeInput = document.getElementById('districtTypeInput');
    const absInput = document.getElementById('absentPercentageInput');

    const toggleAbsInput = () => {
        if (scopeSelector.value === 'general') {
            absInput.style.display = 'block';
        } else {
            if (districtTypeInput.value === 'City' || districtTypeInput.value === 'ISD') {
                absInput.style.display = 'none';
            } else {
                absInput.style.display = 'block';
            }
        }
    };

    scopeSelector.addEventListener('change', toggleAbsInput);
    districtTypeInput.addEventListener('change', toggleAbsInput);
    toggleAbsInput();

    let officialToArchive = null;

    document.getElementById('cancelArchiveBtn').addEventListener('click', () => {
        document.getElementById('archiveModal').style.display = 'none';
        officialToArchive = null;
        document.getElementById('dateLeftInput').value = '';
    });

    document.getElementById('confirmArchiveBtn').addEventListener('click', async () => {
        if (!officialToArchive) return;
        const dateLeft = document.getElementById('dateLeftInput').value;
        if (!dateLeft) {
            alert("Please enter a date.");
            return;
        }
        try {
            const token = await getToken();
            await fetch(`${API_BASE}/api/officials/${officialToArchive}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ is_archived: 1, date_left: dateLeft })
            });
            document.getElementById('archiveModal').style.display = 'none';
            officialToArchive = null;
            document.getElementById('dateLeftInput').value = '';
            await loadOfficials();
        } catch (err) {}
    });

    const loadOfficials = async () => {
        officialsPreviewList.innerHTML = '<li style="font-family: sans-serif; font-size: 14px; color: var(--black-text-color);">Loading officials...</li>';
        try {
            const response = await fetch(`${API_BASE}/api/officials`, { cache: 'no-store' });
            if (!response.ok) throw new Error("Failed to load officials");
            const allOfficials = await response.json();
            
            const currentScope = scopeSelector.value;

            const officials = allOfficials.filter(o => {
                const isArchivedOfficial = (o.is_archived === 1 || o.is_archived === true);
                if (showArchivedAdmin && !isArchivedOfficial) return false;
                if (!showArchivedAdmin && isArchivedOfficial) return false;

                if (o.scope !== currentScope) return false;
                if (currentScope === 'local') {
                    return checkJurisdictionMatch(o.jurisdiction);
                }
                return true;
            });

            if (officials && officials.length > 0) {
                officialsPreviewList.innerHTML = '';
                officials.forEach(official => {
                    const li = document.createElement('li');
                    li.style.padding = "8px";
                    li.style.borderBottom = "1px solid var(--secondary-color)";
                    li.style.fontFamily = "sans-serif";
                    li.style.fontSize = "14px";
                    li.style.color = "var(--black-text-color)";
                    
                    let districtDisplay = official.scope === 'general' ? 'County' : official.jurisdiction;
                    if (official.scope === 'local' && official.jurisdiction && official.jurisdiction.includes('_')) {
                        const firstIdx = official.jurisdiction.indexOf('_');
                        const dType = official.jurisdiction.substring(0, firstIdx);
                        const dVal = official.jurisdiction.substring(firstIdx + 1);
                        districtDisplay = `${dType} (${dVal})`;
                    }

                    let dispAbsent = official.absent_percentage;
                    if (dispAbsent === null || dispAbsent === undefined || dispAbsent === "" || String(dispAbsent).toLowerCase() === 'insufficient data to calculate' || String(dispAbsent).toLowerCase() === 'unknown') {
                        dispAbsent = "Unknown";
                    } else if (!isNaN(dispAbsent)) {
                        dispAbsent = dispAbsent + "%";
                    }

                    let archiveOrRestoreBtn = '';
                    if (showArchivedAdmin) {
                        archiveOrRestoreBtn = `<button type="button" class="restore-official-btn js-hands-off" data-id="${official.id}" style="background-color: var(--secondary-color); padding: 4px 8px; font-size: 12px; border: inset 2px var(--accent-color); border-radius: 4px; color: var(--black-text-color); cursor: pointer; margin-top: 10px; margin-left: 5px;">Restore (Unarchive)</button>`;
                    } else {
                        archiveOrRestoreBtn = `<button type="button" class="archive-official-btn js-hands-off" data-id="${official.id}" style="background-color: var(--secondary-color); padding: 4px 8px; font-size: 12px; border: inset 2px var(--accent-color); border-radius: 4px; color: var(--black-text-color); cursor: pointer; margin-top: 10px; margin-left: 5px;">Archive</button>`;
                    }

                    li.innerHTML = `
                        <div class="highlightable">
                        <strong>District: ${districtDisplay}</strong><br/>
                        <strong>${official.position}</strong> (${official.party}) | Name: ${official.name || 'None'} | Entered: ${official.date_entered || 'Unknown'} ${showArchivedAdmin ? `| Left: ${official.date_left || 'Unknown'}` : ''} | Website: ${official.website || 'None'} | Wikipedia: ${official.wikipedia || 'None'} | Email: ${official.email || 'None'} | Photo: ${official.photo ? 'Added' : 'None'} | Absent: ${dispAbsent}
                        </div>
                        <button type="button" class="edit-official-btn js-hands-off" data-id="${official.id}" style="background-color: var(--secondary-color); padding: 4px 8px; font-size: 12px; border: inset 2px var(--accent-color); border-radius: 4px; color: var(--black-text-color); cursor: pointer; margin-top: 10px;">Edit</button>
                        ${archiveOrRestoreBtn}
                        <button type="button" class="delete-official-btn js-hands-off" data-id="${official.id}" style="background-color: var(--primary-color); padding: 4px 8px; font-size: 12px; border: none; border-radius: 4px; color: var(--black-text-color); cursor: pointer; margin-top: 10px; margin-left: 5px;">Delete</button>
                    `;
                    officialsPreviewList.appendChild(li);
                });

                document.querySelectorAll('.edit-official-btn').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        e.preventDefault();
                        const id = parseInt(btn.getAttribute('data-id'));
                        const officialToEdit = officials.find(o => o.id === id);
                        if (officialToEdit) {
                            document.getElementById('addOfficialFormContainer').style.display = 'block';
                            document.getElementById('showAddOfficialButton').style.display = 'none';
                            
                            document.getElementById('positionInput').value = officialToEdit.position || '';
                            document.getElementById('nameInput').value = officialToEdit.name || '';
                            document.getElementById('websiteInput').value = officialToEdit.website || '';
                            document.getElementById('wikipediaInput').value = officialToEdit.wikipedia || '';
                            document.getElementById('emailInput').value = officialToEdit.email || '';
                            document.getElementById('photoInput').value = officialToEdit.photo || '';
                            
                            let populateAbsent = officialToEdit.absent_percentage || '';
                            if (String(populateAbsent).toLowerCase() === 'unknown' || String(populateAbsent).toLowerCase() === 'insufficient data to calculate') {
                                populateAbsent = '';
                            }
                            document.getElementById('absentPercentageInput').value = populateAbsent;

                            document.getElementById('dateEnteredInput').value = officialToEdit.date_entered || '';
                            document.getElementById('dateLeftFormInput').value = officialToEdit.date_left || '';
                            document.getElementById('partyInput').value = officialToEdit.party || '';
                            
                            document.getElementById('scopeSelector').value = officialToEdit.scope || 'local';
                            if (officialToEdit.scope === 'general') {
                                document.getElementById('districtTypeInput').style.display = 'none';
                            } else {
                                document.getElementById('districtTypeInput').style.display = 'inline-block';
                                document.getElementById('districtTypeInput').value = officialToEdit.district_type || 'City';
                            }
                            toggleAbsInput();
                            
                            try {
                                const token = await getToken();
                                await fetch(`${API_BASE}/api/officials/${id}`, {
                                    method: 'DELETE',
                                    headers: { 'Authorization': `Bearer ${token}` }
                                });
                                await loadOfficials();
                            } catch (err) {}
                        }
                    });
                });

                document.querySelectorAll('.archive-official-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.preventDefault();
                        officialToArchive = btn.getAttribute('data-id');
                        document.getElementById('archiveModal').style.display = 'flex';
                    });
                });
                
                document.querySelectorAll('.restore-official-btn').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        e.preventDefault();
                        const id = btn.getAttribute('data-id');
                        try {
                            const token = await getToken();
                            await fetch(`${API_BASE}/api/officials/${id}`, {
                                method: 'PUT',
                                headers: { 
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${token}` 
                                },
                                body: JSON.stringify({ is_archived: 0, date_left: null })
                            });
                            await loadOfficials();
                        } catch (err) {}
                    });
                });

                document.querySelectorAll('.delete-official-btn').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        e.preventDefault();
                        const id = btn.getAttribute('data-id');
                        try {
                            const token = await getToken();
                            await fetch(`${API_BASE}/api/officials/${id}`, {
                                method: 'DELETE',
                                headers: { 'Authorization': `Bearer ${token}` }
                            });
                            await loadOfficials();
                        } catch (err) {}
                    });
                });
            } else {
                officialsPreviewList.innerHTML = `<li style="font-family: sans-serif; font-size: 14px; color: var(--black-text-color);">No officials found for scope '${currentScope}'.</li>`;
            }
        } catch (err) {
            officialsPreviewList.innerHTML = '<li style="font-family: sans-serif; font-size: 14px; color: #c62828;">Error loading officials from API.</li>';
        }
    };

    scopeSelector.addEventListener('change', () => {
        if (scopeSelector.value === 'general') {
            districtTypeInput.style.display = 'none';
        } else {
            districtTypeInput.style.display = 'inline-block';
        }
        loadOfficials();
    });

    if (scopeSelector.value === 'general') {
        districtTypeInput.style.display = 'none';
    }

    await loadOfficials();

    document.getElementById('showAddOfficialButton').addEventListener('click', () => {
        document.getElementById('addOfficialFormContainer').style.display = 'block';
        document.getElementById('showAddOfficialButton').style.display = 'none';
    });

    document.getElementById('cancelAddOfficialButton').addEventListener('click', () => {
        document.getElementById('addOfficialFormContainer').style.display = 'none';
        document.getElementById('showAddOfficialButton').style.display = 'inline-block';
        document.getElementById('positionInput').value = '';
        document.getElementById('nameInput').value = '';
        document.getElementById('websiteInput').value = '';
        document.getElementById('wikipediaInput').value = '';
        document.getElementById('emailInput').value = '';
        document.getElementById('photoInput').value = '';
        document.getElementById('absentPercentageInput').value = '';
        document.getElementById('dateEnteredInput').value = '';
        document.getElementById('dateLeftFormInput').value = '';
        document.getElementById('partyInput').value = '';
    });

    document.getElementById('saveNewOfficialButton').addEventListener('click', async () => {
        const position = document.getElementById('positionInput').value;
        const officialName = document.getElementById('nameInput').value;
        const website = document.getElementById('websiteInput').value;
        const wikipedia = document.getElementById('wikipediaInput').value;
        const email = document.getElementById('emailInput').value;
        const photo = document.getElementById('photoInput').value;
        const dateEntered = document.getElementById('dateEnteredInput').value;
        const isArchived = showArchivedAdmin ? 1 : 0;
        const dateLeft = showArchivedAdmin ? document.getElementById('dateLeftFormInput').value : null;
        const party = document.getElementById('partyInput').value || 'Unknown';
        const scope = document.getElementById('scopeSelector').value;
        const districtType = scope === 'general' ? 'General' : districtTypeInput.value;
        
        let finalAbsentPercentage = document.getElementById('absentPercentageInput').value.trim();
        
        if (!position || !officialName) return;

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

        const plainJurisdictionName = mapTypeToSession[districtType];
        const actualDistrictValue = scope === 'general' ? 'County' : `${districtType}_${plainJurisdictionName}`;
        
        const isCounty = position.toLowerCase().includes('county');

        if (isCounty) {
            try {
                const summariesRes = await fetch(`${API_BASE}/api/summaries`);
                if (summariesRes.ok) {
                    const summaries = await summariesRes.json();
                    const relevantSummaries = summaries.filter(s => s.city === 'Brazoria County');
                    
                    if (relevantSummaries.length === 0) {
                        finalAbsentPercentage = "Unknown";
                    } else {
                        let absCount = 0;
                        relevantSummaries.forEach(s => {
                            let absList = [];
                            try {
                                absList = JSON.parse(s.absentees || '[]');
                            } catch (e) {
                                absList = String(s.absentees || '');
                            }
                            
                            if (Array.isArray(absList)) {
                                if (absList.some(a => a.includes(officialName))) absCount++;
                            } else {
                                if (absList.includes(officialName)) absCount++;
                            }
                        });
                        finalAbsentPercentage = ((absCount / relevantSummaries.length) * 100).toFixed(1);
                    }
                } else {
                    finalAbsentPercentage = "Unknown";
                }
            } catch (err) {
                finalAbsentPercentage = "Unknown";
            }
        } else if (scope !== 'general' && (districtType === 'City' || districtType === 'ISD')) {
            try {
                const summariesRes = await fetch(`${API_BASE}/api/summaries`);
                if (summariesRes.ok) {
                    const summaries = await summariesRes.json();
                    const relevantSummaries = summaries.filter(s => s.city === plainJurisdictionName);
                    
                    if (relevantSummaries.length === 0) {
                        finalAbsentPercentage = "Unknown";
                    } else {
                        let absCount = 0;
                        relevantSummaries.forEach(s => {
                            let absList = [];
                            try {
                                absList = JSON.parse(s.absentees || '[]');
                            } catch (e) {
                                absList = String(s.absentees || '');
                            }
                            
                            if (Array.isArray(absList)) {
                                if (absList.some(a => a.includes(officialName))) absCount++;
                            } else {
                                if (absList.includes(officialName)) absCount++;
                            }
                        });
                        finalAbsentPercentage = ((absCount / relevantSummaries.length) * 100).toFixed(1);
                    }
                } else {
                    finalAbsentPercentage = "Unknown";
                }
            } catch (err) {
                finalAbsentPercentage = "Unknown";
            }
        } else {
            finalAbsentPercentage = finalAbsentPercentage ? finalAbsentPercentage : "Unknown";
        }

        try {
            const token = await getToken();
            await fetch(`${API_BASE}/api/officials`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    position: position,
                    party: party,
                    jurisdiction: actualDistrictValue,
                    scope: scope,
                    name: officialName,
                    website: website,
                    wikipedia: wikipedia,
                    email: email,
                    photo: photo,
                    district_type: districtType,
                    absent_percentage: finalAbsentPercentage,
                    is_archived: isArchived,
                    date_entered: dateEntered,
                    date_left: dateLeft
                })
            });

            document.getElementById('positionInput').value = '';
            document.getElementById('nameInput').value = '';
            document.getElementById('websiteInput').value = '';
            document.getElementById('wikipediaInput').value = '';
            document.getElementById('emailInput').value = '';
            document.getElementById('photoInput').value = '';
            document.getElementById('absentPercentageInput').value = '';
            document.getElementById('dateEnteredInput').value = '';
            document.getElementById('dateLeftFormInput').value = '';
            document.getElementById('partyInput').value = '';
            document.getElementById('addOfficialFormContainer').style.display = 'none';
            document.getElementById('showAddOfficialButton').style.display = 'inline-block';
            
            await loadOfficials();
        } catch (err) {}
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
        meetingForm.innerHTML = `<h3 class="section-heading" style="color: #2e7d32; text-align: center; margin-top: 40px;">Successfully saved all official data!</h3>`;
        setTimeout(() => { window.location.reload(); }, 2000);
    });
};

if (currentPage === 1) renderStepOne();
else if (currentPage === 2) renderOfficials();
else {
    currentPage = 1;
    renderStepOne();
}