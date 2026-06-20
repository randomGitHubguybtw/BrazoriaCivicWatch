export const masterSummaries = []; 
const API_BASE = 'http://localhost:3000';

// Helper function to keep our formatting rules clean
function formatData(rawData) {
  return rawData.map(meeting => {
    if (meeting.date) meeting.date = String(meeting.date).substring(0, 10);
    if (typeof meeting.absentees === 'string') {
      try { meeting.absentees = JSON.parse(meeting.absentees); } 
      catch (e) { meeting.absentees = [meeting.absentees]; }
    }
    return meeting;
  });
}

// 1. Check if the browser already downloaded the database this session
const cachedData = sessionStorage.getItem('civicWatchSummaries');

if (cachedData) {
  // INSTANT LOAD: If yes, load it in 0 milliseconds!
  masterSummaries.push(...JSON.parse(cachedData));
  console.log("Loaded instantly from browser cache!");
  
  // Quietly fetch fresh data in the background to keep the cache up to date for the next click
  fetch(`${API_BASE}/api/summaries`)
    .then(res => res.json())
    .then(data => {
      sessionStorage.setItem('civicWatchSummaries', JSON.stringify(formatData(data)));
    }).catch(err => console.error(err));

} else {
  // DELAY ONCE: If no cache, wait for the database (only happens on the first visit)
  try {
    const response = await fetch(`${API_BASE}/api/summaries`);
    if (!response.ok) throw new Error("Failed to fetch");
    const data = await response.json();
    
    const formattedData = formatData(data);
    masterSummaries.push(...formattedData);
    
    // Save it to the browser memory for the next page click
    sessionStorage.setItem('civicWatchSummaries', JSON.stringify(formattedData));
    console.log("Fetched from database and cached!");
  } catch (error) {
    console.error("Failed to fetch from Database:", error);
  }
}