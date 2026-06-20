import { masterSummaries } from '../data/summaries.js';
import { fixDate } from './utils/fixDate.js';

export function renderSearch(searchTerm = '') {
  const searchResults = document.querySelector('.js-search-results');
  
  if (!searchResults) return; 
  
  const currentCity = sessionStorage.getItem('city');
  const currentIsd = sessionStorage.getItem('isd');
  
  let html = '';

  const searchWords = searchTerm.toLowerCase().split(/\s+/).filter(word => word.length > 0);

  const filteredSummaries = masterSummaries.filter(summary => {
    let isCityMatch = false;
    if (currentCity === 'All Cities') {
      isCityMatch = !summary.city.includes('ISD');
    } else {
      isCityMatch = summary.city === currentCity;
    }

    let isIsdMatch = false;
    if (currentIsd === 'All ISD') {
      isIsdMatch = summary.city.includes('ISD');
    } else {
      isIsdMatch = summary.city === currentIsd;
    }

    const isCurrentArea = isCityMatch || isIsdMatch;
    
    if (!isCurrentArea) return false;

    const combinedData = `${summary.city} ${summary.summary} ${summary.transcription} ${summary.date} ${fixDate(summary.date)}`.toLowerCase();

    return searchWords.every(word => combinedData.includes(word));
  });

  filteredSummaries.forEach(summary => {
    const meetingData = summary.city.includes("ISD") ? 'isd' : 'city';
    html += `
      <div data-target="webpages/summary.html" data-cityorisd="${meetingData}" data-targetdate="${summary.date}" class="result js-div-button">
        <span class="date">${summary.city} | ${fixDate(summary.date)}</span>
        <div class="preview">${summary.summary} Transcription: ${summary.transcription}</div>
      </div>
    `;
  });

  searchResults.innerHTML = html;
}

const searchInput = document.querySelector('.archive-search');

renderSearch(searchInput ? searchInput.value : '');

if (searchInput) {
  searchInput.addEventListener('input', (event) => {
    renderSearch(event.target.value);
  });

  window.addEventListener('pageshow', () => {
    renderSearch(searchInput.value);
  });

  setTimeout(() => {
    renderSearch(searchInput.value);
  }, 50);
}