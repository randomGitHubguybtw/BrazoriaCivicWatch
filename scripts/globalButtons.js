import { saveCityAndIsd, locationDataReady, forceRecalculate, runCoords } from './locationStore.js';
import { generateHTML } from './globalHTMLGenerate.js';
import { runSummary } from './globalSummaries.js';
import { renderSearch } from './globalArchive.js';

document.body.addEventListener('click', (event) => {
  const sidebar = document.querySelector('.js-sidebar');
  const screenOverlay = document.querySelector('.js-screen-overlay');
 
  if (event.target.closest('.js-burger') || event.target.classList.contains('js-burger')) {
    if (sidebar) sidebar.classList.toggle('active');
    if (screenOverlay) screenOverlay.classList.toggle('active');
    return;
  }

  if (event.target.classList.contains('js-screen-overlay') && !event.target.closest('.js-dropdown-item')) {
    if (sidebar) sidebar.classList.remove('active');
    if (screenOverlay) screenOverlay.classList.remove('active');
  }

  const routeTarget = event.target.closest('.js-div-button, .js-sidebar-button, .js-footer-text, button:not(.js-hands-off):not(.js-no-route)');
  if (!routeTarget || event.target.closest('.js-hands-off')) return;
  if (routeTarget.classList.contains('js-search-button')) return;

  const destination = routeTarget.dataset.target || routeTarget.getAttribute('href');
  const meeting = routeTarget.dataset.cityorisd;
  const targetDateData = routeTarget.dataset.targetdate ? new Date(routeTarget.dataset.targetdate) : new Date();

  if(destination === 'webpages/summary.html') {
    renderSummaryPage(targetDateData, meeting);
    window.location.href = destination;
  } else if (destination) {
    if (destination.startsWith('http://') || destination.startsWith('https://')) {
      window.open(destination, '_blank', 'noopener,noreferrer');
    } else {
      window.location.href = destination;
    }
  } else if (!routeTarget.classList.contains('js-no-route')) {
    event.preventDefault();
    window.location.href = "webpages/construction.html";
  }
});

const observer = new MutationObserver((mutationsList) => {
  for (const mutation of mutationsList) {
    if (mutation.type === 'childList') {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === 1) {
          if (node.classList.contains('js-dropdown-input')) {
            node.setAttribute('readonly', 'true');
            node.readOnly = true;
          }
          if (node.querySelectorAll) {
            const inputs = node.querySelectorAll('.js-dropdown-input:not([readonly])');
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

document.querySelectorAll('.js-dropdown-input:not([readonly])').forEach(input => {
  input.setAttribute('readonly', 'true');
  input.readOnly = true;
});

document.addEventListener('touchstart', (e) => {
  const touchInput = e.target.closest('.js-dropdown-input');
  if (touchInput) {
    touchInput.readOnly = false;
    touchInput.removeAttribute('readonly');
  }
}, { passive: true });

document.addEventListener('click', (e) => {
  const clickedInput = e.target.closest('.js-dropdown-input');
  if (clickedInput) {
    closeAllDropdowns(clickedInput);
   
    const dropdownBox = clickedInput.closest('.js-dropdown-box');
    const dropdownList = dropdownBox.querySelector('.js-dropdown-list');
   
    clickedInput.readOnly = false;
    clickedInput.removeAttribute('readonly');
    clickedInput.focus();

    if (dropdownList && !dropdownList.classList.contains('show')) {
      clickedInput.dataset.originalValue = clickedInput.value;
      clickedInput.value = '';
     
      dropdownList.classList.add('show');
      dropdownList.style.border = '';
      Array.from(dropdownList.children).forEach(li => li.style.display = 'block');
    }
    return;
  }

  const clickedItem = e.target.closest('.js-dropdown-item');
  if (clickedItem) {
    const dropdownBox = clickedItem.closest('.js-dropdown-box');
    const input = dropdownBox.querySelector('.js-dropdown-input');
   
    input.value = clickedItem.textContent;
   
    closeAllDropdowns();
    triggerSave(clickedItem.textContent);
    return;
  }

  if (!e.target.closest('.js-dropdown-box')) {
    closeAllDropdowns();
  }
});

document.addEventListener('input', (e) => {
  if (e.target.classList.contains('js-dropdown-input')) {
    const filterText = e.target.value.toLowerCase();
    const dropdownBox = e.target.closest('.js-dropdown-box');
    const dropdownList = dropdownBox.querySelector('.js-dropdown-list');
   
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
  if (e.key === 'Enter' && e.target.classList.contains('js-dropdown-input')) {
    e.preventDefault();
    const dropdownBox = e.target.closest('.js-dropdown-box');
    const dropdownList = dropdownBox.querySelector('.js-dropdown-list');
   
    if (dropdownList && dropdownList.classList.contains('show')) {
      const visibleOption = Array.from(dropdownList.children).find(li => li.style.display !== 'none');
     
      if (visibleOption) {
        e.target.value = visibleOption.textContent;
        closeAllDropdowns();
        triggerSave(visibleOption.textContent);
      } else {
        if (e.target.dataset.originalValue !== undefined) {
          e.target.value = e.target.dataset.originalValue;
        }
        closeAllDropdowns();
      }
    }
  }
});

function closeAllDropdowns(exceptInput = null) {
  document.querySelectorAll('.js-dropdown-box').forEach(box => {
    const input = box.querySelector('.js-dropdown-input');
    const list = box.querySelector('.js-dropdown-list');
   
    if (input && list && input !== exceptInput) {
      list.classList.remove('show');
      list.style.border = '';
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

function parseCoordString(coordStr) {
  if (!coordStr) return NaN;
  const clean = coordStr.toUpperCase().replace(/[^\d.NSEW-]/g, ' ');
  const parts = clean.trim().split(/\s+/);
  const isNegative = clean.includes('S') || clean.includes('W');
  let val = 0;
  if (parts.length > 0) val += parseFloat(parts[0]) || 0;
  if (parts.length > 1 && !isNaN(parseFloat(parts[1]))) val += parseFloat(parts[1]) / 60;
  if (parts.length > 2 && !isNaN(parseFloat(parts[2]))) val += parseFloat(parts[2]) / 3600;
  if (isNegative) val = -Math.abs(val);
  if (clean.includes('-') && !isNegative && val > 0) val = -val;
  return val;
}

function updateInputsFromData(data) {
  const container = document.querySelector('.js-dropdowns-list');
  if (!container || !data) return;
  const updateInput = (selector, value) => {
    const inputs = document.querySelectorAll(selector);
    inputs.forEach(input => {
        if (input && value) input.value = value;
    });
  };
  
  updateInput('.js-city-search', data.city);
  updateInput('.js-isd-search', data.isd);
  updateInput('.js-board-search', data.boardOfEd);
  updateInput('.js-congress-search', data.congressDist);
  updateInput('.js-precinct-search', data.precinct);
  updateInput('.js-staterep-search', data.stateRep);
  updateInput('.js-statesen-search', data.stateSen);
  updateInput('.js-college-search', data.college);
  updateInput('.js-drainage-search', data.drainage);
  updateInput('.js-hospital-search', data.hospital);
  updateInput('.js-mud-search', data.mud);
  updateInput('.js-navigation-search', data.navigation);
}

function triggerSave(meetingType = 'city') {
  const getVal = (selector, key) => {
    const inputs = Array.from(document.querySelectorAll(selector));
    for (let input of inputs) {
      if (input.value && input.value !== sessionStorage.getItem(key)) {
        return input.value;
      }
    }
    return inputs[0]?.value || sessionStorage.getItem(key) || '';
  };

  const city = getVal('.js-city-search', 'city');
  const isd = getVal('.js-isd-search', 'isd');
  const boardOfEd = getVal('.js-board-search', 'boardOfEd');
  const congressDist = getVal('.js-congress-search', 'congressDist');
  const precinct = getVal('.js-precinct-search', 'precinct');
  const stateRep = getVal('.js-staterep-search', 'stateRep');
  const stateSen = getVal('.js-statesen-search', 'stateSen');
  const college = getVal('.js-college-search', 'college');
  const drainage = getVal('.js-drainage-search', 'drainage');
  const hospital = getVal('.js-hospital-search', 'hospital');
  const mud = getVal('.js-mud-search', 'mud');
  const navigation = getVal('.js-navigation-search', 'navigation');

  const updatedData = saveCityAndIsd(city, isd, boardOfEd, congressDist, precinct, stateRep, stateSen, college, drainage, hospital, mud, navigation);
 
  const meetingDecide = (meetingType && meetingType.includes("ISD")) ? 'isd' : 'city';
 
  const sidebar = document.querySelector('.js-sidebar');
  const activeState = (sidebar && sidebar.classList.contains('active')) ? 'active' : null;

  generateHTML(updatedData.city, updatedData.isd, activeState);
 
  if (window.location.pathname === "/webpages/summary.html") {
    renderSummaryPage(new Date(), meetingDecide);
    window.location.href = "webpages/summary.html";
  }
  if (window.location.pathname === "/webpages/archive.html") {
    renderSearch();
  }
}

function renderSummaryPage(targetDate, cityOrIsd) {
  sessionStorage.setItem('triggerSummary', 'true');
  sessionStorage.setItem('cityOrIsd', cityOrIsd);
  sessionStorage.setItem('targetDate', targetDate.toISOString());
}

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

    const processGeo = (geoData, inputSelector, allText) => {
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

      const input = document.querySelector(inputSelector);
      if (input && input.nextElementSibling) {
        const ul = input.nextElementSibling;
        let html = '<li class="js-dropdown-item">None</li>';
        valid.forEach(v => {
          html += `<li class="js-dropdown-item">District ${v}</li>`;
        });
        html += `<li class="js-dropdown-item">${allText}</li>`;
        ul.innerHTML = html;
      }
    };

    setTimeout(() => processGeo(congressRes, '.js-congress-search', 'All Congressional Districts'), 10);
    setTimeout(() => processGeo(senateRes, '.js-statesen-search', 'All State Senate Districts'), 50);
    setTimeout(() => processGeo(repRes, '.js-staterep-search', 'All State Representative Districts'), 100);

  } catch (e) {
    console.error("Error dynamically loading districts:", e);
  }
}

const dropdownsListContainer = document.querySelector('.js-dropdowns-list');

if (dropdownsListContainer) {
  dropdownsListContainer.style.display = 'flex';
  dropdownsListContainer.style.flexDirection = 'column';
  dropdownsListContainer.style.alignItems = 'center';
  dropdownsListContainer.style.padding = '20px 0';

  dropdownsListContainer.innerHTML = `
    <div style="display: flex; flex-wrap: wrap; gap: 15px; justify-content: center; margin-bottom: 30px; max-width: 600px; width: 90vw;">
      <button class="js-no-route location-button" id="recalc-btn" style="width: auto; height: auto; padding: 10px 20px; font-size: 16px; border-radius: 4px; color: var(--black-text-color);">Recalculate Location</button>
      
      <div style="display: flex; gap: 10px; align-items: center; width: 100%; justify-content: center; flex-wrap: wrap;">
        <input type="text" id="lat-input" placeholder="Lat (e.g. 29.1843)" class="form-input" style="width: 140px; text-align: center; font-size: 14px; color: var(--black-text-color);">
        <input type="text" id="long-input" placeholder="Long (e.g. -95.4198)" class="form-input" style="width: 150px; text-align: center; font-size: 14px; color: var(--black-text-color);">
        <button class="js-no-route location-button" id="run-coords-btn" style="width: auto; height: auto; padding: 10px 15px; font-size: 14px; border-radius: 4px; color: var(--black-text-color);">Run Coordinates</button>
      </div>

      <div style="width: 100%; text-align: center; margin-top: 5px;">
        <select id="preset-coords" class="form-input" style="width: 250px; font-size: 14px; color: var(--black-text-color); cursor: pointer;">
          <option value="">Select Preset Coords...</option>
          <option value="29.4241,-95.2441">Alvin</option>
          <option value="29.1683,-95.4308">Angleton</option>
          <option value="29.0436,-95.5699">Brazoria</option>
          <option value="29.0266,-95.3986">Clute</option>
          <option value="28.9525,-95.3594">Freeport</option>
          <option value="29.0336,-95.4419">Lake Jackson</option>
          <option value="29.5583,-95.2753">Pearland</option>
          <option value="29.0397,-95.6983">Sweeny</option>
        </select>
      </div>
    </div>

    <div class="js-dropdown-box" style="margin-bottom: 12px; width: 60vw; max-width: 400px;">
      <label class="form-label" style="display: block; text-align: center; color: var(--black-text-color); font-weight: bold;">City Jurisdiction</label>
      <div class="dropdown-wrapper">
        <input type="text" placeholder="Select City..." class="location-dropdown city-dropdown js-city-search js-dropdown-input" style="border: inset 3px var(--accent-color); color: var(--black-text-color); cursor: pointer;"></input>
        <ul class="dropdown-search js-dropdown-list" style="color: var(--black-text-color);">
          <li class="js-dropdown-item">None</li>
          <li class="js-dropdown-item">Alvin</li>
          <li class="js-dropdown-item">Angleton</li>
          <li class="js-dropdown-item">Bailey's Prairie</li>
          <li class="js-dropdown-item">Bonney</li>
          <li class="js-dropdown-item">Brazoria</li>
          <li class="js-dropdown-item">Brookside Village</li>
          <li class="js-dropdown-item">Clute</li>
          <li class="js-dropdown-item">Danbury</li>
          <li class="js-dropdown-item">Freeport</li>
          <li class="js-dropdown-item">Hillcrest Village</li>
          <li class="js-dropdown-item">Holiday Lakes</li>
          <li class="js-dropdown-item">Iowa Colony</li>
          <li class="js-dropdown-item">Jones Creek</li>
          <li class="js-dropdown-item">Lake Jackson</li>
          <li class="js-dropdown-item">Liverpool</li>
          <li class="js-dropdown-item">Manvel</li>
          <li class="js-dropdown-item">Oyster Creek</li>
          <li class="js-dropdown-item">Pearland</li>
          <li class="js-dropdown-item">Quintana</li>
          <li class="js-dropdown-item">Richwood</li>
          <li class="js-dropdown-item">Sandy Point</li>
          <li class="js-dropdown-item">Surfside</li>
          <li class="js-dropdown-item">Sweeny</li>
          <li class="js-dropdown-item">West Columbia</li>
          <li class="js-dropdown-item">All Cities</li>
        </ul>
      </div>
    </div>
   
    <div class="js-dropdown-box" style="margin-bottom: 12px; width: 60vw; max-width: 400px;">
      <label class="form-label" style="display: block; text-align: center; color: var(--black-text-color); font-weight: bold;">Independent School District</label>
      <div class="dropdown-wrapper">
        <input type="text" placeholder="Select ISD..." class="location-dropdown school-dropdown js-isd-search js-dropdown-input" style="border: inset 3px var(--accent-color); color: var(--black-text-color); cursor: pointer;"></input>
        <ul class="dropdown-search js-dropdown-list" style="color: var(--black-text-color);">
          <li class="js-dropdown-item">None</li>
          <li class="js-dropdown-item">Alvin ISD</li>
          <li class="js-dropdown-item">Angleton ISD</li>
          <li class="js-dropdown-item">Brazosport ISD</li>
          <li class="js-dropdown-item">Columbia-Brazoria ISD</li>
          <li class="js-dropdown-item">Damon ISD</li>
          <li class="js-dropdown-item">Danbury ISD</li>
          <li class="js-dropdown-item">Friendswood ISD</li>
          <li class="js-dropdown-item">Pearland ISD</li>
          <li class="js-dropdown-item">Sweeny ISD</li>
          <li class="js-dropdown-item">All ISDs</li>
        </ul>
      </div>
    </div>

    <div class="js-dropdown-box" style="margin-bottom: 12px; width: 60vw; max-width: 400px;">
      <label class="form-label" style="display: block; text-align: center; color: var(--black-text-color); font-weight: bold;">State Board of Education District</label>
      <div class="dropdown-wrapper">
        <input type="text" placeholder="Select Board of Education..." class="location-dropdown js-board-search js-dropdown-input" style="border: inset 3px var(--accent-color); color: var(--black-text-color); cursor: pointer;"></input>
        <ul class="dropdown-search js-dropdown-list" style="color: var(--black-text-color);">
          <li class="js-dropdown-item">None</li>
          <li class="js-dropdown-item">District 7</li>
          <li class="js-dropdown-item">District 8</li>
          <li class="js-dropdown-item">All State Board of Education Districts</li>
        </ul>
      </div>
    </div>

    <div class="js-dropdown-box" style="margin-bottom: 12px; width: 60vw; max-width: 400px;">
      <label class="form-label" style="display: block; text-align: center; color: var(--black-text-color); font-weight: bold;">Congressional District</label>
      <div class="dropdown-wrapper">
        <input type="text" placeholder="Select Congress District..." class="location-dropdown js-congress-search js-dropdown-input" style="border: inset 3px var(--accent-color); color: var(--black-text-color); cursor: pointer;"></input>
        <ul class="dropdown-search js-dropdown-list" style="color: var(--black-text-color);">
          <li class="js-dropdown-item">Loading Districts...</li>
        </ul>
      </div>
    </div>

    <div class="js-dropdown-box" style="margin-bottom: 12px; width: 60vw; max-width: 400px;">
      <label class="form-label" style="display: block; text-align: center; color: var(--black-text-color); font-weight: bold;">Precinct (Justice of the Peace and Commissioner)</label>
      <div class="dropdown-wrapper">
        <input type="text" placeholder="Select Precinct..." class="location-dropdown js-precinct-search js-dropdown-input" style="border: inset 3px var(--accent-color); color: var(--black-text-color); cursor: pointer;"></input>
        <ul class="dropdown-search js-dropdown-list" style="color: var(--black-text-color);">
          <li class="js-dropdown-item">None</li>
          <li class="js-dropdown-item">Precinct 1</li>
          <li class="js-dropdown-item">Precinct 2</li>
          <li class="js-dropdown-item">Precinct 3</li>
          <li class="js-dropdown-item">Precinct 4</li>
          <li class="js-dropdown-item">All Justice of the Peace Precincts</li>
        </ul>
      </div>
    </div>

    <div class="js-dropdown-box" style="margin-bottom: 12px; width: 60vw; max-width: 400px;">
      <label class="form-label" style="display: block; text-align: center; color: var(--black-text-color); font-weight: bold;">State Representative District</label>
      <div class="dropdown-wrapper">
        <input type="text" placeholder="Select State Rep District..." class="location-dropdown js-staterep-search js-dropdown-input" style="border: inset 3px var(--accent-color); color: var(--black-text-color); cursor: pointer;"></input>
        <ul class="dropdown-search js-dropdown-list" style="color: var(--black-text-color);">
          <li class="js-dropdown-item">Loading Districts...</li>
        </ul>
      </div>
    </div>

    <div class="js-dropdown-box" style="margin-bottom: 12px; width: 60vw; max-width: 400px;">
      <label class="form-label" style="display: block; text-align: center; color: var(--black-text-color); font-weight: bold;">State Senate District</label>
      <div class="dropdown-wrapper">
        <input type="text" placeholder="Select State Sen District..." class="location-dropdown js-statesen-search js-dropdown-input" style="border: inset 3px var(--accent-color); color: var(--black-text-color); cursor: pointer;"></input>
        <ul class="dropdown-search js-dropdown-list" style="color: var(--black-text-color);">
          <li class="js-dropdown-item">Loading Districts...</li>
        </ul>
      </div>
    </div>

    <div class="js-dropdown-box" style="margin-bottom: 12px; width: 60vw; max-width: 400px;">
      <label class="form-label" style="display: block; text-align: center; color: var(--black-text-color); font-weight: bold;">College District</label>
      <div class="dropdown-wrapper">
        <input type="text" placeholder="Select College District..." class="location-dropdown js-college-search js-dropdown-input" style="border: inset 3px var(--accent-color); color: var(--black-text-color); cursor: pointer;"></input>
        <ul class="dropdown-search js-dropdown-list" style="color: var(--black-text-color);">
          <li class="js-dropdown-item">None</li>
          <li class="js-dropdown-item">Alvin Community College District</li>
          <li class="js-dropdown-item">Brazosport College District</li>
          <li class="js-dropdown-item">All College Districts</li>
        </ul>
      </div>
    </div>

    <div class="js-dropdown-box" style="margin-bottom: 12px; width: 60vw; max-width: 400px;">
      <label class="form-label" style="display: block; text-align: center; color: var(--black-text-color); font-weight: bold;">Drainage District</label>
      <div class="dropdown-wrapper">
        <input type="text" placeholder="Select Drainage District..." class="location-dropdown js-drainage-search js-dropdown-input" style="border: inset 3px var(--accent-color); color: var(--black-text-color); cursor: pointer;"></input>
        <ul class="dropdown-search js-dropdown-list" style="color: var(--black-text-color);">
          <li class="js-dropdown-item">None</li>
          <li class="js-dropdown-item">Angleton Drainage Dist.</li>
          <li class="js-dropdown-item">Brazoria Co. Conservation & Reclamation Dist.</li>
          <li class="js-dropdown-item">Danbury Drainage Dist.</li>
          <li class="js-dropdown-item">Iowa Colony Drainage Dist.</li>
          <li class="js-dropdown-item">Pearland Drainage Dist.</li>
          <li class="js-dropdown-item">Velasco Drainage Dist.</li>
          <li class="js-dropdown-item">West Brazoria County Drainage Dist.</li>
          <li class="js-dropdown-item">All Drainage Districts</li>
        </ul>
      </div>
    </div>

    <div class="js-dropdown-box" style="margin-bottom: 12px; width: 60vw; max-width: 400px;">
      <label class="form-label" style="display: block; text-align: center; color: var(--black-text-color); font-weight: bold;">Hospital District</label>
      <div class="dropdown-wrapper">
        <input type="text" placeholder="Select Hospital District..." class="location-dropdown js-hospital-search js-dropdown-input" style="border: inset 3px var(--accent-color); color: var(--black-text-color); cursor: pointer;"></input>
        <ul class="dropdown-search js-dropdown-list" style="color: var(--black-text-color);">
          <li class="js-dropdown-item">None</li>
          <li class="js-dropdown-item">Angleton-Danbury Hospital District</li>
          <li class="js-dropdown-item">Sweeny Hospital District</li>
          <li class="js-dropdown-item">West Columbia-Damon Hospital District</li>
          <li class="js-dropdown-item">All Hospital Districts</li>
        </ul>
      </div>
    </div>

    <div class="js-dropdown-box" style="margin-bottom: 12px; width: 60vw; max-width: 400px;">
      <label class="form-label" style="display: block; text-align: center; color: var(--black-text-color); font-weight: bold;">Municipal Utility District (MUD)</label>
      <div class="dropdown-wrapper">
        <input type="text" placeholder="Select MUD..." class="location-dropdown js-mud-search js-dropdown-input" style="border: inset 3px var(--accent-color); color: var(--black-text-color); cursor: pointer;"></input>
        <ul class="dropdown-search js-dropdown-list" style="color: var(--black-text-color);">
          <li class="js-dropdown-item">None</li>
          <li class="js-dropdown-item">Brazoria / Fort Bend MUD (#3)</li>
          <li class="js-dropdown-item">Brazoria County Fresh Water Supply District (#1)</li>
          <li class="js-dropdown-item">Brazoria County Fresh Water Supply District (#2)</li>
          <li class="js-dropdown-item">Brazoria County MUD (#2)</li>
          <li class="js-dropdown-item">Brazoria County MUD (#3)</li>
          <li class="js-dropdown-item">Brazoria County MUD (#6)</li>
          <li class="js-dropdown-item">Brazoria County MUD (#12)</li>
          <li class="js-dropdown-item">Brazoria County MUD (#13)</li>
          <li class="js-dropdown-item">Brazoria County MUD (#14)</li>
          <li class="js-dropdown-item">Brazoria County MUD (#15)</li>
          <li class="js-dropdown-item">Brazoria County MUD (#16)</li>
          <li class="js-dropdown-item">Brazoria County MUD (#17)</li>
          <li class="js-dropdown-item">Brazoria County MUD (#18)</li>
          <li class="js-dropdown-item">Brazoria County MUD (#19)</li>
          <li class="js-dropdown-item">Brazoria County MUD (#23)</li>
          <li class="js-dropdown-item">Brazoria County MUD (#24)</li>
          <li class="js-dropdown-item">Brazoria County MUD (#25)</li>
          <li class="js-dropdown-item">Brazoria County MUD (#28)</li>
          <li class="js-dropdown-item">Brazoria County MUD (#29)</li>
          <li class="js-dropdown-item">Brazoria County MUD (#30)</li>
          <li class="js-dropdown-item">Brazoria County MUD (#34)</li>
          <li class="js-dropdown-item">Brazoria County MUD (#35)</li>
          <li class="js-dropdown-item">Brazoria County MUD (#36)</li>
          <li class="js-dropdown-item">Brazoria County MUD (#38)</li>
          <li class="js-dropdown-item">Brazoria County MUD (#39)</li>
          <li class="js-dropdown-item">Brazoria County MUD (#40)</li>
          <li class="js-dropdown-item">Brazoria County MUD (#42)</li>
          <li class="js-dropdown-item">Brazoria County MUD (#43)</li>
          <li class="js-dropdown-item">Brazoria County MUD (#44)</li>
          <li class="js-dropdown-item">Brazoria County MUD (#47)</li>
          <li class="js-dropdown-item">Brazoria County MUD (#48)</li>
          <li class="js-dropdown-item">Brazoria County MUD (#49)</li>
          <li class="js-dropdown-item">Brazoria County MUD (#51)</li>
          <li class="js-dropdown-item">Brazoria County MUD (#53)</li>
          <li class="js-dropdown-item">Brazoria County MUD (#55)</li>
          <li class="js-dropdown-item">Brazoria County MUD (#56)</li>
          <li class="js-dropdown-item">Brazoria County MUD (#57)</li>
          <li class="js-dropdown-item">Brazoria County MUD (#61)</li>
          <li class="js-dropdown-item">Brazoria County MUD (#62)</li>
          <li class="js-dropdown-item">Brazoria County MUD (#64)</li>
          <li class="js-dropdown-item">Brazoria County MUD (#66)</li>
          <li class="js-dropdown-item">Brazoria County MUD (#67)</li>
          <li class="js-dropdown-item">Brazoria County MUD (#69)</li>
          <li class="js-dropdown-item">Brazoria County MUD (#70)</li>
          <li class="js-dropdown-item">Brazoria County MUD (#73)</li>
          <li class="js-dropdown-item">Brazoria County MUD (#81)</li>
          <li class="js-dropdown-item">Brazoria County MUD (#82)</li>
          <li class="js-dropdown-item">Brazoria County MUD (#83)</li>
          <li class="js-dropdown-item">Brazoria County MUD (#87)</li>
          <li class="js-dropdown-item">Brazoria County MUD (#88)</li>
          <li class="js-dropdown-item">Brazoria County MUD (#89)</li>
          <li class="js-dropdown-item">Brazoria County MUD (#92)</li>
          <li class="js-dropdown-item">Brazoria-Fort Bend County MUD (#1)</li>
          <li class="js-dropdown-item">Commodore Cove Improvement District</li>
          <li class="js-dropdown-item">Folletts Island Water Supply District</li>
          <li class="js-dropdown-item">Freeport MUD (#1)</li>
          <li class="js-dropdown-item">Harris-Brazoria Counties MUD (#509)</li>
          <li class="js-dropdown-item">Inactive Brazoria County MUD (#63)</li>
          <li class="js-dropdown-item">Inactive Brazoria County MUD (#65)</li>
          <li class="js-dropdown-item">Inactive Brazoria County MUD (#80)</li>
          <li class="js-dropdown-item">Inactive Rancho Isabella MUD</li>
          <li class="js-dropdown-item">Meridiana MUD (#31)</li>
          <li class="js-dropdown-item">Meridiana MUD (#32)</li>
          <li class="js-dropdown-item">Oak Manor MUD</li>
          <li class="js-dropdown-item">Rancho Isabella MUD</li>
          <li class="js-dropdown-item">Sedona Lakes MUD (#1)</li>
          <li class="js-dropdown-item">Shadow Creek Ranch MUD (#21)</li>
          <li class="js-dropdown-item">Shadow Creek Ranch MUD (#22)</li>
          <li class="js-dropdown-item">Shadow Creek Ranch MUD (#26)</li>
          <li class="js-dropdown-item">Treasure Island MUD</li>
          <li class="js-dropdown-item">Varner Creek Utility District</li>
          <li class="js-dropdown-item">All MUDs</li>
        </ul>
      </div>
    </div>

    <div class="js-dropdown-box" style="margin-bottom: 12px; width: 60vw; max-width: 400px;">
      <label class="form-label" style="display: block; text-align: center; color: var(--black-text-color); font-weight: bold;">Navigation District</label>
      <div class="dropdown-wrapper">
        <input type="text" placeholder="Select Navigation District..." class="location-dropdown js-navigation-search js-dropdown-input" style="border: inset 3px var(--accent-color); color: var(--black-text-color); cursor: pointer;"></input>
        <ul class="dropdown-search js-dropdown-list" style="color: var(--black-text-color);">
          <li class="js-dropdown-item">None</li>
          <li class="js-dropdown-item">Precinct 1</li>
          <li class="js-dropdown-item">Precinct 2</li>
          <li class="js-dropdown-item">Precinct 3</li>
          <li class="js-dropdown-item">Precinct 4</li>
          <li class="js-dropdown-item">All Navigation Precincts</li>
        </ul>
      </div>
    </div>

    <div style="display: flex; gap: 15px; justify-content: center; margin-top: 20px; width: 100%; flex-wrap: wrap;">
      <button class="js-no-route location-button" id="set-all-btn" style="width: auto; height: auto; padding: 10px 20px; font-size: 16px; border-radius: 4px; color: var(--black-text-color);">Set All</button>
      <button class="js-no-route location-button" id="set-none-btn" style="width: auto; height: auto; padding: 10px 20px; font-size: 16px; border-radius: 4px; color: var(--black-text-color);">Set None</button>
    </div>
  `;

  document.getElementById('recalc-btn').addEventListener('click', async (e) => {
    e.preventDefault();
    const btn = e.target;
    const originalText = btn.textContent;
    let dots = 1;
    btn.textContent = "Recalculating.";
   
    const interval = setInterval(() => {
      dots = (dots % 3) + 1;
      btn.textContent = "Recalculating" + ".".repeat(dots);
    }, 400);

    try {
      const data = await forceRecalculate();
      if (data) {
        updateInputsFromData(data);
        triggerSave('city');
      }
    } catch (error) {
    } finally {
      clearInterval(interval);
      btn.textContent = originalText;
    }
  });

  document.getElementById('run-coords-btn').addEventListener('click', async (e) => {
    e.preventDefault();
    const latStr = document.getElementById('lat-input').value;
    const longStr = document.getElementById('long-input').value;
    const lat = parseCoordString(latStr);
    const long = parseCoordString(longStr);
    if (!isNaN(lat) && !isNaN(long)) {
      const data = await runCoords(lat, long);
      if (data) {
        updateInputsFromData(data);
        triggerSave('city');
      }
    } else {
      alert("Please enter valid coordinates.");
    }
  });

  document.getElementById('preset-coords').addEventListener('change', (e) => {
    const val = e.target.value;
    if (val) {
      const [lat, long] = val.split(',');
      document.getElementById('lat-input').value = lat;
      document.getElementById('long-input').value = long;
    }
  });

  document.getElementById('set-all-btn').addEventListener('click', (e) => {
    e.preventDefault();
    const defaults = {
      '.js-city-search': 'All Cities',
      '.js-isd-search': 'All ISDs',
      '.js-board-search': 'All State Board of Education Districts',
      '.js-congress-search': 'All Congressional Districts',
      '.js-precinct-search': 'All Justice of the Peace Precincts',
      '.js-staterep-search': 'All State Representative Districts',
      '.js-statesen-search': 'All State Senate Districts',
      '.js-college-search': 'All College Districts',
      '.js-drainage-search': 'All Drainage Districts',
      '.js-hospital-search': 'All Hospital Districts',
      '.js-mud-search': 'All MUDs',
      '.js-navigation-search': 'All Navigation Precincts'
    };
    for (const [selector, value] of Object.entries(defaults)) {
      const el = document.querySelector(selector);
      if (el) el.value = value;
    }
    triggerSave('city');
  });

  document.getElementById('set-none-btn').addEventListener('click', (e) => {
    e.preventDefault();
    document.querySelectorAll('.js-dropdown-input').forEach(el => {
      el.value = 'None';
    });
    triggerSave('city');
  });

  loadDynamicDistricts();

  locationDataReady.then(data => {
    updateInputsFromData(data);
  });
  
  window.addEventListener('locationBackgroundUpdated', (e) => {
    updateInputsFromData(e.detail);
  });
}