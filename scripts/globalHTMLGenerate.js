document.head.insertAdjacentHTML('beforeend', `
  <link rel="stylesheet" href="styles/card-wheel.css">
  <link rel="stylesheet" href="styles/content.css">
  <link rel="stylesheet" href="styles/general.css">
  <link rel="stylesheet" href="styles/header.css">
  <link rel="stylesheet" href="styles/voter-cards.css">
  <link rel="stylesheet" href="styles/footer.css">
  <link rel="stylesheet" href="styles/election-countdown.css">
  <link rel="stylesheet" href="styles/sidebar.css">
`);

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
    <button class="search-button">
      <img class="search-icon" src="icons/Brazoria Civic Watch Logo Black.png">
    </button>
    <input class="search-bar" type="text" placeholder="Search Any Query...">
  </div>`;

document.querySelector('.js-sidebar-container').innerHTML = `
  <div class="screen-overlay js-screen-overlay"></div>
  <div class="sidebar js-sidebar">
    <button>City: Clute</button>
    <button>School District: BISD</button>
    <button class="sidebar-button">Most Recent Meeting</button>
    <button class="sidebar-button">Run For Office</button>
    <button class="sidebar-button">Candidate Interviews</button>
    <button class="sidebar-button">Current Officials</button>
    <button class="sidebar-button">Archive</button>
    <button class="sidebar-button">Meeting Information</button>
    <button class="sidebar-button">Government Websites</button>
    <button class="sidebar-button">Register to Vote</button>
    <button class="sidebar-button">Public Places</button>
  </div>`;

document.querySelector('.js-footer').innerHTML = `
  <div class="horizontal-container">
      <div class="vertical-container">
          <p class="footer-text">About Us</p>
          <p class="footer-text">Change Your City</p>
          <p class="footer-text">Contact Us</p>
      </div>
      <div class="vertical-container">
          <p class="footer-text">FAQ</p>
          <p class="footer-text">Get Involved</p>
          <p class="footer-text">Social Media</p>
      </div>
  </div>`;