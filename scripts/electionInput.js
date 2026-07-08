import { locationDataReady } from "./locationStore.js";
import { masterAddresses } from "../data/publicPlaces.js";

function pluralize(word) {
  if (!word) return "Places";
  const lower = word.toLowerCase();
  if (lower === "dps" || lower === "d.p.s." || lower === "d.p.s") return "DPS Locations";
  if (lower.endsWith('y') && !['a', 'e', 'i', 'o', 'u'].includes(lower.charAt(lower.length - 2))) {
    return word.slice(0, -1) + 'ies';
  }
  if (lower.endsWith('s') || lower.endsWith('x') || lower.endsWith('ch') || lower.endsWith('sh')) {
    return word + 'es';
  }
  return word + 's';
}

function getSearchQuery(place) {
  const address = place.Address || "";
  const name = place.Name || "";
  
  const isStandardAddress = /^\d+/.test(address.trim());

  if (isStandardAddress) {
    return address;
  } else {
    const cityContext = place.city ? `, ${place.city}, TX` : "";
    return name + cityContext;
  }
}

function applySearchFilter() {
  const searchInput = document.getElementById("placeSearchInput");
  if (!searchInput) return;
  
  const term = searchInput.value.toLowerCase();
  const sections = document.querySelectorAll(".place-section");
  
  sections.forEach(section => {
    let hasVisibleCard = false;
    const sectionType = section.getAttribute("data-type");
    const pluralType = pluralize(sectionType).toLowerCase();
    const cards = section.querySelectorAll(".place-card");
    
    cards.forEach(card => {
      const name = card.querySelector(".place-card-title").textContent.toLowerCase();
      const address = card.querySelector(".place-card-address").textContent.toLowerCase();
      
      if (name.includes(term) || address.includes(term) || sectionType.includes(term) || pluralType.includes(term)) {
        card.style.display = "flex";
        hasVisibleCard = true;
      } else {
        card.style.display = "none";
      }
    });
    
    if (hasVisibleCard) {
      section.style.display = "block";
    } else {
      section.style.display = "none";
    }
  });
}

async function initializePublicPlaces() {
  const locationData = await locationDataReady;
  
  const city = sessionStorage.getItem('city') || locationData.city;
  const isd = sessionStorage.getItem('isd') || locationData.isd;
  
  let filteredPlaces = [];
  const invalidCities = ["none", "all cities", "brazoria county"];
  
  const currentCityLower = city ? city.toLowerCase() : "none";

  if (invalidCities.includes(currentCityLower)) {
    filteredPlaces = masterAddresses;
  } else {
    filteredPlaces = masterAddresses.filter(place => place.city && place.city.toLowerCase() === currentCityLower);
  }

  const groupedPlaces = {};
  filteredPlaces.forEach(place => {
    const type = place.Type || "Other";
    if (!groupedPlaces[type]) {
      groupedPlaces[type] = [];
    }
    groupedPlaces[type].push(place);
  });

  const container = document.getElementById("places-container");
  container.innerHTML = "";

  if (Object.keys(groupedPlaces).length === 0) {
    container.innerHTML = `<p class="default-location-text" style="color: var(--white-text-color);">No public places found for your current location setting.</p>`;
    return;
  }

  for (const [type, places] of Object.entries(groupedPlaces)) {
    const section = document.createElement("div");
    section.className = "place-section";
    section.setAttribute("data-type", type.toLowerCase());
    
    const header = document.createElement("h2");
    header.className = "places-section-title";
    header.textContent = pluralize(type);
    section.appendChild(header);

    const grid = document.createElement("div");
    grid.className = "places-grid";

    places.forEach(place => {
      const card = document.createElement("div");
      card.className = "place-card";
      
      const name = document.createElement("h3");
      name.className = "place-card-title";
      name.textContent = place.Name;
      
      const address = document.createElement("p");
      address.className = "place-card-address";
      address.textContent = place.Address;
      
      const btn = document.createElement("a");
      btn.className = "place-card-btn";
      btn.textContent = "Get Directions";
      
      const searchQuery = getSearchQuery(place);
      
      btn.href = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(searchQuery)}`;
      btn.target = "_blank";
      
      card.appendChild(name);
      card.appendChild(address);
      card.appendChild(btn);
      grid.appendChild(card);
    });

    section.appendChild(grid);
    container.appendChild(section);
  }

  applySearchFilter();
}

document.addEventListener("DOMContentLoaded", () => {
  initializePublicPlaces();
  
  const searchInput = document.getElementById("placeSearchInput");
  if (searchInput) {
    searchInput.addEventListener("input", applySearchFilter);
  }
});

document.addEventListener("click", (e) => {
  if (e.target.closest('#placeSearchInput') || e.target.closest('a')) {
    return;
  }
  initializePublicPlaces();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    initializePublicPlaces();
  }
});