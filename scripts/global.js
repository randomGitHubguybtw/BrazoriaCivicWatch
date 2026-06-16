document.body.addEventListener('click', (event) => {
  const sidebar = document.querySelector('.js-sidebar');
  const screenOverlay = document.querySelector('.js-screen-overlay');
  
  if (!sidebar || !screenOverlay) return;

  if (event.target.classList.contains('js-burger')) {
    sidebar.classList.toggle('active');
    screenOverlay.classList.toggle('active');
  }

  if (event.target.classList.contains('js-screen-overlay')) {
    sidebar.classList.remove('active');
    screenOverlay.classList.remove('active');
  }
});



const isFirstVisitThisSession = !sessionStorage.getItem('locationTracked');

const navEntries = window.performance?.getEntriesByType("navigation") || [];
const isReload = navEntries.length > 0 
    ? navEntries[0].type === "reload" 
    : window.performance?.navigation?.type === 1;

const isInternalLink = document.referrer.includes(window.location.hostname);

if (isFirstVisitThisSession && !isReload && !isInternalLink) {
    sessionStorage.setItem('locationTracked', 'true');
    
    if (typeof findCoords === "function") {
        findCoords();
        console.log('did it!')
    } else {
        console.warn("Location tracking function is not defined yet.");
    }
} else {
  generateHTML(sessionStorage.getItem('city'), sessionStorage.getItem('isd'));
}

let lat;
let long;
let city;
let isd;
let schoolDistricts;
let cityLimits;

async function initJSON() {
  try {
    const responseSchool = await fetch('./locationJSON/schoolDistricts.json'); 
    schoolDistricts = await responseSchool.json();
    console.log("Successfully loaded schoolDistricts JSON:", schoolDistricts);

    const responseCity = await fetch('./locationJSON/cityLimits.json'); 
    cityLimits = await responseCity.json();
  } catch (err) {
    console.error("CRITICAL ERROR: Failed to fetch or parse JSON files!", err);
  }
}

function testCoords(long, lat) {
  setupMapsAndDistricts(long, lat);
}

function findCoords() {
  if(navigator.geolocation) {
    navigator.geolocation.getCurrentPosition( async position => {
      lat = position.coords.latitude;
      long = position.coords.longitude;
      await initJSON();
      setupMapsAndDistricts(long, lat);
    },
      async error => {
        locationError();
      });
  }
}

async function setupMapsAndDistricts(long, lat) {
  console.log("Checking Longitude:", long, "and Latitude:", lat);
  await initJSON();

  if (!schoolDistricts || !schoolDistricts.features) {
    console.error("ERROR: schoolDistricts data is missing or improperly formatted GeoJSON!", schoolDistricts);
    return;
  }

  const userLocation = turf.point([long, lat]); 
  let schoolDistrictFound = false;
  let cityDistrictFound = false;

  for (const section of schoolDistricts.features) {
    if (turf.booleanPointInPolygon(userLocation, section)) {
      isd = section.properties.Name;
      schoolDistrictFound = true;
      break;
    }
  }

  for (const section of cityLimits.features) {
    if (turf.booleanPointInPolygon(userLocation, section)) {
      city = section.properties.Name;
      cityDistrictFound = true;
      break;
    }
  }
  
  if (!cityDistrictFound && !schoolDistrictFound) {
    locationError();
    return;
  } else if (!cityDistrictFound && schoolDistrictFound) {
    locationError(null, isd);
    return;
  } else if (cityDistrictFound && !schoolDistrictFound) {
    locationError(city, null);
    return;
  }

  saveCityAndIsd(city, isd)
}

function locationError(city, isd) {
  city = city || "BRAZORIA COUNTY"
  isd = isd || "Brazosport"
  saveCityAndIsd(city, isd);
};

function saveCityAndIsd(startCity, startIsd) {
  sessionStorage.setItem('city', startCity);
  sessionStorage.setItem('isd', startIsd);
  generateHTML(sessionStorage.getItem('city'), sessionStorage.getItem('isd'));
}
