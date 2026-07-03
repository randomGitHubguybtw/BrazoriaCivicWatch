import { locationDataReady } from './locationStore.js';
import { masterSummaries } from '../data/summaries.js';
import { fixDate } from './utils/fixDate.js';

function initSummary() {
  let targetDate;
  let targetMeeting;

  if (sessionStorage.getItem('triggerSummary') === 'true') {
    const targetDateStr = sessionStorage.getItem('targetDate');
    targetDate = targetDateStr ? new Date(targetDateStr) : new Date(); 
    targetMeeting = sessionStorage.getItem('cityOrIsd');
  } else {
    targetDate = new Date();
    targetMeeting = sessionStorage.getItem('cityOrIsd') || 'city';
  }

  const summaryContainer = document.querySelector('.js-summary');
  
  if (summaryContainer) {
    summaryContainer.innerHTML = `
      <div class="skeleton" style="height: 18px; width: 100%; margin-bottom: 8px; border-radius: 4px;"></div>
      <div class="skeleton" style="height: 18px; width: 92%; margin-bottom: 8px; border-radius: 4px;"></div>
      <div class="skeleton" style="height: 18px; width: 98%; margin-bottom: 8px; border-radius: 4px;"></div>
      <div class="skeleton" style="height: 18px; width: 65%; border-radius: 4px;"></div>
    `;
  }

  setupCollapsers();

  locationDataReady.then(() => {
    runSummary(targetDate, targetMeeting);
  });
}

function setupCollapsers() {
  const summaryBtn = document.querySelector('.js-summary-btn');
  const summaryCollapse = document.querySelector('.js-summary-collapse');
  
  if (summaryBtn && summaryCollapse) {
    initCollapser(summaryBtn, summaryCollapse);
  }

  const transcriptionBtn = document.querySelector('.js-transcription-btn');
  const transcriptionCollapse = document.querySelector('.js-transcription-collapse');
  
  if (transcriptionBtn && transcriptionCollapse) {
    initCollapser(transcriptionBtn, transcriptionCollapse);
  }
}

function initCollapser(btn, container) {
  container.dataset.step = 0;
  
  btn.addEventListener('click', () => {
    let step = parseInt(container.dataset.step || '0', 10);
    const isFullyExpanded = container.classList.contains('fully-expanded');

    if (isFullyExpanded) {
      container.dataset.step = 0;
      container.classList.remove('step-1', 'step-2', 'step-3', 'fully-expanded');
      btn.classList.remove('expanded-btn');
      
      const fontSize = parseFloat(getComputedStyle(container).fontSize) || 16;
      const nextMaxHeightPx = 480 * fontSize;
      if (container.scrollHeight <= nextMaxHeightPx + 5) {
         btn.innerHTML = 'Read All <i class="arrow"></i>';
      } else {
         btn.innerHTML = 'Read More <i class="arrow"></i>';
      }
      return;
    }

    step++;
    container.dataset.step = step;
    
    if (step >= 4) {
      container.classList.add('fully-expanded');
      btn.classList.add('expanded-btn');
      btn.innerHTML = 'Read Less <i class="arrow"></i>';
    } else {
      container.classList.add(`step-${step}`);
      
      const fontSize = parseFloat(getComputedStyle(container).fontSize) || 16;
      const maxHeights = { 1: 480, 2: 912, 3: 1344 };
      const currentMaxHeightPx = maxHeights[step] * fontSize;
      
      if (container.scrollHeight <= currentMaxHeightPx + 5) {
        container.classList.add('fully-expanded');
        btn.classList.add('expanded-btn');
        btn.innerHTML = 'Read Less <i class="arrow"></i>';
      } else {
        const nextStep = step + 1;
        if (nextStep >= 4) {
          btn.innerHTML = 'Read All <i class="arrow"></i>';
        } else {
          const nextMaxHeightPx = maxHeights[nextStep] * fontSize;
          if (container.scrollHeight <= nextMaxHeightPx + 5) {
            btn.innerHTML = 'Read All <i class="arrow"></i>';
          } else {
            btn.innerHTML = 'Read More <i class="arrow"></i>';
          }
        }
      }
    }
  });
}

function checkCollapserVisibility() {
  const collapsers = [
    { btn: document.querySelector('.js-summary-btn'), container: document.querySelector('.js-summary-collapse') },
    { btn: document.querySelector('.js-transcription-btn'), container: document.querySelector('.js-transcription-collapse') }
  ];
  
  collapsers.forEach(({btn, container}) => {
    if (!btn || !container) return;
    
    container.classList.remove('fully-expanded');
    
    const fontSize = parseFloat(getComputedStyle(container).fontSize) || 16;
    const initialMaxHeightPx = 16 * fontSize;
    
    if (container.scrollHeight <= initialMaxHeightPx + 5) {
       btn.style.display = 'none'; 
       container.classList.add('fully-expanded'); 
    } else {
       btn.style.display = 'flex';
       const nextMaxHeightPx = 480 * fontSize;
       if (container.scrollHeight <= nextMaxHeightPx + 5) {
           btn.innerHTML = 'Read All <i class="arrow"></i>';
       } else {
           btn.innerHTML = 'Read More <i class="arrow"></i>';
       }
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSummary);
} else {
  initSummary();
}

export function runSummary(targetDate, targetMeeting) {
  const summaryContainer = document.querySelector('.js-summary'); 
  const townTitle = document.querySelector('.js-town');
  const currentCity = sessionStorage.getItem('city');
  const currentIsd = sessionStorage.getItem('isd');

  if (!summaryContainer) return; 

  const areaList = [];
  const dateTitle = document.querySelector('.js-title-date');
  const transcription = document.querySelector('.js-transcription');
  const transcriptionLink = document.querySelector('.js-transcription-link');
  const absentees = document.querySelector('.js-absentees');

  if (targetMeeting === 'isd') {
    for (const summary of masterSummaries) {
      if (currentIsd === 'All ISD') {
        if (summary.city.includes('ISD')) {
          areaList.push(summary);
        }
      } else if (summary.city === currentIsd) {
        areaList.push(summary);
      }
    }
  } else {
    for (const summary of masterSummaries) {
      if (currentCity === 'All Cities') {
        if (!summary.city.includes('ISD')) {
          areaList.push(summary);
        }
      } else if (summary.city === currentCity) {
        areaList.push(summary);
      }
    }
  }

  if (areaList.length === 0) {
    if (summaryContainer) {
      summaryContainer.innerHTML = `There doesn't seem to be any summary here... yet! <a href="https://forms.gle/oTUAUNgc3TBwZozB6" target="_blank" class="default-link">Volunteer to Help!</a>`;
    }
    if (dateTitle) {
      dateTitle.innerHTML = 'Month D, Year'; 
    }
    if (townTitle) {
      const selectedArea = targetMeeting === 'isd' ? currentIsd : currentCity;
      townTitle.innerHTML = (selectedArea === 'All Cities' || selectedArea === 'All ISD') ? 'No meetings!' : selectedArea;
    }
    
    setTimeout(() => {
      checkCollapserVisibility();
    }, 10);
    
    return; 
  }

  let closestSummary = areaList[0];

  areaList.forEach(currentSummary => {
    const current = new Date(currentSummary.date);
    const closest = new Date(closestSummary.date);

    if (Math.abs(current - targetDate) < Math.abs(closest - targetDate)) {
      closestSummary = currentSummary;
    }
  });

  const targetSummary = closestSummary;

  if (summaryContainer && targetSummary) {
    if (townTitle) {
      townTitle.innerHTML = targetSummary.city;
    }
    
    const formatForHTML = (text) => text ? text.replace(/\r?\n/g, '<br>') : '';
    
    summaryContainer.innerHTML = formatForHTML(targetSummary.summary);
    summaryContainer.classList.add('highlightable');
    
    dateTitle.innerHTML = fixDate(targetSummary.date);
    
    transcription.innerHTML = formatForHTML(targetSummary.transcription);
    transcription.classList.add('highlightable');
    
    transcriptionLink.innerHTML = `<a class="default-link" href="${targetSummary.transcriptionLink}" target="_blank" >${targetSummary.transcriptionLink}</a>`;
    absentees.innerHTML = targetSummary.absentees;

    setTimeout(() => {
      checkCollapserVisibility();
    }, 10);
  }
}