import { fixNoun } from "./utils/fixNoun.js";

function getCoordinates() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject("Geolocation not supported");
    } else {
      navigator.geolocation.getCurrentPosition(
        pos => resolve({ lat: pos.coords.latitude, long: pos.coords.longitude }),
        err => reject(err)
      );
    }
  });
}

async function fetchMaps() {
  const [schoolRes, cityRes] = await Promise.all([
    fetch('./locationJSON/schoolDistricts.json'),
    fetch('./locationJSON/cityLimits.json')
  ]);
  
  return {
    schoolDistricts: await schoolRes.json(),
    cityLimits: await cityRes.json()
  };
}

export function saveCityAndIsd(startCity, startIsd) {
  if (startCity === 'CITY OF ALVIN') {
    startCity = 'ALVIN';
  }
  if (startIsd === "ALVIN ISD; 2018 BOUNDARY ADJ. SPL  AND SAL ISD'S") {
    startIsd = 'Alvin ISD';
  }
  
  const cleanCity = fixNoun(startCity);
  sessionStorage.setItem('city', cleanCity);
  sessionStorage.setItem('isd', startIsd);
  
  return { city: cleanCity, isd: startIsd }; 
}

export const locationDataReady = (async function initLocation() {
  const cachedCity = sessionStorage.getItem('city');
  const cachedIsd = sessionStorage.getItem('isd');
  
  if (cachedCity && cachedIsd) {
    return { city: cachedCity, isd: cachedIsd };
  }

  try {
    const { lat, long } = await getCoordinates();
    const { schoolDistricts, cityLimits } = await fetchMaps();

    const userLocation = turf.point([long, lat]);
    let finalCity = "BRAZORIA COUNTY"; 
    let finalIsd = "Brazosport ISD";

    for (const section of schoolDistricts.features) {
      if (turf.booleanPointInPolygon(userLocation, section)) {
        finalIsd = section.properties.Name;
        break; 
      }
    }

    for (const section of cityLimits.features) {
      if (turf.booleanPointInPolygon(userLocation, section)) {
        finalCity = section.properties.Name;
        break; 
      }
    }

    return saveCityAndIsd(finalCity, finalIsd);

  } catch (error) {
    console.error("Location process failed, using defaults.", error);
    return saveCityAndIsd("BRAZORIA COUNTY", "Brazosport ISD");
  }
})();