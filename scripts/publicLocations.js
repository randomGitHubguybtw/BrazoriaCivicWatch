import { locationDataReady } from "./locationStore.js";
import { masterAddresses } from "../data/publicPlaces.js";
import { fixDate } from './utils/fixDate.js';

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

function normalizeForMatch(str) {
  if (!str) return "";
  return str.toLowerCase().replace(/[.,#'-]/g, '').replace(/\s+/g, '').trim();
}

function getStreetBase(addr) {
  if (!addr) return "";
  return normalizeForMatch(addr.split(',')[0]);
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
      
      const badgeNode = card.querySelector(".voting-badge");
      const badgeText = badgeNode ? badgeNode.textContent.toLowerCase() : "";
      
      if (name.includes(term) || address.includes(term) || sectionType.includes(term) || pluralType.includes(term) || badgeText.includes(term)) {
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
  
  let filteredPlaces = [];
  const invalidCities = ["none", "all cities", "brazoria county"];
  
  const currentCityLower = city ? city.toLowerCase() : "none";

  if (invalidCities.includes(currentCityLower)) {
    filteredPlaces = masterAddresses;
  } else {
    filteredPlaces = masterAddresses.filter(place => place.city && place.city.toLowerCase() === currentCityLower);
  }

  const API_BASE = 'https://api.brazoriacivicwatch.org';
  let pollingAddresses = [];
  let pollingLocations = [];
  let allElections = [];
  let targetElectionId = sessionStorage.getItem('nextElection') || sessionStorage.getItem('targetElection');

  try {
    const [addressesRes, locationsRes, electionsRes] = await Promise.all([
      fetch(`${API_BASE}/api/polling_addresses`),
      fetch(`${API_BASE}/api/polling_locations`),
      fetch(`${API_BASE}/api/elections`)
    ]);
    
    if (addressesRes.ok) pollingAddresses = await addressesRes.json();
    if (locationsRes.ok) pollingLocations = await locationsRes.json();
    if (electionsRes.ok) allElections = await electionsRes.json();

    if (!targetElectionId && allElections.length > 0) {
      const now = new Date();
      const upcoming = allElections.filter(el => {
        const [y, m, d] = el.date.split('-');
        const electionDate = new Date(y, m - 1, d);
        return electionDate >= new Date(now.getFullYear(), now.getMonth(), now.getDate());
      }).sort((a, b) => new Date(a.date) - new Date(b.date));

      if (upcoming.length > 0) {
        targetElectionId = upcoming[0].election_id;
      }
    }
  } catch (err) {}

  const validLocations = pollingLocations.filter(loc => loc.election_id === targetElectionId);
  const validLocationIds = new Set(validLocations.map(loc => loc.locations_id));
  const activePollingAddresses = pollingAddresses.filter(addr => validLocationIds.has(addr.locations_id));

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
      
      const pStreet = getStreetBase(place.Address);
      const pName = normalizeForMatch(place.Name);
      
      const isVotingMatch = activePollingAddresses.find(pa => {
        const paStreet = getStreetBase(pa.address);
        const paName = normalizeForMatch(pa.name);
        
        const streetMatches = pStreet && paStreet && (pStreet === paStreet || pStreet.includes(paStreet) || paStreet.includes(pStreet));
        const nameMatches = pName && paName && (pName === paName || pName.includes(paName) || paName.includes(pName));
        
        return streetMatches || nameMatches;
      });

      if (isVotingMatch && targetElectionId) {
        const formattedDate = fixDate(targetElectionId);
        
        const votingBadge = document.createElement("div");
        votingBadge.className = "voting-badge";
        votingBadge.textContent = `Polling Location for ${formattedDate} Election`;
        
        votingBadge.style.backgroundColor = "var(--accent-color)";
        votingBadge.style.color = "var(--black-text-color)";
        votingBadge.style.padding = "8px 12px";
        votingBadge.style.borderRadius = "6px";
        votingBadge.style.fontWeight = "800";
        votingBadge.style.fontSize = "1rem";
        votingBadge.style.textAlign = "center";
        votingBadge.style.border = "2px solid var(--secondary-color)";
        votingBadge.style.boxShadow = "2px 2px 0px var(--primary-color)";
        votingBadge.style.marginBottom = "10px";
        
        card.style.borderColor = "var(--accent-color)";
        card.style.borderWidth = "3px";
        
        card.appendChild(votingBadge);
      }

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
  setTimeout(initializePublicPlaces, 50);
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    setTimeout(initializePublicPlaces, 50);
  }
});