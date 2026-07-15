import { fixNoun } from "./utils/fixNoun.js";

function getCoordinates() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported"));
    } else {
      navigator.geolocation.getCurrentPosition(
        pos => resolve({ lat: pos.coords.latitude, long: pos.coords.longitude }),
        err => reject(err),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  });
}

async function fetchMaps() {
  const [
    schoolRes,
    cityRes,
    boardOfEdRes,
    congressDistRes,
    precinctRes,
    stateRepRes,
    stateSenRes,
    collegeRes,
    drainageRes,
    hospitalRes,
    mudRes,
    navigationRes
  ] = await Promise.all([
    fetch('./locationJSON/schoolDistricts.json'),
    fetch('./locationJSON/cityLimits.json'),
    fetch('./locationJSON/boardOfEducation.json'),
    fetch('./locationJSON/congressDistricts.json'),
    fetch('./locationJSON/precincts.json'),
    fetch('./locationJSON/stateRepDistricts.json'),
    fetch('./locationJSON/stateSenDistricts.json'),
    fetch('./locationJSON/college.json'),
    fetch('./locationJSON/drainageDistricts.json'),
    fetch('./locationJSON/hospital.json'),
    fetch('./locationJSON/MUD.json'),
    fetch('./locationJSON/navigationDistricts.json')
  ]);
 
  return {
    schoolDistricts: await schoolRes.json(),
    cityLimits: await cityRes.json(),
    boardOfEducation: await boardOfEdRes.json(),
    congressDistricts: await congressDistRes.json(),
    precincts: await precinctRes.json(),
    stateRepDistricts: await stateRepRes.json(),
    stateSenDistricts: await stateSenRes.json(),
    college: await collegeRes.json(),
    drainageDistricts: await drainageRes.json(),
    hospital: await hospitalRes.json(),
    mud: await mudRes.json(),
    navigationDistricts: await navigationRes.json()
  };
}

export function saveCityAndIsd(startCity = "All Cities", startIsd = "All ISDs", startBoardOfEd = "All State Board of Education Districts", startCongressDist = "All Congressional Districts", startPrecinct = "All Justice of the Peace Precincts", startStateRep = "All State Representative Districts", startStateSen = "All State Senate Districts", startCollege = "All College Districts", startDrainage = "All Drainage Districts", startHospital = "All Hospital Districts", startMud = "All MUDs", startNavigation = "All Navigation Precincts") {
  if (startCity === 'CITY OF ALVIN' || startCity === 'ALVIN') {
    startCity = 'Alvin';
  }
  if (startCity === 'BRAZORIA COUNTY') {
    startCity = 'Brazoria County';
  }
  if (startIsd === "ALVIN ISD; 2018 BOUNDARY ADJ. SPL  AND SAL ISD'S") {
    startIsd = 'Alvin ISD';
  }
  if (startDrainage === 'NO DISTRICT') {
    startDrainage = 'All Drainage Districts';
  }
 
  const cleanCity = (startCity === "None" || startCity === "All Cities") ? startCity : fixNoun(startCity);
  sessionStorage.setItem('city', cleanCity);
  sessionStorage.setItem('isd', startIsd);
  sessionStorage.setItem('boardOfEd', startBoardOfEd);
  sessionStorage.setItem('congressDist', startCongressDist);
  sessionStorage.setItem('precinct', startPrecinct);
  sessionStorage.setItem('stateRep', startStateRep);
  sessionStorage.setItem('stateSen', startStateSen);
  sessionStorage.setItem('college', startCollege);
  sessionStorage.setItem('drainage', startDrainage);
  sessionStorage.setItem('hospital', startHospital);
  sessionStorage.setItem('mud', startMud);
  sessionStorage.setItem('navigation', startNavigation);
 
  return {
    city: cleanCity,
    isd: startIsd,
    boardOfEd: startBoardOfEd,
    congressDist: startCongressDist,
    precinct: startPrecinct,
    stateRep: startStateRep,
    stateSen: startStateSen,
    college: startCollege,
    drainage: startDrainage,
    hospital: startHospital,
    mud: startMud,
    navigation: startNavigation
  };
}

async function processLocation(lat, long) {
  const {
    schoolDistricts,
    cityLimits,
    boardOfEducation,
    congressDistricts,
    precincts,
    stateRepDistricts,
    stateSenDistricts,
    college,
    drainageDistricts,
    hospital,
    mud,
    navigationDistricts
  } = await fetchMaps();

  const userLocation = window.turf.point([long, lat]);
 
  let finalCity = "All Cities";
  let finalIsd = "All ISDs";
  let finalBoardOfEd = "All State Board of Education Districts";
  let finalCongressDist = "All Congressional Districts";
  let finalPrecinct = "All Justice of the Peace Precincts";
  let finalStateRep = "All State Representative Districts";
  let finalStateSen = "All State Senate Districts";
  let finalCollege = "All College Districts";
  let finalDrainage = "All Drainage Districts";
  let finalHospital = "All Hospital Districts";
  let finalMud = "All MUDs";
  let finalNavigation = "All Navigation Precincts";

  const mudNameDictionary = {
    "Brazoria County MUD #26": "Shadow Creek Ranch MUD (#26)",
    "Brazoria County MUD #21": "Shadow Creek Ranch MUD (#21)",
    "Brazoria County MUD #22": "Shadow Creek Ranch MUD (#22)",
    "Brazoria County MUD #31": "Meridiana MUD (#31)",
    "Brazoria County MUD #32": "Meridiana MUD (#32)",
    "Brazoria County MUD#32 Tract 1": "Meridiana MUD (#32)",
    "Brazoria County MUD#32 Tract 10": "Meridiana MUD (#32)",
    "Brazoria County MUD#32 Tract 2": "Meridiana MUD (#32)",
    "Brazoria County MUD#32 Tract 3": "Meridiana MUD (#32)",
    "Brazoria County MUD#32 Tract 4": "Meridiana MUD (#32)",
    "Brazoria County MUD#32 Tract 5": "Meridiana MUD (#32)",
    "Brazoria County MUD#32 Tract 6": "Meridiana MUD (#32)",
    "Brazoria County MUD#32 Tract 7": "Meridiana MUD (#32)",
    "Brazoria County MUD#32 Tract 8": "Meridiana MUD (#32)",
    "Brazoria County MUD#32 Tract 9": "Meridiana MUD (#32)",
    "Inactive Rancho Isabella MUD (Pt One 230.04 Acres)": "Inactive Rancho Isabella MUD",
    "Inactive Rancho Isabella MUD (Pt Two 28.51 Acres)": "Inactive Rancho Isabella MUD",
    "Inactive Rancho Isabella MUD(Pt Three 14.62 Acres)": "Inactive Rancho Isabella MUD",
    "Rancho Isabella MUD (Called 154.6 Acres in MUD)": "Rancho Isabella MUD",
    "BRAZORIA COUNTY MUD #28 TRACT 15": "Brazoria County MUD (#28)",
    "Brazoria County MUD #28 Tract 1": "Brazoria County MUD (#28)",
    "Brazoria County MUD #28 Tract 10": "Brazoria County MUD (#28)",
    "Brazoria County MUD #28 Tract 11": "Brazoria County MUD (#28)",
    "Brazoria County MUD #28 Tract 12  Part 2": "Brazoria County MUD (#28)",
    "Brazoria County MUD #28 Tract 13": "Brazoria County MUD (#28)",
    "Brazoria County MUD #28 Tract 16": "Brazoria County MUD (#28)",
    "Brazoria County MUD #28 Tract 2": "Brazoria County MUD (#28)",
    "Brazoria County MUD #28 Tract 3": "Brazoria County MUD (#28)",
    "Brazoria County MUD #28 Tract 4": "Brazoria County MUD (#28)",
    "Brazoria County MUD #28 Tract 5": "Brazoria County MUD (#28)",
    "Brazoria County MUD #28 Tract 6": "Brazoria County MUD (#28)",
    "Brazoria County MUD #28 Tract 8": "Brazoria County MUD (#28)",
    "Brazoria County MUD #28 Tract 9": "Brazoria County MUD (#28)",
    "Brazoria County MUD #28; Tract 12 Part 1": "Brazoria County MUD (#28)",
    "Brazoria County MUD 28 - TRACT 17": "Brazoria County MUD (#28)",
    "Brazoria County MUD 28 - TRACT 18": "Brazoria County MUD (#28)",
    "Brazoria County MUD #39 PART 1": "Brazoria County MUD (#39)",
    "Brazoria County MUD #39 PART 2": "Brazoria County MUD (#39)",
    "Brazoria County MUD #39 PART 3": "Brazoria County MUD (#39)",
    "Brazoria County MUD #39 PART 4": "Brazoria County MUD (#39)",
    "Brazoria County MUD #39 PART 5": "Brazoria County MUD (#39)",
    "Brazoria County MUD #39 PART 6": "Brazoria County MUD (#39)",
    "Brazoria County MUD #39 PART 7": "Brazoria County MUD (#39)",
    "Brazoria County MUD #40 PART 1": "Brazoria County MUD (#40)",
    "Brazoria County MUD #40 PART 2": "Brazoria County MUD (#40)",
    "Brazoria County MUD #40 PART 3": "Brazoria County MUD (#40)",
    "Brazoria County MUD #40 PART 6": "Brazoria County MUD (#40)",
    "Brazoria County MUD #40 Part B1 pt 1": "Brazoria County MUD (#40)",
    "Brazoria County MUD #40 Part B1 pt 5": "Brazoria County MUD (#40)",
    "Brazoria County MUD #40 Part B2 pt 1": "Brazoria County MUD (#40)",
    "HARRIS-BRAZORIA COUNTIES MUD 509": "Harris-Brazoria Counties MUD (#509)",
    "HARRIS-BRAZORIA COUNTIES MUD 509 (PART 2)": "Harris-Brazoria Counties MUD (#509)",
    "HARRIS-BRAZORIA COUNTIES MUD 509 (PART 3)": "Harris-Brazoria Counties MUD (#509)",
    "HARRIS-BRAZORIA COUNTIES MUD 509 (PART 4 TR 1-A)": "Harris-Brazoria Counties MUD (#509)",
    "HARRIS-BRAZORIA COUNTIES MUD 509 (PART 4 TR 1-B)": "Harris-Brazoria Counties MUD (#509)",
    "HARRIS-BRAZORIA COUNTIES MUD 509 (PART 4 TR 1-C)": "Harris-Brazoria Counties MUD (#509)",
    "HARRIS-BRAZORIA COUNTIES MUD 509 (PART 4 TR 2)": "Harris-Brazoria Counties MUD (#509)",
    "HARRIS-BRAZORIA COUNTIES MUD 509 (PART 4 TR 3)": "Harris-Brazoria Counties MUD (#509)",
    "HARRIS-BRAZORIA COUNTIES MUD 509 (PART 4 TR 4)": "Harris-Brazoria Counties MUD (#509)",
    "HARRIS-BRAZORIA COUNTIES MUD 509 (PART 4 TR 5)": "Harris-Brazoria Counties MUD (#509)",
    "HARRIS-BRAZORIA COUNTIES MUD 509 (PART 4 TR 6)": "Harris-Brazoria Counties MUD (#509)",
    "HARRIS-BRAZORIA COUNTIES MUD 509 (PART 4 TR 7)": "Harris-Brazoria Counties MUD (#509)",
    "HARRIS-BRAZORIA COUNTIES MUD 509 (PART 4 TR 8)": "Harris-Brazoria Counties MUD (#509)",
    "HARRIS-BRAZORIA COUNTIES MUD 509 (PART 5)": "Harris-Brazoria Counties MUD (#509)",
    "HARRIS-BRAZORIA COUNTY MUD 509": "Harris-Brazoria Counties MUD (#509)",
    "MUD 81": "Brazoria County MUD (#81)",
    "MUD 87": "Brazoria County MUD (#87)",
    "(Inactive) Brazoria County MUD 63": "Inactive Brazoria County MUD (#63)",
    "(Inactive) Brazoria County MUD 65": "Inactive Brazoria County MUD (#65)",
    "(Inactive) Brazoria County MUD 80": "Inactive Brazoria County MUD (#80)"
  };

  let matchedAny = false;

  for (const section of schoolDistricts.features) {
    if (window.turf.booleanPointInPolygon(userLocation, section)) {
      finalIsd = section.properties.Name;
      matchedAny = true;
      break;
    }
  }

  for (const section of cityLimits.features) {
    if (window.turf.booleanPointInPolygon(userLocation, section)) {
      finalCity = section.properties.Name;
      matchedAny = true;
      break;
    }
  }

  for (const section of boardOfEducation.features) {
    if (window.turf.booleanPointInPolygon(userLocation, section)) {
      finalBoardOfEd = `District ${section.properties.District}`;
      matchedAny = true;
      break;
    }
  }

  for (const section of congressDistricts.features) {
    if (window.turf.booleanPointInPolygon(userLocation, section)) {
      finalCongressDist = `District ${section.properties.District}`;
      matchedAny = true;
      break;
    }
  }

  for (const section of precincts.features) {
    if (window.turf.booleanPointInPolygon(userLocation, section)) {
      finalPrecinct = `Precinct ${section.properties.DISTRICT}`;
      matchedAny = true;
      break;
    }
  }

  for (const section of stateRepDistricts.features) {
    if (window.turf.booleanPointInPolygon(userLocation, section)) {
      finalStateRep = `District ${section.properties.District}`;
      matchedAny = true;
      break;
    }
  }

  for (const section of stateSenDistricts.features) {
    if (window.turf.booleanPointInPolygon(userLocation, section)) {
      finalStateSen = `District ${section.properties.District}`;
      matchedAny = true;
      break;
    }
  }

  for (const section of college.features) {
    if (window.turf.booleanPointInPolygon(userLocation, section)) {
      finalCollege = section.properties.Name;
      matchedAny = true;
      break;
    }
  }

  for (const section of drainageDistricts.features) {
    if (window.turf.booleanPointInPolygon(userLocation, section)) {
      finalDrainage = section.properties.Name;
      matchedAny = true;
      break;
    }
  }

  for (const section of hospital.features) {
    if (window.turf.booleanPointInPolygon(userLocation, section)) {
      finalHospital = section.properties.Name;
      matchedAny = true;
      break;
    }
  }

  for (const section of mud.features) {
    if (window.turf.booleanPointInPolygon(userLocation, section)) {
      const rawMudName = section.properties.Name;
      matchedAny = true;
      if (mudNameDictionary[rawMudName]) {
        finalMud = mudNameDictionary[rawMudName];
      } else {
        const match = rawMudName.match(/#\s*(\d+)/) || rawMudName.match(/No\s*(\d+)/i) || rawMudName.match(/\b(\d+)\b/);
        if (match) {
          const number = match[1];
          let strippedName = rawMudName.replace(new RegExp(`\\s*(#|No)?\\s*${number}`, 'i'), '').trim();
          if (strippedName.toUpperCase() === 'BRAZORIA COUNTY MUD') strippedName = 'Brazoria County MUD';
          if (strippedName.toUpperCase() === 'BRAZORIA COUNTY FRESH WATER SUPPLY DISTRICT') strippedName = 'Brazoria County Fresh Water Supply District';
          finalMud = `${strippedName} (#${number})`;
        } else {
          finalMud = rawMudName;
        }
      }
      break;
    }
  }

  for (const section of navigationDistricts.features) {
    if (window.turf.booleanPointInPolygon(userLocation, section)) {
      finalNavigation = section.properties.Name;
      matchedAny = true;
      break;
    }
  }

  const result = saveCityAndIsd(finalCity, finalIsd, finalBoardOfEd, finalCongressDist, finalPrecinct, finalStateRep, finalStateSen, finalCollege, finalDrainage, finalHospital, finalMud, finalNavigation);
  result.isOutside = !matchedAny;
  return result;
}

function getFallbackData() {
  const defaultCity = localStorage.getItem('city');
  if (defaultCity) {
    return saveCityAndIsd(
      localStorage.getItem('city') || "All Cities",
      localStorage.getItem('isd') || "All ISDs",
      localStorage.getItem('boardOfEd') || "All State Board of Education Districts",
      localStorage.getItem('congressDist') || "All Congressional Districts",
      localStorage.getItem('precinct') || "All Justice of the Peace Precincts",
      localStorage.getItem('stateRep') || "All State Representative Districts",
      localStorage.getItem('stateSen') || "All State Senate Districts",
      localStorage.getItem('college') || "All College Districts",
      localStorage.getItem('drainage') || "All Drainage Districts",
      localStorage.getItem('hospital') || "All Hospital Districts",
      localStorage.getItem('mud') || "All MUDs",
      localStorage.getItem('navigation') || "All Navigation Precincts"
    );
  }
  return saveCityAndIsd("All Cities", "All ISDs", "All State Board of Education Districts", "All Congressional Districts", "All Justice of the Peace Precincts", "All State Representative Districts", "All State Senate Districts", "All College Districts", "All Drainage Districts", "All Hospital Districts", "All MUDs", "All Navigation Precincts");
}

async function doBackgroundCheck() {
  if (sessionStorage.getItem('locationCheckedThisSession')) return;
  sessionStorage.setItem('locationCheckedThisSession', 'true');
  
  const oldVals = getFallbackData();
  
  try {
    const { lat, long } = await getCoordinates();
    const newData = await processLocation(lat, long); 
    
    if (newData.isOutside) {
      saveCityAndIsd(oldVals.city, oldVals.isd, oldVals.boardOfEd, oldVals.congressDist, oldVals.precinct, oldVals.stateRep, oldVals.stateSen, oldVals.college, oldVals.drainage, oldVals.hospital, oldVals.mud, oldVals.navigation);
      return;
    }
    
    const keys = ['city', 'isd', 'boardOfEd', 'congressDist', 'precinct', 'stateRep', 'stateSen', 'college', 'drainage', 'hospital', 'mud', 'navigation'];
    let isDifferent = false;
    
    for (let k of keys) {
      if (newData[k] !== localStorage.getItem(k)) {
        isDifferent = true;
        break;
      }
    }
    
    if (isDifferent) {
      keys.forEach(k => localStorage.setItem(k, newData[k]));
      window.dispatchEvent(new CustomEvent('locationBackgroundUpdated', { detail: newData }));
    }
  } catch (e) {
    saveCityAndIsd(oldVals.city, oldVals.isd, oldVals.boardOfEd, oldVals.congressDist, oldVals.precinct, oldVals.stateRep, oldVals.stateSen, oldVals.college, oldVals.drainage, oldVals.hospital, oldVals.mud, oldVals.navigation);
  }
}

export async function forceRecalculate() {
  try {
    const { lat, long } = await getCoordinates();
    const data = await processLocation(lat, long);
    sessionStorage.setItem('locationCheckedThisSession', 'true');
    if (!data.isOutside) {
      const keys = ['city', 'isd', 'boardOfEd', 'congressDist', 'precinct', 'stateRep', 'stateSen', 'college', 'drainage', 'hospital', 'mud', 'navigation'];
      keys.forEach(k => localStorage.setItem(k, data[k]));
      return data;
    } else {
      alert("Location is outside the county. Reverting to last saved location or defaults.");
      return getFallbackData();
    }
  } catch (error) {
    if (error && error.code === 1) {
      alert("Permission denied. Reverting to defaults.");
    } else if (error && error.code === 2) {
      alert("Position unavailable. Reverting to defaults.");
    } else if (error && error.code === 3) {
      alert("Location request timed out. Reverting to defaults.");
    } else {
      alert("Could not retrieve location. Error: " + (error.message || error));
    }
    return getFallbackData();
  }
}

export async function runCoords(lat, long) {
  try {
    const oldVals = getFallbackData();
    const data = await processLocation(lat, long);
    sessionStorage.setItem('locationCheckedThisSession', 'true');
    if (!data.isOutside) {
      return data;
    } else {
      alert("Coordinates are outside the county. Reverting to last saved location or defaults.");
      return saveCityAndIsd(oldVals.city, oldVals.isd, oldVals.boardOfEd, oldVals.congressDist, oldVals.precinct, oldVals.stateRep, oldVals.stateSen, oldVals.college, oldVals.drainage, oldVals.hospital, oldVals.mud, oldVals.navigation);
    }
  } catch (error) {
    console.error(error);
    return getFallbackData();
  }
}

export async function testCoords(lat, long) {
  try {
    const result = await processLocation(lat, long);
    console.log(result);
    return result;
  } catch (error) {
    console.error(error);
  }
}

window.testCoords = testCoords;

export const locationDataReady = (async function initLocation() {
  const cachedCity = sessionStorage.getItem('city');
  const cachedIsd = sessionStorage.getItem('isd');
  const cachedBoardOfEd = sessionStorage.getItem('boardOfEd');
  const cachedCongressDist = sessionStorage.getItem('congressDist');
  const cachedPrecinct = sessionStorage.getItem('precinct');
  const cachedStateRep = sessionStorage.getItem('stateRep');
  const cachedStateSen = sessionStorage.getItem('stateSen');
  const cachedCollege = sessionStorage.getItem('college');
  const cachedDrainage = sessionStorage.getItem('drainage');
  const cachedHospital = sessionStorage.getItem('hospital');
  const cachedMud = sessionStorage.getItem('mud');
  const cachedNavigation = sessionStorage.getItem('navigation');
 
  if (cachedCity && cachedIsd && cachedBoardOfEd && cachedCongressDist && cachedPrecinct && cachedStateRep && cachedStateSen && cachedCollege && cachedDrainage && cachedHospital && cachedMud && cachedNavigation) {
    return {
      city: cachedCity,
      isd: cachedIsd,
      boardOfEd: cachedBoardOfEd,
      congressDist: cachedCongressDist,
      precinct: cachedPrecinct,
      stateRep: cachedStateRep,
      stateSen: cachedStateSen,
      college: cachedCollege,
      drainage: cachedDrainage,
      hospital: cachedHospital,
      mud: cachedMud,
      navigation: cachedNavigation
    };
  }

  const defaultCity = localStorage.getItem('city');
  if (defaultCity) {
    doBackgroundCheck();
    return getFallbackData();
  }

  try {
    const { lat, long } = await getCoordinates();
    const data = await processLocation(lat, long);
    sessionStorage.setItem('locationCheckedThisSession', 'true');
    if (!data.isOutside) {
      const keys = ['city', 'isd', 'boardOfEd', 'congressDist', 'precinct', 'stateRep', 'stateSen', 'college', 'drainage', 'hospital', 'mud', 'navigation'];
      keys.forEach(k => localStorage.setItem(k, data[k]));
      return data;
    } else {
      return getFallbackData();
    }
  } catch (error) {
    sessionStorage.setItem('locationCheckedThisSession', 'true');
    return getFallbackData();
  }
})();