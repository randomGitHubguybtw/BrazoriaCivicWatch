import { fixNoun } from "./utils/fixNoun.js";

document.body.addEventListener('click', (event) => {
  const sidebar = document.querySelector('.js-sidebar');
  const screenOverlay = document.querySelector('.js-screen-overlay');
  
  if (!sidebar || !screenOverlay) return;

  if (event.target.classList.contains('js-burger')) {
    sidebar.classList.toggle('active');
    screenOverlay.classList.toggle('active');
  }

  if (event.target.classList.contains('js-screen-overlay') && !event.target.classList.contains('js-dropdown-item')) {
    sidebar.classList.remove('active');
    screenOverlay.classList.remove('active');
  }
});



testCoords(-92.664415, 38.179218);

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
  console.log('1')
}

function findCoords() {
  if(sessionStorage.getItem('city') && sessionStorage.getItem('isd')) {
    saveCityAndIsd(sessionStorage.getItem('city'), sessionStorage.getItem('isd'))
  } else {
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
}

async function setupMapsAndDistricts(long, lat) {
  console.log("Checking Longitude:", long, "and Latitude:", lat);
  console.log('2');
  await initJSON();
  console.log('3');

  if (!schoolDistricts || !schoolDistricts.features) {
    console.error("ERROR: schoolDistricts data is missing or improperly formatted GeoJSON!", schoolDistricts);
    return;
  }

  const userLocation = turf.point([long, lat]); 
  let schoolDistrictFound = false;
  let cityDistrictFound = false;
  console.log(schoolDistrictFound, cityDistrictFound)
  console.log('4')

  for (const section of schoolDistricts.features) {
    if (turf.booleanPointInPolygon(userLocation, section)) {
      console.log('t')
      isd = section.properties.Name;
      schoolDistrictFound = true;
      console.log(schoolDistrictFound)
      console.log(isd)
      console.log('5')
    } else {
      console.log('failed')
    }
  }

  for (const section of cityLimits.features) {
    if (turf.booleanPointInPolygon(userLocation, section)) {
      city = section.properties.Name;
      cityDistrictFound = true;
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
  isd = isd || "Brazosport ISD"
  saveCityAndIsd(city, isd);
};

function saveCityAndIsd(startCity, startIsd, isBarActive) {
  if (startCity === 'CITY OF ALVIN') {
    startCity = 'ALVIN'
  }
  if (startIsd === "ALVIN ISD; 2018 BOUNDARY ADJ. SPL  AND SAL ISD'S") {
    startIsd = 'Alvin ISD'
  }
  sessionStorage.setItem('city', fixNoun(startCity));
  sessionStorage.setItem('isd', startIsd);
  generateHTML(sessionStorage.getItem('city'), sessionStorage.getItem('isd'), isBarActive);
}

window.saveCityAndIsd = saveCityAndIsd;
