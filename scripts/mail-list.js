document.addEventListener('click', (e) => {
  if (e.target.closest('.remove-tag')) {
    const tag = e.target.closest('.selected-tag');
    if (tag) tag.remove();
    return;
  }

  const wrapper = e.target.closest('.multi-select-wrapper');
  if (wrapper && wrapper.closest('.form-container')) {
    if (!e.target.closest('.mail-dropdown-item') && !e.target.closest('.remove-tag')) {
      const clickedInput = wrapper.querySelector('.mail-dropdown-input');
      closeAllFormDropdowns(clickedInput);
      
      const dropdownBox = wrapper.closest('.mail-dropdown-box');
      const dropdownList = dropdownBox.querySelector('.mail-dropdown-list');
      
      clickedInput.readOnly = false;
      clickedInput.removeAttribute('readonly');
      clickedInput.focus();
      
      if (dropdownList && !dropdownList.classList.contains('show')) {
        dropdownList.classList.add('show');
        dropdownList.style.border = '';
        Array.from(dropdownList.children).forEach(li => li.style.display = 'block');
      }
      return;
    }
  }

  const clickedItem = e.target.closest('.mail-dropdown-item');
  if (clickedItem && clickedItem.closest('.form-container')) {
    const dropdownBox = clickedItem.closest('.mail-dropdown-box');
    const input = dropdownBox.querySelector('.mail-dropdown-input');
    const container = dropdownBox.querySelector('.mail-selected-items');
    const text = clickedItem.textContent;
   
    if (text.startsWith('All ')) {
        container.innerHTML = '';
        addTag(container, text);
    } else {
        Array.from(container.children).forEach(child => {
            if (child.dataset.value.startsWith('All ')) {
                child.remove();
            }
        });
        const exists = Array.from(container.children).some(child => child.dataset.value === text);
        if (!exists) {
            addTag(container, text);
        }
    }
    
    input.value = '';
    Array.from(dropdownBox.querySelector('.mail-dropdown-list').children).forEach(li => li.style.display = 'block');
    input.focus();
    return;
  }

  if (e.target.closest('.form-container') && !e.target.closest('.mail-dropdown-box') && !e.target.closest('.remove-tag')) {
    closeAllFormDropdowns();
  }
});

const observer = new MutationObserver((mutationsList) => {
  for (const mutation of mutationsList) {
    if (mutation.type === 'childList') {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === 1) {
          if (node.classList.contains('mail-dropdown-input') && node.closest('.form-container')) {
            node.setAttribute('readonly', 'true');
            node.readOnly = true;
          }
          if (node.querySelectorAll) {
            const inputs = node.querySelectorAll('.form-container .mail-dropdown-input:not([readonly])');
            inputs.forEach(input => {
              input.setAttribute('readonly', 'true');
              input.readOnly = true;
            });
          }
        }
      });
    }
  }
});
observer.observe(document.body, { childList: true, subtree: true });

document.querySelectorAll('.form-container .mail-dropdown-input:not([readonly])').forEach(input => {
  input.setAttribute('readonly', 'true');
  input.readOnly = true;
});

document.addEventListener('touchstart', (e) => {
  const touchInput = e.target.closest('.mail-dropdown-input');
  if (touchInput && touchInput.closest('.form-container')) {
    touchInput.readOnly = false;
    touchInput.removeAttribute('readonly');
  }
}, { passive: true });

document.addEventListener('input', (e) => {
  if (e.target.classList.contains('mail-dropdown-input') && e.target.closest('.form-container')) {
    const filterText = e.target.value.toLowerCase();
    const dropdownBox = e.target.closest('.mail-dropdown-box');
    const dropdownList = dropdownBox.querySelector('.mail-dropdown-list');
   
    if (dropdownList) {
      let hasVisible = false;
      Array.from(dropdownList.children).forEach(li => {
        const itemText = li.textContent.toLowerCase();
        if (itemText.includes(filterText)) {
          li.style.display = 'block';
          hasVisible = true;
        } else {
          li.style.display = 'none';
        }
      });
      if (!hasVisible) {
        dropdownList.style.border = 'none';
      } else {
        dropdownList.style.border = '';
      }
    }
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.target.classList.contains('mail-dropdown-input') && e.target.closest('.form-container')) {
    e.preventDefault();
    const dropdownBox = e.target.closest('.mail-dropdown-box');
    const dropdownList = dropdownBox.querySelector('.mail-dropdown-list');
   
    if (dropdownList && dropdownList.classList.contains('show')) {
      const visibleOption = Array.from(dropdownList.children).find(li => li.style.display !== 'none');
      if (visibleOption) {
        const text = visibleOption.textContent;
        const container = dropdownBox.querySelector('.mail-selected-items');
        if (text.startsWith('All ')) {
            container.innerHTML = '';
            addTag(container, text);
        } else {
            Array.from(container.children).forEach(child => {
                if (child.dataset.value.startsWith('All ')) child.remove();
            });
            const exists = Array.from(container.children).some(child => child.dataset.value === text);
            if (!exists) addTag(container, text);
        }
        e.target.value = '';
        Array.from(dropdownBox.querySelector('.mail-dropdown-list').children).forEach(li => li.style.display = 'block');
      } else {
        e.target.value = '';
        closeAllFormDropdowns();
      }
    }
  }
});

function addTag(container, text) {
  const tag = document.createElement('div');
  tag.className = 'selected-tag';
  tag.dataset.value = text;
  tag.innerHTML = `<span>${text}</span> <span class="remove-tag">✕</span>`;
  container.appendChild(tag);
}

function closeAllFormDropdowns(exceptInput = null) {
  document.querySelectorAll('.form-container .mail-dropdown-box').forEach(box => {
    const input = box.querySelector('.mail-dropdown-input');
    const list = box.querySelector('.mail-dropdown-list');
    if (input && list && input !== exceptInput) {
      list.classList.remove('show');
      list.style.border = '';
      input.setAttribute('readonly', 'true');
      input.readOnly = true;
      input.value = '';
    }
  });
}

function updateInputsFromData(data) {
  const container = document.querySelector('.form-container');
  if (!container || !data) return;
  const mappings = {
    '.mail-city-search': data.city,
    '.mail-isd-search': data.isd,
    '.mail-board-search': data.boardOfEd,
    '.mail-congress-search': data.congressDist,
    '.mail-precinct-search': data.precinct,
    '.mail-staterep-search': data.stateRep,
    '.mail-statesen-search': data.stateSen,
    '.mail-college-search': data.college,
    '.mail-drainage-search': data.drainage,
    '.mail-hospital-search': data.hospital,
    '.mail-mud-search': data.mud,
    '.mail-navigation-search': data.navigation
  };
  
  for (const [selector, value] of Object.entries(mappings)) {
    const input = document.querySelector(`.form-container ${selector}`);
    if(input && value) {
      const parentContainer = input.closest('.multi-select-wrapper').querySelector('.mail-selected-items');
      parentContainer.innerHTML = ''; 
      addTag(parentContainer, value);
    }
  }
}

function initializeLocationsFromStorage() {
  const data = {
    city: sessionStorage.getItem('city') || localStorage.getItem('city') || 'All Cities',
    isd: sessionStorage.getItem('isd') || localStorage.getItem('isd') || 'All ISDs',
    boardOfEd: sessionStorage.getItem('boardOfEd') || localStorage.getItem('boardOfEd') || 'All State Board of Education Districts',
    congressDist: sessionStorage.getItem('congressDist') || localStorage.getItem('congressDist') || 'All Congressional Districts',
    precinct: sessionStorage.getItem('precinct') || localStorage.getItem('precinct') || 'All Justice of the Peace Precincts',
    stateRep: sessionStorage.getItem('stateRep') || localStorage.getItem('stateRep') || 'All State Representative Districts',
    stateSen: sessionStorage.getItem('stateSen') || localStorage.getItem('stateSen') || 'All State Senate Districts',
    college: sessionStorage.getItem('college') || localStorage.getItem('college') || 'All College Districts',
    drainage: sessionStorage.getItem('drainage') || localStorage.getItem('drainage') || 'All Drainage Districts',
    hospital: sessionStorage.getItem('hospital') || localStorage.getItem('hospital') || 'All Hospital Districts',
    mud: sessionStorage.getItem('mud') || localStorage.getItem('mud') || 'All MUDs',
    navigation: sessionStorage.getItem('navigation') || localStorage.getItem('navigation') || 'All Navigation Precincts'
  };
  updateInputsFromData(data);
}

window.addEventListener('locationBackgroundUpdated', (e) => {
  updateInputsFromData(e.detail);
});

const dropdownsListContainer = document.querySelector('.js-dropdowns-list');

if (dropdownsListContainer) {
  dropdownsListContainer.style.display = 'flex';
  dropdownsListContainer.style.flexDirection = 'column';
  dropdownsListContainer.style.alignItems = 'center';
  dropdownsListContainer.style.padding = '10px 0';

  dropdownsListContainer.innerHTML = `
    <div class="mail-dropdown-box" style="margin-bottom: 12px; width: 60vw; max-width: 400px;">
      <label class="form-label" style="display: block; text-align: center; color: var(--black-text-color); font-weight: bold;">City Jurisdiction</label>
      <div class="dropdown-wrapper multi-select-wrapper">
        <div class="mail-selected-items"></div>
        <input type="text" placeholder="Add City..." class="mail-city-search mail-dropdown-input custom-multi-input" style="cursor: pointer;"></input>
        <ul class="dropdown-search mail-dropdown-list" style="color: var(--black-text-color);">
          <li class="mail-dropdown-item">Alvin</li>
          <li class="mail-dropdown-item">Angleton</li>
          <li class="mail-dropdown-item">Bailey's Prairie</li>
          <li class="mail-dropdown-item">Bonney</li>
          <li class="mail-dropdown-item">Brazoria</li>
          <li class="mail-dropdown-item">Brookside Village</li>
          <li class="mail-dropdown-item">Clute</li>
          <li class="mail-dropdown-item">Danbury</li>
          <li class="mail-dropdown-item">Freeport</li>
          <li class="mail-dropdown-item">Hillcrest Village</li>
          <li class="mail-dropdown-item">Holiday Lakes</li>
          <li class="mail-dropdown-item">Iowa Colony</li>
          <li class="mail-dropdown-item">Jones Creek</li>
          <li class="mail-dropdown-item">Lake Jackson</li>
          <li class="mail-dropdown-item">Liverpool</li>
          <li class="mail-dropdown-item">Manvel</li>
          <li class="mail-dropdown-item">Oyster Creek</li>
          <li class="mail-dropdown-item">Pearland</li>
          <li class="mail-dropdown-item">Quintana</li>
          <li class="mail-dropdown-item">Richwood</li>
          <li class="mail-dropdown-item">Sandy Point</li>
          <li class="mail-dropdown-item">Surfside</li>
          <li class="mail-dropdown-item">Sweeny</li>
          <li class="mail-dropdown-item">West Columbia</li>
          <li class="mail-dropdown-item">All Cities</li>
        </ul>
      </div>
    </div>
   
    <div class="mail-dropdown-box" style="margin-bottom: 12px; width: 60vw; max-width: 400px;">
      <label class="form-label" style="display: block; text-align: center; color: var(--black-text-color); font-weight: bold;">Independent School District</label>
      <div class="dropdown-wrapper multi-select-wrapper">
        <div class="mail-selected-items"></div>
        <input type="text" placeholder="Add ISD..." class="mail-isd-search mail-dropdown-input custom-multi-input" style="cursor: pointer;"></input>
        <ul class="dropdown-search mail-dropdown-list" style="color: var(--black-text-color);">
          <li class="mail-dropdown-item">Alvin ISD</li>
          <li class="mail-dropdown-item">Angleton ISD</li>
          <li class="mail-dropdown-item">Brazosport ISD</li>
          <li class="mail-dropdown-item">Columbia-Brazoria ISD</li>
          <li class="mail-dropdown-item">Damon ISD</li>
          <li class="mail-dropdown-item">Danbury ISD</li>
          <li class="mail-dropdown-item">Friendswood ISD</li>
          <li class="mail-dropdown-item">Pearland ISD</li>
          <li class="mail-dropdown-item">Sweeny ISD</li>
          <li class="mail-dropdown-item">All ISDs</li>
        </ul>
      </div>
    </div>

    <div class="mail-dropdown-box" style="margin-bottom: 12px; width: 60vw; max-width: 400px;">
      <label class="form-label" style="display: block; text-align: center; color: var(--black-text-color); font-weight: bold;">State Board of Education District</label>
      <div class="dropdown-wrapper multi-select-wrapper">
        <div class="mail-selected-items"></div>
        <input type="text" placeholder="Add Board of Education..." class="mail-board-search mail-dropdown-input custom-multi-input" style="cursor: pointer;"></input>
        <ul class="dropdown-search mail-dropdown-list" style="color: var(--black-text-color);">
          <li class="mail-dropdown-item">District 7</li>
          <li class="mail-dropdown-item">District 8</li>
          <li class="mail-dropdown-item">All State Board of Education Districts</li>
        </ul>
      </div>
    </div>

    <div class="mail-dropdown-box" style="margin-bottom: 12px; width: 60vw; max-width: 400px;">
      <label class="form-label" style="display: block; text-align: center; color: var(--black-text-color); font-weight: bold;">Congressional District</label>
      <div class="dropdown-wrapper multi-select-wrapper">
        <div class="mail-selected-items"></div>
        <input type="text" placeholder="Add Congress District..." class="mail-congress-search mail-dropdown-input custom-multi-input" style="cursor: pointer;"></input>
        <ul class="dropdown-search mail-dropdown-list" style="color: var(--black-text-color);">
          <li class="mail-dropdown-item">District 14</li>
          <li class="mail-dropdown-item">District 22</li>
          <li class="mail-dropdown-item">All Congressional Districts</li>
        </ul>
      </div>
    </div>

    <div class="mail-dropdown-box" style="margin-bottom: 12px; width: 60vw; max-width: 400px;">
      <label class="form-label" style="display: block; text-align: center; color: var(--black-text-color); font-weight: bold;">Precinct (Justice of the Peace and Commissioner)</label>
      <div class="dropdown-wrapper multi-select-wrapper">
        <div class="mail-selected-items"></div>
        <input type="text" placeholder="Add Precinct..." class="mail-precinct-search mail-dropdown-input custom-multi-input" style="cursor: pointer;"></input>
        <ul class="dropdown-search mail-dropdown-list" style="color: var(--black-text-color);">
          <li class="mail-dropdown-item">Precinct 1</li>
          <li class="mail-dropdown-item">Precinct 2</li>
          <li class="mail-dropdown-item">Precinct 3</li>
          <li class="mail-dropdown-item">Precinct 4</li>
          <li class="mail-dropdown-item">All Justice of the Peace Precincts</li>
        </ul>
      </div>
    </div>

    <div class="mail-dropdown-box" style="margin-bottom: 12px; width: 60vw; max-width: 400px;">
      <label class="form-label" style="display: block; text-align: center; color: var(--black-text-color); font-weight: bold;">State Representative District</label>
      <div class="dropdown-wrapper multi-select-wrapper">
        <div class="mail-selected-items"></div>
        <input type="text" placeholder="Add State Rep District..." class="mail-staterep-search mail-dropdown-input custom-multi-input" style="cursor: pointer;"></input>
        <ul class="dropdown-search mail-dropdown-list" style="color: var(--black-text-color);">
          <li class="mail-dropdown-item">District 25</li>
          <li class="mail-dropdown-item">District 29</li>
          <li class="mail-dropdown-item">District 85</li>
          <li class="mail-dropdown-item">All State Representative Districts</li>
        </ul>
      </div>
    </div>

    <div class="mail-dropdown-box" style="margin-bottom: 12px; width: 60vw; max-width: 400px;">
      <label class="form-label" style="display: block; text-align: center; color: var(--black-text-color); font-weight: bold;">State Senate District</label>
      <div class="dropdown-wrapper multi-select-wrapper">
        <div class="mail-selected-items"></div>
        <input type="text" placeholder="Add State Sen District..." class="mail-statesen-search mail-dropdown-input custom-multi-input" style="cursor: pointer;"></input>
        <ul class="dropdown-search mail-dropdown-list" style="color: var(--black-text-color);">
          <li class="mail-dropdown-item">District 11</li>
          <li class="mail-dropdown-item">District 17</li>
          <li class="mail-dropdown-item">All State Senate Districts</li>
        </ul>
      </div>
    </div>

    <div class="mail-dropdown-box" style="margin-bottom: 12px; width: 60vw; max-width: 400px;">
      <label class="form-label" style="display: block; text-align: center; color: var(--black-text-color); font-weight: bold;">College District</label>
      <div class="dropdown-wrapper multi-select-wrapper">
        <div class="mail-selected-items"></div>
        <input type="text" placeholder="Add College District..." class="mail-college-search mail-dropdown-input custom-multi-input" style="cursor: pointer;"></input>
        <ul class="dropdown-search mail-dropdown-list" style="color: var(--black-text-color);">
          <li class="mail-dropdown-item">Alvin Community College District</li>
          <li class="mail-dropdown-item">Brazosport College District</li>
          <li class="mail-dropdown-item">All College Districts</li>
        </ul>
      </div>
    </div>

    <div class="mail-dropdown-box" style="margin-bottom: 12px; width: 60vw; max-width: 400px;">
      <label class="form-label" style="display: block; text-align: center; color: var(--black-text-color); font-weight: bold;">Drainage District</label>
      <div class="dropdown-wrapper multi-select-wrapper">
        <div class="mail-selected-items"></div>
        <input type="text" placeholder="Add Drainage District..." class="mail-drainage-search mail-dropdown-input custom-multi-input" style="cursor: pointer;"></input>
        <ul class="dropdown-search mail-dropdown-list" style="color: var(--black-text-color);">
          <li class="mail-dropdown-item">Angleton Drainage Dist.</li>
          <li class="mail-dropdown-item">Brazoria Co. Conservation & Reclamation Dist.</li>
          <li class="mail-dropdown-item">Danbury Drainage Dist.</li>
          <li class="mail-dropdown-item">Iowa Colony Drainage Dist.</li>
          <li class="mail-dropdown-item">Pearland Drainage Dist.</li>
          <li class="mail-dropdown-item">Velasco Drainage Dist.</li>
          <li class="mail-dropdown-item">West Brazoria County Drainage Dist.</li>
          <li class="mail-dropdown-item">All Drainage Districts</li>
        </ul>
      </div>
    </div>

    <div class="mail-dropdown-box" style="margin-bottom: 12px; width: 60vw; max-width: 400px;">
      <label class="form-label" style="display: block; text-align: center; color: var(--black-text-color); font-weight: bold;">Hospital District</label>
      <div class="dropdown-wrapper multi-select-wrapper">
        <div class="mail-selected-items"></div>
        <input type="text" placeholder="Add Hospital District..." class="mail-hospital-search mail-dropdown-input custom-multi-input" style="cursor: pointer;"></input>
        <ul class="dropdown-search mail-dropdown-list" style="color: var(--black-text-color);">
          <li class="mail-dropdown-item">Angleton-Danbury Hospital District</li>
          <li class="mail-dropdown-item">Sweeny Hospital District</li>
          <li class="mail-dropdown-item">West Columbia-Damon Hospital District</li>
          <li class="mail-dropdown-item">All Hospital Districts</li>
        </ul>
      </div>
    </div>

    <div class="mail-dropdown-box" style="margin-bottom: 12px; width: 60vw; max-width: 400px;">
      <label class="form-label" style="display: block; text-align: center; color: var(--black-text-color); font-weight: bold;">Municipal Utility District (MUD)</label>
      <div class="dropdown-wrapper multi-select-wrapper">
        <div class="mail-selected-items"></div>
        <input type="text" placeholder="Add MUD..." class="mail-mud-search mail-dropdown-input custom-multi-input" style="cursor: pointer;"></input>
        <ul class="dropdown-search mail-dropdown-list" style="color: var(--black-text-color);">
          <li class="mail-dropdown-item">Brazoria / Fort Bend MUD (#3)</li>
          <li class="mail-dropdown-item">Brazoria County Fresh Water Supply District (#1)</li>
          <li class="mail-dropdown-item">Brazoria County Fresh Water Supply District (#2)</li>
          <li class="mail-dropdown-item">Brazoria County MUD (#2)</li>
          <li class="mail-dropdown-item">Brazoria County MUD (#3)</li>
          <li class="mail-dropdown-item">Brazoria County MUD (#6)</li>
          <li class="mail-dropdown-item">Brazoria County MUD (#12)</li>
          <li class="mail-dropdown-item">Brazoria County MUD (#13)</li>
          <li class="mail-dropdown-item">Brazoria County MUD (#14)</li>
          <li class="mail-dropdown-item">Brazoria County MUD (#15)</li>
          <li class="mail-dropdown-item">Brazoria County MUD (#16)</li>
          <li class="mail-dropdown-item">Brazoria County MUD (#17)</li>
          <li class="mail-dropdown-item">Brazoria County MUD (#18)</li>
          <li class="mail-dropdown-item">Brazoria County MUD (#19)</li>
          <li class="mail-dropdown-item">Brazoria County MUD (#23)</li>
          <li class="mail-dropdown-item">Brazoria County MUD (#24)</li>
          <li class="mail-dropdown-item">Brazoria County MUD (#25)</li>
          <li class="mail-dropdown-item">Brazoria County MUD (#28)</li>
          <li class="mail-dropdown-item">Brazoria County MUD (#29)</li>
          <li class="mail-dropdown-item">Brazoria County MUD (#30)</li>
          <li class="mail-dropdown-item">Brazoria County MUD (#34)</li>
          <li class="mail-dropdown-item">Brazoria County MUD (#35)</li>
          <li class="mail-dropdown-item">Brazoria County MUD (#36)</li>
          <li class="mail-dropdown-item">Brazoria County MUD (#38)</li>
          <li class="mail-dropdown-item">Brazoria County MUD (#39)</li>
          <li class="mail-dropdown-item">Brazoria County MUD (#40)</li>
          <li class="mail-dropdown-item">Brazoria County MUD (#42)</li>
          <li class="mail-dropdown-item">Brazoria County MUD (#43)</li>
          <li class="mail-dropdown-item">Brazoria County MUD (#44)</li>
          <li class="mail-dropdown-item">Brazoria County MUD (#47)</li>
          <li class="mail-dropdown-item">Brazoria County MUD (#48)</li>
          <li class="mail-dropdown-item">Brazoria County MUD (#49)</li>
          <li class="mail-dropdown-item">Brazoria County MUD (#51)</li>
          <li class="mail-dropdown-item">Brazoria County MUD (#53)</li>
          <li class="mail-dropdown-item">Brazoria County MUD (#55)</li>
          <li class="mail-dropdown-item">Brazoria County MUD (#56)</li>
          <li class="mail-dropdown-item">Brazoria County MUD (#57)</li>
          <li class="mail-dropdown-item">Brazoria County MUD (#61)</li>
          <li class="mail-dropdown-item">Brazoria County MUD (#62)</li>
          <li class="mail-dropdown-item">Brazoria County MUD (#64)</li>
          <li class="mail-dropdown-item">Brazoria County MUD (#66)</li>
          <li class="mail-dropdown-item">Brazoria County MUD (#67)</li>
          <li class="mail-dropdown-item">Brazoria County MUD (#69)</li>
          <li class="mail-dropdown-item">Brazoria County MUD (#70)</li>
          <li class="mail-dropdown-item">Brazoria County MUD (#73)</li>
          <li class="mail-dropdown-item">Brazoria County MUD (#81)</li>
          <li class="mail-dropdown-item">Brazoria County MUD (#82)</li>
          <li class="mail-dropdown-item">Brazoria County MUD (#83)</li>
          <li class="mail-dropdown-item">Brazoria County MUD (#87)</li>
          <li class="mail-dropdown-item">Brazoria County MUD (#88)</li>
          <li class="mail-dropdown-item">Brazoria County MUD (#89)</li>
          <li class="mail-dropdown-item">Brazoria County MUD (#92)</li>
          <li class="mail-dropdown-item">Brazoria-Fort Bend County MUD (#1)</li>
          <li class="mail-dropdown-item">Commodore Cove Improvement District</li>
          <li class="mail-dropdown-item">Folletts Island Water Supply District</li>
          <li class="mail-dropdown-item">Freeport MUD (#1)</li>
          <li class="mail-dropdown-item">Harris-Brazoria Counties MUD (#509)</li>
          <li class="mail-dropdown-item">Inactive Brazoria County MUD (#63)</li>
          <li class="mail-dropdown-item">Inactive Brazoria County MUD (#65)</li>
          <li class="mail-dropdown-item">Inactive Brazoria County MUD (#80)</li>
          <li class="mail-dropdown-item">Inactive Rancho Isabella MUD</li>
          <li class="mail-dropdown-item">Meridiana MUD (#31)</li>
          <li class="mail-dropdown-item">Meridiana MUD (#32)</li>
          <li class="ask-dropdown-item">Oak Manor MUD</li>
          <li class="mail-dropdown-item">Rancho Isabella MUD</li>
          <li class="mail-dropdown-item">Sedona Lakes MUD (#1)</li>
          <li class="mail-dropdown-item">Shadow Creek Ranch MUD (#21)</li>
          <li class="mail-dropdown-item">Shadow Creek Ranch MUD (#22)</li>
          <li class="mail-dropdown-item">Shadow Creek Ranch MUD (#26)</li>
          <li class="mail-dropdown-item">Treasure Island MUD</li>
          <li class="mail-dropdown-item">Varner Creek Utility District</li>
          <li class="mail-dropdown-item">All MUDs</li>
        </ul>
      </div>
    </div>

    <div class="mail-dropdown-box" style="margin-bottom: 12px; width: 60vw; max-width: 400px;">
      <label class="form-label" style="display: block; text-align: center; color: var(--black-text-color); font-weight: bold;">Navigation District</label>
      <div class="dropdown-wrapper multi-select-wrapper">
        <div class="mail-selected-items"></div>
        <input type="text" placeholder="Add Navigation District..." class="mail-navigation-search mail-dropdown-input custom-multi-input" style="cursor: pointer;"></input>
        <ul class="dropdown-search mail-dropdown-list" style="color: var(--black-text-color);">
          <li class="mail-dropdown-item">Precinct 1</li>
          <li class="mail-dropdown-item">Precinct 2</li>
          <li class="mail-dropdown-item">Precinct 3</li>
          <li class="mail-dropdown-item">Precinct 4</li>
          <li class="mail-dropdown-item">All Navigation Precincts</li>
        </ul>
      </div>
    </div>

    <div style="display: flex; gap: 15px; justify-content: center; margin-top: 20px; width: 100%; flex-wrap: wrap;">
      <button class="js-no-route location-button" id="set-all-btn" style="width: auto; height: auto; padding: 10px 20px; font-size: 16px; border-radius: 4px; color: var(--black-text-color);">Set All</button>
      <button class="js-no-route location-button" id="set-none-btn" style="width: auto; height: auto; padding: 10px 20px; font-size: 16px; border-radius: 4px; color: var(--black-text-color);">Set None</button>
    </div>
  `;

  document.getElementById('set-all-btn').addEventListener('click', (e) => {
    e.preventDefault();
    const defaults = {
      '.mail-city-search': 'All Cities',
      '.mail-isd-search': 'All ISDs',
      '.mail-board-search': 'All State Board of Education Districts',
      '.mail-congress-search': 'All Congressional Districts',
      '.mail-precinct-search': 'All Justice of the Peace Precincts',
      '.mail-staterep-search': 'All State Representative Districts',
      '.mail-statesen-search': 'All State Senate Districts',
      '.mail-college-search': 'All College Districts',
      '.mail-drainage-search': 'All Drainage Districts',
      '.mail-hospital-search': 'All Hospital Districts',
      '.mail-mud-search': 'All MUDs',
      '.mail-navigation-search': 'All Navigation Precincts'
    };
    for (const [selector, value] of Object.entries(defaults)) {
      const wrapper = document.querySelector(`.form-container ${selector}`)?.closest('.multi-select-wrapper');
      if (wrapper) {
         const container = wrapper.querySelector('.mail-selected-items');
         container.innerHTML = '';
         addTag(container, value);
      }
    }
  });

  document.getElementById('set-none-btn').addEventListener('click', (e) => {
    e.preventDefault();
    document.querySelectorAll('.form-container .mail-selected-items').forEach(el => {
      el.innerHTML = '';
    });
  });
}

const optInBtn = document.getElementById('opt-in-btn');
if (optInBtn) {
  optInBtn.addEventListener('click', async () => {
    const emailInput = document.getElementById('subscriber-email');
    const nameInput = document.getElementById('subscriber-name');
    const meetingNotifs = document.getElementById('meeting-notifs').checked ? 1 : 0;
    const electionNotifs = document.getElementById('election-notifs').checked ? 1 : 0;
    const interviewNotifs = document.getElementById('interview-notifs').checked ? 1 : 0;
    const messageEl = document.getElementById('form-message');
    
    const email = emailInput.value.trim();
    const name = nameInput.value.trim();

    if (!email || !email.includes('@')) {
      messageEl.style.color = 'red';
      messageEl.textContent = 'Please enter a valid email address.';
      return;
    }

    const locationPrefsArray = [];
    document.querySelectorAll('.form-container .mail-selected-items').forEach(container => {
      Array.from(container.children).forEach(tag => {
        const val = tag.dataset.value;
        if (val) {
          locationPrefsArray.push(val.replace(/ /g, '_'));
        }
      });
    });

    const locationPrefs = locationPrefsArray.length > 0 ? locationPrefsArray.join('-') + '-' : '';
    
    const API_BASE = 'https://api.brazoriacivicwatch.org';
    
    try {
      const response = await fetch(`${API_BASE}/api/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, locationPrefs, meetingNotifs, electionNotifs, interviewNotifs })
      });

      const data = await response.json();
      
      if (response.ok) {
        messageEl.style.color = 'green';
        messageEl.textContent = 'Successfully opted in! Thank you for joining.';
        emailInput.value = '';
        nameInput.value = '';
        document.querySelectorAll('.form-container .mail-selected-items').forEach(c => c.innerHTML = '');
      } else {
        messageEl.style.color = 'red';
        messageEl.textContent = data.error || 'An error occurred. Please try again.';
      }
    } catch (err) {
      messageEl.style.color = 'red';
      messageEl.textContent = 'Network error. Please try again later.';
    }
  });
}

initializeLocationsFromStorage();