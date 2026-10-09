const API_BASE = 'https://api.brazoriacivicwatch.org';
const cardsContainer = document.getElementById('surveyCardsContainer');
const formContainer = document.getElementById('pollingForm');
const progressBar = document.getElementById('progressBar');
const navContainer = document.getElementById('surveyNavigation');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const submitBtn = document.getElementById('submitBtn');

let currentStep = 0;
let totalSteps = 0;
let maxPageReached = 0;
let currentElectionCycle = null;
let currentSurveyMonth = null;
let encodedPhoneStr = null;
let isShowcaseMode = false;

const demoMap = {
    "How would you describe your race or ethnicity?": "race_ethnicity",
    "What is your age?": "age_bracket",
    "How do you describe your gender?": "gender",
    "What is the highest level of education you have completed?": "education",
    "Do you identify as LGBTQ+?": "lgbtq_plus_status",
    "What is your primary political party affiliation?": "party_identified",
    "What is your approximate annual household income?": "household_income",
    "What is your current employment status?": "employment_status",
    "What is your religious affiliation, if any?": "religion",
    "What is your marital status?": "marital_status",
    "Are you a veteran of the U.S. Armed Forces?": "veteran_status",
    "What is the primary language spoken in your home?": "primary_home_language"
};

function isLocationSet() {
    const sessionKeys = [
        "city", "isd", "boardOfEd", "congressDist", "precinct", 
        "stateRep", "stateSen", "college", "drainage", "hospital", 
        "mud", "navigation"
    ];
    
    for (const key of sessionKeys) {
        const val = (sessionStorage.getItem(key) || 'None').trim();
        if (val.toLowerCase() !== 'none' && !val.toLowerCase().startsWith('all')) {
            return true;
        }
    }
    return false;
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

    if (userVal.toLowerCase().startsWith('all') || userVal.toLowerCase() === 'none') {
        return false;
    }

    return userVal === valPart;
}

function getSeatPriority(seat) {
    const name = (seat.seat_name || '').toLowerCase();
    
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
    if (name === 'district clerk') return 53;
    if (name === 'county clerk') return 54;
    if (name === 'sheriff') return 55;
    if (name.includes('tax assessor')) return 56;
    if (name.includes('county treasurer')) return 57;
    if (name.includes('county commissioner')) return 60;
    if (name.includes('justice of the peace')) return 61;
    if (name.includes('constable')) return 62;

    const scope = (seat.scope || '').toLowerCase();
    if (scope === 'federal') return 70;
    if (scope === 'state' || scope === 'general' || scope === 'major') return 80;
    if (scope === 'county') return 90;
    if (scope === 'local') return 100;

    return 999;
}

function updateUI() {
    const cards = document.querySelectorAll('.polling-card');
    cards.forEach((card) => {
        if (parseInt(card.dataset.page) === currentStep) {
            card.classList.add('active');
        } else {
            card.classList.remove('active');
        }
    });

    const showcaseHeader = document.getElementById('showcase-header');
    if (showcaseHeader) {
        showcaseHeader.style.display = currentStep === 0 ? 'block' : 'none';
    }

    const allInputs = Array.from(document.querySelectorAll('.polling-dropdown-value'));
    const filledCount = allInputs.filter(input => input.value !== "").length;

    if (allInputs.length > 0) {
        if (filledCount === 0 && maxPageReached === 0) {
            progressBar.style.width = '0%';
        } else {
            const corePages = Math.max(1, totalSteps - 1);
            
            const getBaseProgress = (page) => {
                if (page >= corePages) return 97.5; 
                
                const x = page / corePages;
                const curve = 0.85 * Math.pow(x, 0.35) + 0.15 * Math.pow(x, 3);
                return curve * 97.5;
            };

            let baseProgress = getBaseProgress(maxPageReached);
            let nextProgress = maxPageReached >= corePages ? 100 : getBaseProgress(maxPageReached + 1);

            let gap = nextProgress - baseProgress;

            const maxPageCards = document.querySelectorAll(`.polling-card[data-page="${maxPageReached}"]`);
            let maxPageInputs = [];
            maxPageCards.forEach(c => {
                c.querySelectorAll('.polling-dropdown-value').forEach(i => maxPageInputs.push(i));
            });
            
            let maxPageFilled = maxPageInputs.filter(i => i.value !== "").length;
            let pageRatio = maxPageInputs.length ? (maxPageFilled / maxPageInputs.length) : 0;
            
            let progress = baseProgress + (gap * pageRatio);

            if (filledCount === allInputs.length) {
                progress = 100;
            } else if (progress > 99) {
                progress = 99; 
            }

            progressBar.style.width = `${progress}%`;
        }
    } else {
        progressBar.style.width = '0%';
    }

    if (currentStep === totalSteps - 1 && totalSteps > 0) {
        progressBar.textContent = "Last Page";
        progressBar.style.display = "flex";
        progressBar.style.alignItems = "center";
        progressBar.style.justifyContent = "center";
        progressBar.style.color = "var(--white-text-color, #ffffff)";
        progressBar.style.fontWeight = "bold";
        progressBar.style.fontSize = "0.85rem";
        progressBar.style.whiteSpace = "nowrap";
    } else {
        progressBar.textContent = "";
    }

    prevBtn.style.setProperty('display', currentStep === 0 ? 'none' : 'inline-flex', 'important');
    
    if (currentStep === totalSteps - 1) {
        nextBtn.style.setProperty('display', 'none', 'important');
        
        const allFilled = allInputs.length > 0 && filledCount === allInputs.length;
        
        if (allFilled || isShowcaseMode) {
            submitBtn.style.setProperty('display', 'inline-flex', 'important');
        } else {
            submitBtn.style.setProperty('display', 'none', 'important');
        }
    } else {
        nextBtn.style.setProperty('display', 'inline-flex', 'important');
        submitBtn.style.setProperty('display', 'none', 'important');
    }
}

async function loadPoll() {
    try {
        if (!formContainer) return;

        const searchParams = new URLSearchParams(window.location.search);
        encodedPhoneStr = searchParams.get('t');

        if (encodedPhoneStr === '123456789') {
            formContainer.innerHTML = `
                <div class="registration-form" id="regFormBlock">
                    <h2 style="margin: 0 0 10px 0; color: var(--accent-color); font-family: var(--global-font); text-align: center;">Voter Registration & Verification</h2>
                    <div class="transparency-text">
                        <strong>Transparency Notice:</strong><br>
                        Enter your first and last name as it would appear on your voter registration.<br><br>
                        Your address and Date of Birth are used to securely verify your registration profile and determine relevant questions (e.g., precincts and districts) for local polling. Your privacy is protected.<br><br>
                        <em>Note: Survey links are generated using a mathematical encoding (*12.3 / &pi; or legacy fallback *12 / &pi;) to protect your phone number.</em>
                    </div>
                    
                    <div id="regInputsBlock" style="display: flex; flex-direction: column; gap: 15px;">
                        <div class="reg-input-group">
                            <label>First Name</label>
                            <input type="text" id="regFirst" class="reg-input" required>
                        </div>
                        <div class="reg-input-group">
                            <label>Last Name</label>
                            <input type="text" id="regLast" class="reg-input" required>
                        </div>
                        <div class="reg-input-group">
                            <label>Date of Birth</label>
                            <input type="date" id="regDob" class="reg-input" required>
                        </div>
                        <div class="reg-input-group">
                            <label>Phone Number</label>
                            <input type="tel" id="regPhone" class="reg-input" placeholder="(123) 456-7890" required>
                        </div>
                        <div class="reg-input-group">
                            <label>Street Address</label>
                            <input type="text" id="regAddress" class="reg-input" placeholder="123 Main St" required>
                        </div>
                        <div style="display: flex; flex-wrap: wrap; gap: 15px;">
                            <div class="reg-input-group" style="flex: 2 1 150px;">
                                <label>City</label>
                                <input type="text" id="regCity" class="reg-input" required>
                            </div>
                            <div class="reg-input-group" style="flex: 1 1 100px;">
                                <label>ZIP Code</label>
                                <input type="text" id="regZip" class="reg-input" required>
                            </div>
                        </div>
                        
                        <div id="turnstile-container" style="display: flex; justify-content: center; margin-top: 15px;"></div>
                    </div>

                    <div id="regMatchBlock" style="display: none; flex-direction: column; gap: 10px;">
                        <h3 style="color: var(--white-text-color); margin: 0;">Is this you?</h3>
                        <p style="color: var(--white-text-color); font-size: 0.9rem; margin: 0 0 10px 0;">We found a close match in the voter registration file. Please verify this is your record:</p>
                        <div id="regMatchOptions" style="display: flex; flex-direction: column; gap: 8px;"></div>
                    </div>
                    
                    <button type="button" id="regSubmitBtn" class="nav-btn submit-btn js-hands-off" style="margin-top: 15px;">Verify & Start Survey</button>
                    <div id="regError" style="color: #ffaa00; font-family: var(--global-font); text-align: center; margin-top: 10px; display: none;"></div>
                </div>
            `;
            
            document.querySelector('.progress-wrapper').style.display = 'none';

            if (window.turnstile) {
                window.turnstile.render('#turnstile-container', {
                    sitekey: '0x4AAAAAAFM7YTt-_1Ye6Rim'
                });
            } else {
                const observer = new MutationObserver((mutations, obs) => {
                    if (window.turnstile) {
                        window.turnstile.render('#turnstile-container', {
                            sitekey: '0x4AAAAAAFM7YTt-_1Ye6Rim'
                        });
                        obs.disconnect();
                    }
                });
                observer.observe(document, { childList: true, subtree: true });
            }

            let confirmedMatchData = null;

            document.getElementById('regSubmitBtn').addEventListener('click', async () => {
                const first_name = document.getElementById('regFirst').value.trim();
                const last_name = document.getElementById('regLast').value.trim();
                const dob = document.getElementById('regDob').value;
                const phone = document.getElementById('regPhone').value.trim();
                const address = document.getElementById('regAddress').value.trim();
                const city = document.getElementById('regCity').value.trim();
                const zip = document.getElementById('regZip').value.trim();
                const errDiv = document.getElementById('regError');

                if (document.getElementById('regMatchBlock').style.display === 'flex') {
                    const selected = document.querySelector('input[name="voter_match"]:checked');
                    if (!selected) {
                        errDiv.innerText = "Please select an option.";
                        errDiv.style.display = 'block';
                        return;
                    }
                    if (selected.value === "none") {
                        errDiv.innerText = "Please fill in the information as it appears on your voter registration. If you are not registered to vote or do not live in Brazoria County this system will not work.";
                        errDiv.style.display = 'block';
                        document.getElementById('regMatchBlock').style.display = 'none';
                        document.getElementById('regInputsBlock').style.display = 'flex';
                        document.getElementById('regSubmitBtn').innerText = "Verify & Start Survey";
                        return;
                    }
                    confirmedMatchData = JSON.parse(decodeURIComponent(selected.value));
                }

                if (!first_name || !last_name || !dob || !phone || !address || !city || !zip) {
                    errDiv.innerText = "Please fill out all fields.";
                    errDiv.style.display = 'block';
                    return;
                }

                const turnstileToken = document.querySelector('[name="cf-turnstile-response"]')?.value;
                if (!turnstileToken && !confirmedMatchData) {
                    errDiv.innerText = "Please complete the security check.";
                    errDiv.style.display = 'block';
                    return;
                }

                errDiv.style.display = 'none';
                const btn = document.getElementById('regSubmitBtn');
                btn.innerText = "Verifying Profile...";
                btn.disabled = true;

                try {
                    const payload = { first_name, last_name, dob, phone, address, city, zip, turnstileToken };
                    if (confirmedMatchData) {
                        payload.confirmed_match = confirmedMatchData;
                    }

                    const res = await fetch(`${API_BASE}/api/survey/self-register`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    const data = await res.json();

                    if (data.requires_confirmation) {
                        document.getElementById('regInputsBlock').style.display = 'none';
                        document.getElementById('regMatchBlock').style.display = 'flex';
                        
                        const optionsContainer = document.getElementById('regMatchOptions');
                        optionsContainer.innerHTML = '';
                        
                        data.matches.forEach((match) => {
                            const encodedMatch = encodeURIComponent(JSON.stringify(match));
                            const rawNameFormat = match.rawName.split(',').map(n => n.trim()).reverse().join(' ');
                            
                            optionsContainer.innerHTML += `
                                <label style="display: flex; align-items: center; gap: 10px; color: var(--white-text-color); font-size: 1rem; cursor: pointer; background: rgba(0,0,0,0.2); padding: 10px; border-radius: 8px;">
                                    <input type="radio" name="voter_match" value="${encodedMatch}">
                                    <div>
                                        <strong>${rawNameFormat}</strong><br>
                                        <span style="font-size: 0.85rem; opacity: 0.8;">${match.rawAddress}</span>
                                    </div>
                                </label>
                            `;
                        });

                        optionsContainer.innerHTML += `
                            <label style="display: flex; align-items: center; gap: 10px; color: #ffaa00; font-size: 1rem; cursor: pointer; background: rgba(0,0,0,0.2); padding: 10px; border-radius: 8px;">
                                <input type="radio" name="voter_match" value="none">
                                <strong>None of these are me</strong>
                            </label>
                        `;

                        btn.innerText = "Confirm Selection";
                        btn.disabled = false;
                        errDiv.style.display = 'none';
                    } else if (data.success && data.encoded_t) {
                        window.location.href = window.location.pathname + '?t=' + data.encoded_t;
                    } else {
                        errDiv.innerText = data.error || "Verification failed. Please check your information.";
                        errDiv.style.display = 'block';
                        btn.innerText = "Verify & Start Survey";
                        btn.disabled = false;
                        confirmedMatchData = null; 
                        document.getElementById('regMatchBlock').style.display = 'none';
                        document.getElementById('regInputsBlock').style.display = 'flex';
                        if (window.turnstile) window.turnstile.reset();
                    }
                } catch (e) {
                    errDiv.innerText = "Network error. Please try again.";
                    errDiv.style.display = 'block';
                    btn.innerText = "Verify & Start Survey";
                    btn.disabled = false;
                    confirmedMatchData = null;
                    document.getElementById('regMatchBlock').style.display = 'none';
                    document.getElementById('regInputsBlock').style.display = 'flex';
                    if (window.turnstile) window.turnstile.reset();
                }
            });
            
            return;
        }
        
        if (!encodedPhoneStr) {
            formContainer.innerHTML = `
                <div class="voter-message" style="display: flex; flex-direction: column; gap: 15px;">
                    <h2 style="margin: 0; color: var(--primary-color);">Invalid Survey Link</h2>
                    <p style="margin: 0; font-size: 1.2rem;">A valid voter link is required to take this survey. Please make sure you clicked the exact link sent to you.</p>
                </div>
            `;
            document.querySelector('.progress-wrapper').style.display = 'none';
            return;
        }
        
        let voterData = null;
        let existingVotes = [];

        if (encodedPhoneStr === '138000') {
            isShowcaseMode = true;
        } else {
            const encodedNum = parseFloat(encodedPhoneStr);
            
            if (isNaN(encodedNum)) {
                formContainer.innerHTML = `
                    <div class="voter-message" style="display: flex; flex-direction: column; gap: 15px;">
                        <h2 style="margin: 0; color: var(--primary-color);">Invalid Survey Link</h2>
                        <p style="margin: 0; font-size: 1.2rem;">A valid voter link is required to take this survey.</p>
                    </div>
                `;
                document.querySelector('.progress-wrapper').style.display = 'none';
                return;
            }

            const statusRes = await fetch(`${API_BASE}/api/survey/status/${encodedNum}`);
            if (!statusRes.ok) throw new Error();
            const statusData = await statusRes.json();

            if (!statusData.canTake) {
                formContainer.innerHTML = `
                    <div class="voter-message" style="display: flex; flex-direction: column; gap: 15px;">
                        <h2 style="margin: 0; color: var(--primary-color);">Survey Unavailable</h2>
                        <p style="margin: 0; font-size: 1.2rem;">${statusData.reason}</p>
                    </div>
                `;
                document.querySelector('.progress-wrapper').style.display = 'none';
                return;
            }

            voterData = statusData.voter;
            existingVotes = statusData.existing_votes;
            currentElectionCycle = statusData.election_cycle;
            currentSurveyMonth = statusData.survey_month;

            sessionStorage.setItem('city', voterData.city_jurisdiction || 'None');
            sessionStorage.setItem('isd', voterData.independent_school_district || 'None');
            sessionStorage.setItem('boardOfEd', voterData.state_board_of_education_district || 'None');
            sessionStorage.setItem('congressDist', voterData.congressional_district || 'None');
            sessionStorage.setItem('precinct', voterData.precinct_jp_commissioner || 'None');
            sessionStorage.setItem('stateRep', voterData.state_representative_district || 'None');
            sessionStorage.setItem('stateSen', voterData.state_senate_district || 'None');
            sessionStorage.setItem('college', voterData.college_district || 'None');
            sessionStorage.setItem('drainage', voterData.drainage_district || 'None');
            sessionStorage.setItem('hospital', voterData.hospital_district || 'None');
            sessionStorage.setItem('mud', voterData.municipal_utility_district || 'None');
            sessionStorage.setItem('navigation', voterData.navigation_district || 'None');

            const debugHeader = document.createElement('h3');
            debugHeader.style.color = '#ff4444';
            debugHeader.style.textAlign = 'center';
            debugHeader.style.margin = '10px 0';
            debugHeader.innerText = '';
            formContainer.parentElement.insertBefore(debugHeader, formContainer);

            if (!isLocationSet()) {
                formContainer.innerHTML = `
                    <div class="voter-message" style="display: flex; flex-direction: column; gap: 15px;">
                        <h2 style="margin: 0; color: var(--primary-color);">Location Not Set</h2>
                        <p style="margin: 0; font-size: 1.2rem;">You don't have your location set. Go to <a href="index.html" style="color: var(--accent-color); text-decoration: underline;">this link</a> first to set it, and come back here with the back arrow.</p>
                    </div>
                `;
                document.querySelector('.progress-wrapper').style.display = 'none';
                return;
            }
        }

        const [electionsResponse, seatsResponse] = await Promise.all([
            fetch(`${API_BASE}/api/elections`),
            fetch(`${API_BASE}/api/seats`)
        ]);

        if (!electionsResponse.ok || !seatsResponse.ok) throw new Error();

        const allElections = await electionsResponse.json();
        const allSeats = await seatsResponse.json();

        const relevantSeats = allSeats.filter(seat => {
            if (isShowcaseMode) return true;
            if (seat.scope === 'general' || seat.scope === 'state' || seat.scope === 'major') return true;
            if (seat.scope === 'local') {
                return checkCandidateMatch(seat.city);
            }
            return false;
        });

        const validElectionIds = new Set(allSeats.map(seat => seat.election_id));
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
            formContainer.innerHTML = '<div class="voter-message">No upcoming elections found for your selected districts.</div>';
            document.querySelector('.progress-wrapper').style.display = 'none';
            return;
        }

        const targetElectionId = upcoming[0].election_id;
        const targetCandidates = relevantSeats.filter(seat => seat.election_id === targetElectionId);

        if (targetCandidates.length === 0) {
            formContainer.innerHTML = '<div class="voter-message">No local races found for your specific districts.</div>';
            document.querySelector('.progress-wrapper').style.display = 'none';
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

        const sortedSeats = Object.entries(seatsGrouped).sort((a, b) => {
            const priorityA = getSeatPriority(a[1][0]);
            const priorityB = getSeatPriority(b[1][0]);
            if (priorityA !== priorityB) return priorityA - priorityB;
            return a[0].localeCompare(b[0]);
        });

        const pages = [];
        const CARDS_PER_PAGE = 3;
        for (let i = 0; i < sortedSeats.length; i += CARDS_PER_PAGE) {
            pages.push(sortedSeats.slice(i, i + CARDS_PER_PAGE));
        }

        let formHTML = '';
        let globalPageIndex = 0;

        const genPage0 = [
            { q: "What matter do you care the most about?", sub: "General Question", opts: ["Infrastructure", "Local Business", "Taxes", "Healthcare", "Transparency", "Partisanship", "Education", "Public Safety", "Environment", "Housing", "Immigration/Border Security", "Economy/Cost of Living", "Other", "Unsure"] },
            { q: "What matter do you care the second most about?", sub: "General Question", opts: ["Infrastructure", "Local Business", "Taxes", "Healthcare", "Transparency", "Partisanship", "Education", "Public Safety", "Environment", "Housing", "Immigration/Border Security", "Economy/Cost of Living", "Other", "Unsure"] }
        ];

        const genPage1 = [
            { q: "Would you vote down-ballot for any party?", sub: "General Question", opts: ["Democrat", "Republican", "Other Party", "I would vote split-ballot", "Unsure"] },
            { q: "Which party do you generally support more?", sub: "General Question", opts: ["Democrat", "Republican", "Independent", "Other Party", "Unsure"] },
            { q: "Which party do you generally align yourself with?", sub: "General Question", opts: ["Democrat", "Republican", "Independent", "Other Party", "Unsure"] }
        ];

        const genPage2 = [
            { q: "Do you approve of Republicans in Brazoria County?", sub: "General Question", opts: ["Yes", "No", "Unsure"] },
            { q: "Do you approve of Republicans in general?", sub: "General Question", opts: ["Yes", "No", "Unsure"] },
            { q: "Do you approve of Democrats in general?", sub: "General Question", opts: ["Yes", "No", "Unsure"] },
            { q: "Do you approve of Democrats in Brazoria County?", sub: "General Question", opts: ["Yes", "No", "Unsure"] }
        ];

        const genPage3 = [
            { q: "How motivated are you to vote?", sub: "General Question", opts: ["Extremely motivated (I will vote)", "Somewhat motivated (I will probably vote)", "Motivated (I might vote)", "Unmotivated (I might not vote)", "Somewhat unmotivated (I probably will not vote)", "Extremely unmotivated (I will not vote)", "Unsure"] },
            { q: "Do you approve of the current President?", sub: "General Question", opts: ["Strongly approve", "Approve", "Neither approve or disapprove", "Disapprove", "Strongly disapprove", "Unsure"] }
        ];

        const demoPage1 = [
            { q: "How would you describe your race or ethnicity?", sub: "Demographics", opts: ["Asian", "Black or African American", "Hispanic or Latino", "Native American or Alaska Native", "Native Hawaiian or Other Pacific Islander", "White", "Two or more races", "Other", "Prefer not to say", "Unsure"] },
            { q: "What is your age?", sub: "Demographics", opts: ["18-24", "25-34", "35-44", "45-54", "55-64", "65-74", "75 or older", "Prefer not to say", "Unsure"] },
            { q: "How do you describe your gender?", sub: "Demographics", opts: ["Male", "Female", "Non-binary / Third gender", "Prefer to self-describe", "Prefer not to say", "Unsure"] },
            { q: "What is the highest level of education you have completed?", sub: "Demographics", opts: ["Less than high school", "High school graduate / GED", "Some college, no degree", "Associate degree", "Bachelor's degree", "Master's degree", "Doctoral or professional degree", "Prefer not to say", "Unsure"] }
        ];

        const demoPage2 = [
            { q: "Do you identify as LGBTQ+?", sub: "Demographics", opts: ["Yes", "No", "Prefer not to say", "Unsure"] },
            { q: "What is your primary political party affiliation?", sub: "Demographics", opts: ["Democrat", "Republican", "Independent", "Libertarian", "Green Party", "Other", "None", "Prefer not to say", "Unsure"] },
            { q: "What is your approximate annual household income?", sub: "Demographics", opts: ["Under $25,000", "$25,000 - $49,999", "$50,000 - $74,999", "$75,000 - $99,999", "$100,000 - $149,999", "$150,000 or more", "Prefer not to say", "Unsure"] },
            { q: "What is your current employment status?", sub: "Demographics", opts: ["Employed full-time", "Employed part-time", "Self-employed", "Unemployed and looking for work", "Unemployed and not looking for work", "Student", "Retired", "Unable to work", "Prefer not to say", "Unsure"] }
        ];

        const demoPage3 = [
            { q: "What is your religious affiliation, if any?", sub: "Demographics", opts: ["Christian (Protestant)", "Christian (Catholic)", "Christian (Other)", "Jewish", "Muslim", "Hindu", "Buddhist", "Atheist / Agnostic", "Nothing in particular", "Other", "Prefer not to say", "Unsure"] },
            { q: "What is your marital status?", sub: "Demographics", opts: ["Single, never married", "Married or domestic partnership", "Widowed", "Divorced", "Separated", "Prefer not to say", "Unsure"] },
            { q: "Are you a veteran of the U.S. Armed Forces?", sub: "Demographics", opts: ["Yes", "No", "Prefer not to say", "Unsure"] },
            { q: "What is the primary language spoken in your home?", sub: "Demographics", opts: ["English", "Spanish", "Other", "Prefer not to say", "Unsure"] }
        ];

        const allDemoQuestions = [...demoPage1, ...demoPage2, ...demoPage3];

        const generateStaticCards = (chunk) => {
            chunk.forEach(question => {
                let optionsHTML = '<div class="dropdown-option default-opt" data-value="">Select an option...</div>';
                question.opts.forEach(opt => {
                    optionsHTML += `<div class="dropdown-option" data-value="${opt}">${opt}</div>`;
                });

                let showcaseTag = '';
                if (isShowcaseMode) {
                    let tagText = (chunk === allDemoQuestions) 
                        ? "(Demographic Question, shown to all)" 
                        : "(General Question, shown to all)";
                    showcaseTag = `<span class="showcase-tag" style="color: #ffaa00; font-weight: bold; display: block; margin-top: 5px;">${tagText}</span>`;
                }

                formHTML += `
                    <div class="polling-card" data-page="${globalPageIndex}">
                        <h3 class="polling-card-title">${question.q}</h3>
                        <p class="seat-subtitle">${question.sub || "General Question"} ${showcaseTag}</p>
                        <div class="custom-dropdown" tabindex="0">
                            <div class="dropdown-selected">Select an option...</div>
                            <div class="dropdown-options">
                                ${optionsHTML}
                            </div>
                            <input type="hidden" name="${question.q}" class="polling-dropdown-value" ${isShowcaseMode ? '' : 'required'}>
                        </div>
                    </div>
                `;
            });
            globalPageIndex++;
        };

        [genPage0, genPage1, genPage2, genPage3].forEach(generateStaticCards);

        pages.forEach((pageSeats) => {
            for (const [seatName, candidatesList] of pageSeats) {
                const districtString = candidatesList[0].city || "General Election";
                let formattedDistrictString = districtString;
                if (formattedDistrictString.includes('_')) {
                    const parts = formattedDistrictString.split('_');
                    formattedDistrictString = `${parts[1].trim()} ${parts[0].trim()}`;
                }

                let showcaseTag = '';
                if (isShowcaseMode) {
                    let tagText = `(Local question, shown to ${formattedDistrictString})`;
                    showcaseTag = `<span class="showcase-tag" style="color: #ffaa00; font-weight: bold; display: block; margin-top: 5px;">${tagText}</span>`;
                }

                let optionsHTML = '<div class="dropdown-option default-opt" data-value="">Select a candidate...</div>';
                
                candidatesList.forEach(c => {
                    const candidateDisplayName = c.name || 'Unknown';
                    const partyName = c.party || 'Independent';
                    const isIncumbent = c.incumbent && (c.incumbent.toString().toLowerCase() === 'y' || c.incumbent.toString().toLowerCase() === 'yes' || c.incumbent.toString() === '1' || c.incumbent.toString().toLowerCase() === 'true');
                    const incumbentTag = isIncumbent ? ', Incumbent' : '';
                    const fullText = `${candidateDisplayName} (${partyName})${incumbentTag}`;
                    
                    optionsHTML += `<div class="dropdown-option" data-value="${fullText}">${fullText}</div>`;
                });

                optionsHTML += '<div class="dropdown-option" data-value="Unsure">Unsure</div>';
                optionsHTML += '<div class="dropdown-option" data-value="I don\'t know these candidates">I don\'t know these candidates</div>';
                optionsHTML += '<div class="dropdown-option" data-value="Someone Else/Write-in">Someone Else/Write-in</div>';
                
                formHTML += `
                    <div class="polling-card" data-page="${globalPageIndex}">
                        <h3 class="polling-card-title">${seatName}</h3>
                        <p class="seat-subtitle">District: ${formattedDistrictString} ${showcaseTag}</p>
                        <div class="custom-dropdown" tabindex="0">
                            <div class="dropdown-selected">Select a candidate...</div>
                            <div class="dropdown-options">
                                ${optionsHTML}
                            </div>
                            <input type="hidden" name="${seatName}" class="polling-dropdown-value" ${isShowcaseMode ? '' : 'required'}>
                        </div>
                    </div>
                `;
            }
            globalPageIndex++;
        });

        [allDemoQuestions].forEach(generateStaticCards);
        
        totalSteps = globalPageIndex;
        cardsContainer.innerHTML = formHTML;

        if (isShowcaseMode) {
            const showcaseHeader = document.createElement('div');
            showcaseHeader.id = 'showcase-header';
            showcaseHeader.innerHTML = `
                <div style="text-align: center; margin-bottom: 20px; padding: 15px; background: var(--sickly-primary); border-radius: 8px; border: 2px solid var(--secondary-color);">
                    <p style="color: var(--white-text-color); font-weight: bold; margin: 0 0 10px 0; font-size: 1.1rem;">(Usually, all questions are required)</p>
                    <label style="cursor: pointer; color: var(--white-text-color); font-weight: bold; display: inline-flex; align-items: center; gap: 8px;">
                        <input type="checkbox" id="toggleDisclaimers" checked style="width: 18px; height: 18px;"> 
                        Show Audience Disclaimers
                    </label>
                </div>
            `;
            formContainer.insertBefore(showcaseHeader, cardsContainer);

            setTimeout(() => {
                const toggle = document.getElementById('toggleDisclaimers');
                if (toggle) {
                    toggle.addEventListener('change', (e) => {
                        document.querySelectorAll('.showcase-tag').forEach(tag => {
                            tag.style.display = e.target.checked ? 'block' : 'none';
                        });
                    });
                }
            }, 0);
        }

        navContainer.style.display = 'flex';
        
        let firstUnansweredPage = 0;
        let foundUnanswered = false;

        const generatedCards = document.querySelectorAll('.polling-card');
        generatedCards.forEach(card => {
            const title = card.querySelector('.polling-card-title').innerText.trim();
            const subtitle = card.querySelector('.seat-subtitle').innerText.trim();
            const dropdown = card.querySelector('.custom-dropdown');
            const selected = dropdown.querySelector('.dropdown-selected');
            const hiddenInput = dropdown.querySelector('.polling-dropdown-value');
            const pageIndex = parseInt(card.dataset.page);

            let prefillValue = null;
            if (!isShowcaseMode) {
                if (subtitle.includes("Demographics") && demoMap[title]) {
                    const colName = demoMap[title];
                    if (voterData && voterData[colName]) prefillValue = voterData[colName];
                } else {
                    const existing = existingVotes.find(v => v.race_slug === title);
                    if (existing) prefillValue = existing.candidate_choice;
                }
            }

            if (prefillValue) {
                const options = Array.from(dropdown.querySelectorAll('.dropdown-option'));
                const optionMatch = options.find(opt => opt.dataset.value === prefillValue);
                if (optionMatch) {
                    selected.innerText = optionMatch.innerText;
                    hiddenInput.value = optionMatch.dataset.value;
                }
            } else {
                if (!foundUnanswered) {
                    firstUnansweredPage = pageIndex;
                    foundUnanswered = true;
                }
            }
        });
        
        currentStep = foundUnanswered ? firstUnansweredPage : totalSteps - 1;
        maxPageReached = currentStep;

        const dropdowns = document.querySelectorAll('.custom-dropdown');
        dropdowns.forEach(dropdown => {
            const selected = dropdown.querySelector('.dropdown-selected');
            const optionsContainer = dropdown.querySelector('.dropdown-options');
            const optionsList = dropdown.querySelectorAll('.dropdown-option');
            const hiddenInput = dropdown.querySelector('.polling-dropdown-value');
            const card = dropdown.closest('.polling-card');
            const title = card.querySelector('.polling-card-title').innerText.trim();
            const subtitle = card.querySelector('.seat-subtitle').innerText.trim();

            selected.addEventListener('click', (e) => {
                document.querySelectorAll('.dropdown-options.show').forEach(opt => {
                    if(opt !== optionsContainer) opt.classList.remove('show');
                });
                optionsContainer.classList.toggle('show');
                dropdown.classList.toggle('open');
            });

            optionsList.forEach(option => {
                option.addEventListener('click', () => {
                    const isClear = option.dataset.value === "";
                    let valToStore = "";

                    if (isClear) {
                        if(selected.innerText.includes('candidate')) {
                            selected.innerText = "Select a candidate...";
                        } else {
                            selected.innerText = "Select an option...";
                        }
                        hiddenInput.value = "";
                    } else {
                        selected.innerText = option.innerText;
                        hiddenInput.value = option.dataset.value;
                        valToStore = option.dataset.value;
                    }
                    
                    optionsContainer.classList.remove('show');
                    dropdown.classList.remove('open');
                    
                    updateUI();

                    if (!isClear && !isShowcaseMode) {
                        const isDemo = subtitle.includes("Demographics") && demoMap[title];
                        fetch(`${API_BASE}/api/survey/save-answer`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                encodedPhone: encodedPhoneStr,
                                election_cycle: currentElectionCycle,
                                survey_month: currentSurveyMonth,
                                type: isDemo ? 'demographic' : 'vote',
                                key: isDemo ? demoMap[title] : title,
                                value: valToStore
                            })
                        }).catch(err => console.error('Error auto-saving:', err));
                    }
                });
            });
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.custom-dropdown')) {
                document.querySelectorAll('.dropdown-options.show').forEach(opt => opt.classList.remove('show'));
                document.querySelectorAll('.custom-dropdown.open').forEach(dd => dd.classList.remove('open'));
            }
        });

        updateUI();
        window.scrollTo({ top: 0, behavior: 'auto' });

        nextBtn.addEventListener('click', () => {
            const activeCards = document.querySelectorAll(`.polling-card[data-page="${currentStep}"]`);
            let allValid = true;
            
            activeCards.forEach(card => {
                const hiddenInput = card.querySelector('.polling-dropdown-value');
                const dropdownEl = card.querySelector('.custom-dropdown');
                
                if (!isShowcaseMode && !hiddenInput.value) {
                    allValid = false;
                    dropdownEl.style.border = 'solid 4px var(--primary-color)';
                    setTimeout(() => {
                        dropdownEl.style.border = 'solid 2px var(--primary-color)';
                    }, 1500);
                }
            });

            if (!allValid) return;

            if (currentStep < totalSteps - 1) {
                currentStep++;
                maxPageReached = Math.max(maxPageReached, currentStep);
                updateUI();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });

        prevBtn.addEventListener('click', () => {
            if (currentStep > 0) {
                currentStep--;
                updateUI();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });

        formContainer.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (isShowcaseMode) {
                cardsContainer.style.display = 'none';
                navContainer.style.display = 'none';
                
                const sh = document.getElementById('showcase-header');
                if (sh) sh.style.display = 'none';
                
                const pw = document.querySelector('.progress-wrapper');
                if (pw) pw.style.display = 'none';

                let completionMsg = document.getElementById('showcase-completion');
                if (!completionMsg) {
                    completionMsg = document.createElement('div');
                    completionMsg.id = 'showcase-completion';
                    completionMsg.innerHTML = `
                        <div class="voter-message" style="display: flex; flex-direction: column; align-items: center; gap: 20px;">
                            <div>Thank you for reviewing the survey showcase! (No data was saved to the database).</div>
                            <button type="button" class="nav-btn prev-btn js-hands-off" id="showcase-back-btn" style="margin: 0 auto; width: fit-content;">Go Back</button>
                        </div>
                    `;
                    formContainer.appendChild(completionMsg);

                    document.getElementById('showcase-back-btn').addEventListener('click', () => {
                        completionMsg.style.display = 'none';
                        cardsContainer.style.display = '';
                        navContainer.style.display = 'flex';
                        if (pw) pw.style.display = '';
                        updateUI();
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    });
                } else {
                    completionMsg.style.display = 'block';
                }
                
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }

            try {
                const res = await fetch(`${API_BASE}/api/survey/submit`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        encodedPhone: encodedPhoneStr,
                        election_cycle: currentElectionCycle,
                        survey_month: currentSurveyMonth
                    })
                });
                
                if (res.ok) {
                    formContainer.innerHTML = '<div class="voter-message">Thank you for your feedback! Your responses have been recorded.</div>';
                    document.querySelector('.progress-wrapper').style.display = 'none';
                } else {
                    formContainer.innerHTML = '<div class="voter-message">An error occurred submitting your survey. Please try again.</div>';
                }
            } catch(err) {
                formContainer.innerHTML = '<div class="voter-message">An error occurred submitting your survey. Please try again.</div>';
            }
        });

    } catch (error) {
        if (formContainer) {
            formContainer.innerHTML = '<div class="voter-message">Error loading poll data. Please try again later.</div>';
        }
    }
}

document.addEventListener('DOMContentLoaded', loadPoll);