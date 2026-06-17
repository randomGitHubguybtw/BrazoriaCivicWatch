import { locationDataReady } from './locationStore.js';
import { masterSummaries } from '../data/summaries.js';

const { city, isd } = await locationDataReady; 

document.addEventListener('DOMContentLoaded', () => {
  if (sessionStorage.getItem('triggerSummary') === 'true') {
    
    const targetDateStr = sessionStorage.getItem('targetDate');
    const targetDate = new Date(targetDateStr); 
    const targetMeeting = sessionStorage.getItem('cityOrIsd');

    runSummary(targetDate, targetMeeting);
  }
});

export function runSummary(targetDate, targetMeeting) {
  const currentCity = sessionStorage.getItem('city');
  const currentIsd = sessionStorage.getItem('isd');
  const areaList = [];

  const summaryContainer = document.querySelector('.js-summary'); 
  const townTitle = document.querySelector('.js-town');
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

    if (targetMeeting === 'isd') {
      townTitle.innerHTML = currentIsd;
    } else {
      townTitle.innerHTML = currentCity;
    }

  if (summaryContainer && targetSummary) {
    summaryContainer.innerHTML = targetSummary.summary;
    dateTitle.innerHTML = targetSummary.date;
    transcription.innerHTML = targetSummary.transcription;
    transcriptionLink.innerHTML = targetSummary.transcriptionLink;
    absentees.innerHTML = targetSummary.absentees;
  } else {
    console.error("Could not find the .js-summary container on the page.");
  }
}