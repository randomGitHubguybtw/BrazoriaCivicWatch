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

    const allInputs = Array.from(document.querySelectorAll('.polling-dropdown-value'));
    const filledCount = allInputs.filter(input => input.value !== "").length;

    if (allInputs.length > 0) {
        if (filledCount === 0 && maxPageReached === 0) {
            progressBar.style.width = '0%';
        } else if (filledCount === allInputs.length) {
            progressBar.style.width = '100%';
        } else {
            const pageWeight = 75 / (totalSteps - 1 || 1);
            const dropdownRatio = Math.sqrt(filledCount) / Math.sqrt(allInputs.length || 1);
            const dropdownProgress = 23 * dropdownRatio;
            
            let progress = (maxPageReached * pageWeight) + dropdownProgress;
            
            progress = Math.min(progress, 98);
            progressBar.style.width = `${progress}%`;
        }
    } else {
        progressBar.style.width = '0%';
    }

    prevBtn.style.setProperty('display', currentStep === 0 ? 'none' : 'inline-flex', 'important');
    
    if (currentStep === totalSteps - 1) {
        nextBtn.style.setProperty('display', 'none', 'important');
        
        const allFilled = allInputs.length > 0 && filledCount === allInputs.length;
        
        if (allFilled) {
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

        const [electionsResponse, seatsResponse] = await Promise.all([
            fetch(`${API_BASE}/api/elections`),
            fetch(`${API_BASE}/api/seats`)
        ]);

        if (!electionsResponse.ok || !seatsResponse.ok) throw new Error();

        const allElections = await electionsResponse.json();
        const allSeats = await seatsResponse.json();

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

        const genPage1 = [
            { q: "Would you vote down-ballot for any party?", opts: ["Democrat", "Republican", "Other Party", "I would vote split-ballot"] },
            { q: "Which party do you generally support more?", opts: ["Democrat", "Republican", "Independent", "Other Party"] },
            { q: "Which party do you generally align yourself with?", opts: ["Democrat", "Republican", "Independent", "Other Party"] }
        ];

        const genPage2 = [
            { q: "Do you approve of Republicans in Brazoria County?", opts: ["Yes", "No", "Unsure"] },
            { q: "Do you approve of Republicans in general?", opts: ["Yes", "No", "Unsure"] },
            { q: "Do you approve of Democrats in general?", opts: ["Yes", "No", "Unsure"] },
            { q: "Do you approve of Democrats in Brazoria County?", opts: ["Yes", "No", "Unsure"] }
        ];

        const genPage3 = [
            { q: "How motivated are you to vote?", opts: ["Extremely motivated (I will vote)", "Somewhat motivated (I will probably vote)", "Motivated (I might vote)", "Unmotivated (I might not vote)", "Somewhat unmotivated (I probably will not vote)", "Extremely unmotivated (I will not vote)"] }
        ];

        [genPage1, genPage2, genPage3].forEach(chunk => {
            chunk.forEach(question => {
                let optionsHTML = '<div class="dropdown-option default-opt" data-value="">Select an option...</div>';
                question.opts.forEach(opt => {
                    optionsHTML += `<div class="dropdown-option" data-value="${opt}">${opt}</div>`;
                });

                formHTML += `
                    <div class="polling-card" data-page="${globalPageIndex}">
                        <h3 class="polling-card-title">${question.q}</h3>
                        <p class="seat-subtitle">General Question</p>
                        <div class="custom-dropdown" tabindex="0">
                            <div class="dropdown-selected">Select an option...</div>
                            <div class="dropdown-options">
                                ${optionsHTML}
                            </div>
                            <input type="hidden" name="${question.q}" class="polling-dropdown-value" required>
                        </div>
                    </div>
                `;
            });
            globalPageIndex++;
        });

        pages.forEach((pageSeats) => {
            for (const [seatName, candidatesList] of pageSeats) {
                const districtString = candidatesList[0].city || "General Election";
                let formattedDistrictString = districtString;
                if (formattedDistrictString.includes('_')) {
                    const parts = formattedDistrictString.split('_');
                    formattedDistrictString = `${parts[1].trim()} ${parts[0].trim()}`;
                }

                let optionsHTML = '<div class="dropdown-option default-opt" data-value="">Select a candidate...</div>';
                optionsHTML += '<div class="dropdown-option" data-value="Unsure">Unsure</div>';
                optionsHTML += '<div class="dropdown-option" data-value="I don\'t know these candidates">I don\'t know these candidates</div>';
                
                candidatesList.forEach(c => {
                    const candidateDisplayName = c.name || 'Unknown';
                    const partyName = c.party || 'Independent';
                    const isIncumbent = c.incumbent && (c.incumbent.toString().toLowerCase() === 'y' || c.incumbent.toString().toLowerCase() === 'yes' || c.incumbent.toString() === '1' || c.incumbent.toString().toLowerCase() === 'true');
                    const incumbentTag = isIncumbent ? ', Incumbent' : '';
                    const fullText = `${candidateDisplayName} (${partyName})${incumbentTag}`;
                    
                    optionsHTML += `<div class="dropdown-option" data-value="${fullText}">${fullText}</div>`;
                });
                
                formHTML += `
                    <div class="polling-card" data-page="${globalPageIndex}">
                        <h3 class="polling-card-title">${seatName}</h3>
                        <p class="seat-subtitle">District: ${formattedDistrictString}</p>
                        <div class="custom-dropdown" tabindex="0">
                            <div class="dropdown-selected">Select a candidate...</div>
                            <div class="dropdown-options">
                                ${optionsHTML}
                            </div>
                            <input type="hidden" name="${seatName}" class="polling-dropdown-value" required>
                        </div>
                    </div>
                `;
            }
            globalPageIndex++;
        });
        
        totalSteps = globalPageIndex;
        maxPageReached = 0;
        
        cardsContainer.innerHTML = formHTML;
        navContainer.style.display = 'flex';
        
        const dropdowns = document.querySelectorAll('.custom-dropdown');
        dropdowns.forEach(dropdown => {
            const selected = dropdown.querySelector('.dropdown-selected');
            const optionsContainer = dropdown.querySelector('.dropdown-options');
            const optionsList = dropdown.querySelectorAll('.dropdown-option');
            const hiddenInput = dropdown.querySelector('.polling-dropdown-value');

            selected.addEventListener('click', (e) => {
                document.querySelectorAll('.dropdown-options.show').forEach(opt => {
                    if(opt !== optionsContainer) opt.classList.remove('show');
                });
                optionsContainer.classList.toggle('show');
                dropdown.classList.toggle('open');
            });

            optionsList.forEach(option => {
                option.addEventListener('click', () => {
                    if (option.dataset.value === "") {
                        if(selected.innerText.includes('candidate')) {
                            selected.innerText = "Select a candidate...";
                        } else {
                            selected.innerText = "Select an option...";
                        }
                        hiddenInput.value = "";
                    } else {
                        selected.innerText = option.innerText;
                        hiddenInput.value = option.dataset.value;
                    }
                    optionsContainer.classList.remove('show');
                    dropdown.classList.remove('open');
                    
                    updateUI();
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

        nextBtn.addEventListener('click', () => {
            const activeCards = document.querySelectorAll(`.polling-card[data-page="${currentStep}"]`);
            let allValid = true;
            
            activeCards.forEach(card => {
                const hiddenInput = card.querySelector('.polling-dropdown-value');
                const dropdownEl = card.querySelector('.custom-dropdown');
                
                if (!hiddenInput.value) {
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

        formContainer.addEventListener('submit', (e) => {
            e.preventDefault();
            
            let resultsString = "";
            const allCards = document.querySelectorAll('.polling-card');
            allCards.forEach(card => {
                const title = card.querySelector('.polling-card-title').innerText.trim();
                const subtitle = card.querySelector('.seat-subtitle').innerText.trim();
                const selectedVal = card.querySelector('.dropdown-selected').innerText.trim();
                resultsString += `${title} (${subtitle}): ${selectedVal}, `;
            });
            console.log(resultsString);

            formContainer.innerHTML = '<div class="voter-message">Thank you for your feedback! Your responses have been recorded.</div>';
            document.querySelector('.progress-wrapper').style.display = 'none';
        });

    } catch (error) {
        if (formContainer) {
            formContainer.innerHTML = '<div class="voter-message">Error loading poll data. Please try again later.</div>';
        }
    }
}

document.addEventListener('DOMContentLoaded', loadPoll);