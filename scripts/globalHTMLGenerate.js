import { locationDataReady } from './locationStore.js';

document.head.insertAdjacentHTML('beforeend', `
  <link rel="stylesheet" href="styles/card-wheel.css">
  <link rel="stylesheet" href="styles/content.css">
  <link rel="stylesheet" href="styles/general.css">
  <link rel="stylesheet" href="styles/header.css">
  <link rel="stylesheet" href="styles/voter-cards.css">
  <link rel="stylesheet" href="styles/footer.css">
  <link rel="stylesheet" href="styles/election-countdown.css">
  <link rel="stylesheet" href="styles/sidebar.css">
  <link rel="stylesheet" href="styles/summary-page.css">
  <link rel="stylesheet" href="styles/archive.css">
  
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
`);

export function generateHTML(startCity, startIsd, activeButton) {
  console.log('Generating HTML for:', startCity, startIsd);

  document.querySelector('.js-header').innerHTML = `
    <div class="left">
      <div class="drop-down-burger">
        <img class="burger js-burger" src="icons/hamburger-menu.svg">
      </div>
    </div>
    <div class="middle">
        <a href="index.html"><p class="mission"> Keeping Brazoria easy to access and accountable since 2026!</p></a>
    </div>
    <div class="right">
      <button class="search-button js-search-button">
        <img class="search-icon" src="icons/Brazoria Civic Watch Logo Black.png">
      </button>
      <input class="search-bar" type="text" placeholder="Search Any Query...">
    </div>`;

  const sidebarContainer = document.querySelector('.js-sidebar-container');

  if (sidebarContainer) {
    sidebarContainer.innerHTML = `
      <div class="screen-overlay js-screen-overlay"></div>
      <div class="sidebar js-sidebar">
        <div class="dropdown-box js-dropdown-container js-dropdown-box">
          <input type="text" id="city-search" placeholder="Select your city..." value="${startCity}" autocomplete="off" class="location-dropdown city-dropdown js-city-search js-dropdown-input"></input>
          <ul id="city-list" class="city-list dropdown-search js-city-list js-dropdown-list">
            <li class="js-dropdown-item">Alvin</li>
            <li class="js-dropdown-item">Angleton</li>
            <li class="js-dropdown-item">Bailey's Prairie</li>
            <li class="js-dropdown-item">Bonney</li>
            <li class="js-dropdown-item">Brazoria</li>
            <li class="js-dropdown-item">Brazoria County</li>
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
          </ul>
        </div>
        <div class="dropdown-box js-dropdown-box">
          <input type="text" id="school-search" placeholder="Select your ISD..." value="${startIsd}" autocomplete="off" class="location-dropdown school-dropdown js-isd-search js-dropdown-input"></input>
          <ul id="school-list" class="school-list dropdown-search js-school-list js-dropdown-list">
            <li class="js-dropdown-item">Alvin ISD</li>
            <li class="js-dropdown-item">Angleton ISD</li>
            <li class="js-dropdown-item">Brazosport ISD</li>
            <li class="js-dropdown-item">Columbia-Brazoria ISD</li>
            <li class="js-dropdown-item">Damon ISD</li>
            <li class="js-dropdown-item">Danbury ISD</li>
            <li class="js-dropdown-item">Friendswood ISD</li>
            <li class="js-dropdown-item">Pearland ISD</li>
            <li class="js-dropdown-item">Sweeny ISD</li>
          </ul>
        </div>
        <button data-target="index.html" class="sidebar-button js-sidebar-button">Home</button>
        <button data-target="webpages/meeting-selection-screen.html" class="sidebar-button">Most Recent Meeting</button>
        <button class="sidebar-button js-sidebar-button">Run For Office</button>
        <button class="sidebar-button js-sidebar-button">Candidate Interviews</button>
        <button class="sidebar-button js-sidebar-button">Current Officials</button>
        <button data-target="webpages/archive.html" class="sidebar-button js-sidebar-button">Archive</button>
        <button class="sidebar-button js-sidebar-button">Meeting Information</button>
        <button class="sidebar-button js-sidebar-button">Government Websites</button>
        <button class="sidebar-button js-sidebar-button">Register to Vote</button>
        <button class="sidebar-button js-sidebar-button">Public Places</button>
      </div>`;

    if (activeButton) {
      const sidebar = sidebarContainer.querySelector('.js-sidebar');
      const overlay = sidebarContainer.querySelector('.js-screen-overlay');
      
      if (sidebar) sidebar.classList.add(activeButton);
      if (overlay) overlay.classList.add(activeButton);
    }
  }

  document.querySelector('.js-footer').innerHTML = `
    <div class="horizontal-container">
        <div class="vertical-container">
            <p class="footer-text js-footer-text">About Us</p>
            <p class="footer-text js-footer-text">Change Your City</p>
            <p class="footer-text js-footer-text">Contact Us</p>
        </div>
        <div class="vertical-container">
            <p class="footer-text js-footer-text">FAQ</p>
            <p class="footer-text js-footer-text">Get Involved</p>
            <p class="footer-text js-footer-text">Social Media</p>
        </div>
    </div>`;
}

// 1. Generate HTML immediately so the page doesn't block
generateHTML("Locating...", "Locating...");

// 2. Add skeleton animation to the inputs
const cityInput = document.querySelector('.js-city-search');
const isdInput = document.querySelector('.js-isd-search');

if (cityInput) cityInput.classList.add('skeleton');
if (isdInput) isdInput.classList.add('skeleton');

// 3. Wait for data in the background, update values, and remove skeletons
locationDataReady.then(({ city, isd }) => {
  if (cityInput) {
    cityInput.value = city;
    cityInput.classList.remove('skeleton');
  }
  if (isdInput) {
    isdInput.value = isd;
    isdInput.classList.remove('skeleton');
  }
}).catch(error => {
  console.error("Location failed:", error);
});