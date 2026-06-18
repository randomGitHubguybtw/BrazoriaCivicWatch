import { saveCityAndIsd } from './locationStore.js';
import { generateHTML } from './globalHTMLGenerate.js';
import { runSummary } from './globalSummaries.js';
import { renderSearch } from './globalArchive.js'

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

  const routeTarget = event.target.closest('.js-div-button, .js-sidebar-button, .js-footer-text, button:not(.js-hands-off)');
  if (!routeTarget || event.target.closest('.js-hands-off')) return;
  if (routeTarget.classList.contains('js-search-button')) return;

  const destination = routeTarget.dataset.target || routeTarget.getAttribute('href');
  const meeting = routeTarget.dataset.cityorisd;
  const targetDateData = routeTarget.dataset.targetdate ? new Date(routeTarget.dataset.targetdate) : new Date();

  if(destination === 'webpages/summary.html') {
    renderSummaryPage(targetDateData, meeting);
    window.location.href = destination;
  } else if (destination) {
    window.location.href = destination;
  } else {
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
      Array.from(dropdownList.children).forEach(li => {
        const itemText = li.textContent.toLowerCase();
        li.style.display = itemText.includes(filterText) ? 'block' : 'none';
      });
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

function triggerSave(meetingType) {
  const cityInput = document.querySelector('.js-city-search');
  const isdInput = document.querySelector('.js-isd-search');

  const city = cityInput ? cityInput.value : '';
  const isd = isdInput ? isdInput.value : '';

  const updatedData = saveCityAndIsd(city, isd);
  const meetingDecide = meetingType.includes("ISD") ? 'isd' : 'city'

  generateHTML(updatedData.city, updatedData.isd, 'active'); 
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