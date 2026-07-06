import { locationDataReady } from './locationStore.js';

const stripeScript = document.createElement('script');
stripeScript.src = "https://js.stripe.com/v3/";
document.head.appendChild(stripeScript);

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
  <link rel="stylesheet" href="styles/login.css">
  <link rel="stylesheet" href="styles/volunteer-page.css">
  <link rel="stylesheet" href="styles/voter-info.css">
  <link rel="stylesheet" href="styles/location-choose.css">
  <link rel="stylesheet" href="styles/contact-us.css">
  <link rel="stylesheet" href="styles/officials.css">
  <link rel="stylesheet" href="styles/donations.css">
  <link rel="stylesheet" href="styles/public-places.css">
  
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

  <style>
    @keyframes spin-loader {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    @keyframes pulse-text {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.6; }
    }
    #loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background-color: rgb(42, 38, 35);
      z-index: 99999;
      display: flex;
      justify-content: center;
      align-items: center;
      flex-direction: column;
      color: rgb(252, 246, 238);
      font-family: sans-serif;
    }
    .spinner {
      border: 6px solid rgb(78, 89, 73);
      border-top: 6px solid rgb(158, 129, 79);
      border-radius: 50%;
      width: 60px;
      height: 60px;
      animation: spin-loader 1s linear infinite;
      margin-bottom: 24px;
    }
    .loading-title {
      font-size: 24px;
      margin: 0 0 12px 0;
      animation: pulse-text 1.5s ease-in-out infinite;
    }
    .loading-subtitle {
      font-size: 16px;
      margin: 0;
      color: rgb(158, 129, 79);
      text-align: center;
    }
  </style>
`);

document.body.insertAdjacentHTML('afterbegin', `
  <div id="loading-overlay">
    <div class="spinner"></div>
    <h2 class="loading-title">Figuring out your location...</h2>
    <p class="loading-subtitle">Cross-referencing maps.<br>Please allow location access when prompted.</p>
  </div>
  <div id="donate-overlay" class="donate-overlay js-hands-off" style="display: none;">
    <div class="donate-modal js-hands-off">
      <button class="close-donate js-hands-off" id="close-donate-btn">&times;</button>
      
      <div id="donate-main-content" class="donate-main-content js-hands-off">
        <h2 class="donate-title">Support Our Cause</h2>
        <div class="donate-options">
          <button class="donate-amt js-hands-off">$1</button>
          <button class="donate-amt js-hands-off">$5</button>
          <button class="donate-amt js-hands-off">$10</button>
          <button class="donate-amt js-hands-off selected">$25</button>
          <button class="donate-amt js-hands-off">$50</button>
          <button class="donate-amt js-hands-off">$100</button>
        </div>
        <div class="custom-amount-container js-hands-off">
          <span class="currency-symbol js-hands-off">$</span>
          <input type="number" id="custom-donate-input" class="custom-donate-input js-hands-off" placeholder="Custom Amount" min="1" step="1" value="25">
        </div>
        <div class="donate-type">
          <label class="payment-periodic-check"><input type="radio" name="freq" value="one-time" checked> One-time</label>
          <label class="payment-periodic-check"><input type="radio" name="freq" value="monthly"> Monthly</label>
        </div>
        <button class="submit-donation js-hands-off">Proceed to Donate</button>
      </div>

      <div id="donate-thanks-content" class="donate-thanks-content js-hands-off" style="display: none;">
        <h2 class="donate-title">Thank You!</h2>
        <p class="thanks-message">Thank you for your generous support. Your transaction is opening securely in a new tab via Stripe.</p>
      </div>
    </div>
  </div>
`);

const overlayElement = document.getElementById('donate-overlay');
const closeBtnElement = document.getElementById('close-donate-btn');
const amountBtns = document.querySelectorAll('.donate-amt');
const submitDonationBtn = document.querySelector('.submit-donation');
const customAmountInput = document.getElementById('custom-donate-input');
const mainContent = document.getElementById('donate-main-content');
const thanksContent = document.getElementById('donate-thanks-content');

function closeDonateModal() {
  overlayElement.classList.add('closing');
  setTimeout(() => {
    overlayElement.style.display = 'none';
    overlayElement.classList.remove('closing');
    if (mainContent && thanksContent) {
      mainContent.style.display = 'flex';
      thanksContent.style.display = 'none';
    }
  }, 150);
}

closeBtnElement.addEventListener('click', closeDonateModal);

overlayElement.addEventListener('click', (event) => {
  if (event.target === overlayElement) {
    closeDonateModal();
  }
});

amountBtns.forEach(btn => {
  btn.addEventListener('click', (e) => {
    amountBtns.forEach(b => b.classList.remove('selected'));
    e.target.classList.add('selected');
    if (customAmountInput) {
      customAmountInput.value = e.target.textContent.replace('$', '');
    }
  });
});

if (customAmountInput) {
  customAmountInput.addEventListener('input', () => {
    const val = customAmountInput.value;
    amountBtns.forEach(b => {
      if (b.textContent.replace('$', '') === val) {
        b.classList.add('selected');
      } else {
        b.classList.remove('selected');
      }
    });
  });
}

submitDonationBtn.addEventListener('click', async () => {
  if (typeof Stripe === 'undefined') {
    return;
  }

  const amount = customAmountInput ? parseInt(customAmountInput.value, 10) : 0;

  if (isNaN(amount) || amount <= 0) {
    return;
  }

  const newTab = window.open('', '_blank');
  if (newTab) {
    newTab.document.write('<html><head><title>Loading Checkout...</title><style>body{font-family:sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;background-color:#2a2623;color:#fcf6ee;margin:0;}</style></head><body><h2>Connecting to secure checkout...</h2></body></html>');
    newTab.document.close();
  }

  if (mainContent && thanksContent) {
    mainContent.style.display = 'none';
    thanksContent.style.display = 'flex';
  }

  const freqElement = document.querySelector('input[name="freq"]:checked');
  const frequency = freqElement ? freqElement.value : 'one-time';

  const API_BASE_URL = 'https://api.brazoriacivicwatch.org';

  try {
    const response = await fetch(`${API_BASE_URL}/api/create-checkout-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: amount, frequency: frequency })
    });
    
    const session = await response.json();
    
    if (session.error || (!session.url && !session.id)) {
      if (newTab) newTab.close();
      if (mainContent && thanksContent) {
        mainContent.style.display = 'flex';
        thanksContent.style.display = 'none';
      }
      return;
    }

    const monitorStripeTab = () => {
      if (!newTab) return;
      let wentToStripe = false;
      
      const tabMonitor = setInterval(() => {
        if (newTab.closed) {
          clearInterval(tabMonitor);
          return;
        }
        
        try {
          const currentUrl = newTab.location.href;
          if (wentToStripe) {
            newTab.close();
            clearInterval(tabMonitor);
          }
        } catch (e) {
          wentToStripe = true;
        }
      }, 500);
    };

    if (session.url) {
      if (newTab) {
        newTab.location.href = session.url;
        monitorStripeTab();
      }
    } else if (session.id) {
      if (newTab) {
        newTab.document.open();
        newTab.document.write(`
          <html>
            <head>
              <title>Redirecting to Stripe...</title>
              <script src="https://js.stripe.com/v3/"></script>
              <style>
                body {
                  font-family: sans-serif;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  height: 100vh;
                  background-color: #2a2623;
                  color: #fcf6ee;
                  margin: 0;
                }
              </style>
            </head>
            <body>
              <h2>Redirecting to secure payment page...</h2>
              <script>
                const stripe = Stripe('pk_test_51Tps5ZRPtrIU6wyIGQLjBoir8i0oeKUUpgQf39WJXub4hakSEvRv7tinkY0Amxap2EEs5EQsDOj5PbcDES1btrpF00fwMQaSVu');
                stripe.redirectToCheckout({ sessionId: '${session.id}' }).catch(function(err) {
                  console.error(err);
                  document.body.innerHTML = '<h2>Failed to load checkout page. Please close this tab and try again.</h2>';
                });
              </script>
            </body>
          </html>
        `);
        newTab.document.close();
        monitorStripeTab();
      }
    }
  } catch (error) {
    if (newTab) newTab.close();
    if (mainContent && thanksContent) {
      mainContent.style.display = 'flex';
      thanksContent.style.display = 'none';
    }
  }
});

export function generateHTML(startCity, startIsd, activeButton) {
  document.querySelector('.js-header').innerHTML = `
    <div class="left">
      <div class="drop-down-burger js-hands-off">
        <img class="burger js-burger" src="icons/hamburger-menu.svg">
      </div>
    </div>
    <div class="middle">
        <a href="index.html"><p class="mission"> Keeping Brazoria County accessible since 2026!</p></a>
    </div>
    <div class="right">
      <button class="donate-button js-donate-button js-hands-off">Donate to our cause!</button>
    </div>`;

  const donateBtn = document.querySelector('.js-donate-button');
  if (donateBtn) {
    donateBtn.addEventListener('click', () => {
      const overlay = document.getElementById('donate-overlay');
      if (overlay) {
        overlay.classList.remove('closing');
        overlay.style.display = 'flex';
      }
    });
  }

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
            <li class="js-dropdown-item">All Cities</li>
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
            <li class="js-dropdown-item">All ISD</li>
          </ul>
        </div>
        <button data-target="webpages/location-choose.html" style="background-color: rgb(109, 130, 99); color: rgb(252, 246, 238);" class="sidebar-button js-sidebar-button">Change Precise Location</button>
        <button data-target="index.html" class="sidebar-button js-sidebar-button"><strong>Home</strong></button>
        <button data-target="webpages/meeting-selection-screen.html" class="sidebar-button js-sidebar-button">Most Recent Meeting</button>
        <button class="sidebar-button js-sidebar-button">Run For Office</button>
        <button data-target="webpages/candidates.html" class="sidebar-button js-sidebar-button">Candidates</button>
        <button data-target="webpages/current-officials.html" class="sidebar-button js-sidebar-button">Current Officials</button>
        <button data-target="webpages/archive.html" class="sidebar-button js-sidebar-button">Archive</button>
        <button class="sidebar-button js-sidebar-button">Meeting Information</button>
        <button class="sidebar-button js-sidebar-button">Government Websites</button>
        <button class="sidebar-button js-sidebar-button">Register to Vote</button>
        <button data-target="webpages/public-places.html" class="sidebar-button js-sidebar-button">Public Places</button>
        <button data-target="webpages/login.html" class="sidebar-button js-sidebar-button" style="background-color: rgb(109, 130, 99);">Volunteer Portal Login</button>
        <button data-target="https://forms.gle/4sEn3ooneF7AyH4C7" class="sidebar-button js-sidebar-button" style="background-color: rgb(158, 129, 79);">Report a Concern</button>
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
            <p data-target="webpages/contact-us.html" class="footer-text js-footer-text">Contact Us</p>
        </div>
        <div class="vertical-container">
            <p class="footer-text js-footer-text">FAQ</p>
            <p data-target="https://forms.gle/oTUAUNgc3TBwZozB6" class="footer-text js-footer-text">Get Involved</p>
            <p class="footer-text js-footer-text">Social Media</p>
        </div>
    </div>`;
}

generateHTML("Locating...", "Locating...");

const cityInput = document.querySelector('.js-city-search');
const isdInput = document.querySelector('.js-isd-search');
const preciseLocationBtn = document.querySelector('button[data-target="webpages/location-choose.html"]');

if (cityInput) cityInput.classList.add('skeleton');
if (isdInput) isdInput.classList.add('skeleton');
if (preciseLocationBtn) {
  preciseLocationBtn.disabled = true;
  preciseLocationBtn.textContent = "Please wait...";
}

locationDataReady.then(({ city, isd }) => {
  if (cityInput) {
    cityInput.value = city;
    cityInput.classList.remove('skeleton');
  }
  if (isdInput) {
    isdInput.value = isd;
    isdInput.classList.remove('skeleton');
  }
  if (preciseLocationBtn) {
    preciseLocationBtn.disabled = false;
    preciseLocationBtn.textContent = "Change Precise Location";
  }
}).catch(error => {
  if (preciseLocationBtn) {
    preciseLocationBtn.disabled = false;
    preciseLocationBtn.textContent = "Change Precise Location";
  }
}).finally(() => {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) {
    overlay.style.display = 'none';
  }
});