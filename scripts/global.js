document.querySelectorAll("button:not(.search-button)")
  .forEach(b => b.outerHTML = `<a href="webpages/construction.html">${b.outerHTML}</a>`);
document.querySelectorAll(".card-container:not(.recent-meetings-button)")
  .forEach(b => b.outerHTML = `<a href="webpages/construction.html">${b.outerHTML}</a>`);
document.querySelectorAll(".footer-text").forEach(b => b.outerHTML = `<a href="webpages/construction.html">${b.outerHTML}</a>`);

if (!sessionStorage.getItem('isFirstVisit')) {
    sessionStorage.setItem('isFirstVisit', 'true');
    initializeLocationTracking();
}

let lat;
let long;
let city;
let isd;
let schoolDistricts;
let cityLimits;

//findCoords();
//testCoords(69.348145, -49.351233)


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
  //lat = 29.024689; //Clute Test Cords
  //long = -95.398831;
  //lat = 29.044967; // Brazoria Test Cords
  //long = -95.569387;
  //lat = 29.501905; //Sandy Point Test Cords
  //long = -95.452163
  //lat =  29.351639 //Rosharon Test Cords
  //long = -95.459389
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
};

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
  } else if (!cityDistrictFound && schoolDistrictFound) {
    locationError(null, isd);
  } else if (cityDistrictFound && !schoolDistrictFound) {
    locationError(city, null);
  };

  console.log(isd);
  console.log(city);
};

function locationError(city, isd) {
  city = city || "BRAZORIA COUNTY"
  isd = isd || "Brazosport"
  console.log(isd);
  console.log(city);
};

const sidebar = document.querySelector('.js-sidebar');
const screenOverlay = document.querySelector('.js-screen-overlay');
const burgers = document.querySelectorAll('.js-burger');

document.addEventListener('click', (event) => {
  const sidebar = document.querySelector('.js-sidebar');
  const screenOverlay = document.querySelector('.js-screen-overlay');
  
  if (!sidebar || !screenOverlay) return;

  if (event.target.classList.contains('js-burger')) {
    sidebar.classList.toggle('active');
    screenOverlay.classList.toggle('active');
  } 
  
  else if (event.target.classList.contains('js-screen-overlay')) {
    sidebar.classList.remove('active');
    screenOverlay.classList.remove('active');
  }
});