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

  locationDataReady.then(() => {
    runSummary(targetDate, targetMeeting);
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

  if (townTitle) {
    townTitle.innerHTML = (targetMeeting === 'isd') ? currentIsd : currentCity;
  }

  if (!summaryContainer) return; 

  const areaList = [];
  const dateTitle = document.querySelector('.js-title-date');
  const transcription = document.querySelector('.js-transcription');
  const transcriptionLink = document.querySelector('.js-transcription-link');
  const absentees = document.querySelector('.js-absentees')
  let targetSummary;

  if (targetMeeting === 'isd') {
      for (const summary of masterSummaries) {
        if (summary.city === currentIsd) {
          areaList.push(summary);
        }
    }
  } else {
      for (const summary of masterSummaries) {
        if (summary.city === currentCity) {
          areaList.push(summary);
        }
  }
    }

  if (areaList.length === 0) {
    if (summaryContainer) {
      summaryContainer.innerHTML = `There doesn't seem to be any summary here... yet! <a class="default-link">Volunteer to Help!</a>`;
    }
    if (dateTitle) {
      dateTitle.innerHTML = 'N/A'; 
    }
    console.error("No summaries found for this city.");
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

  targetSummary = closestSummary;

  if (summaryContainer && targetSummary) {
    summaryContainer.innerHTML = targetSummary.summary;
    dateTitle.innerHTML = fixDate(targetSummary.date);
    transcription.innerHTML = targetSummary.transcription;
    transcriptionLink.innerHTML = targetSummary.transcriptionLink;
    absentees.innerHTML = targetSummary.absentees;
  } else {
    console.error("Could not find the .js-summary container on the page.");
  }
}