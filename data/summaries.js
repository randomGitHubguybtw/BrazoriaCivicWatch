export const masterSummaries = []; 
const API_BASE = 'https://api.brazoriacivicwatch.org';

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

const cachedData = sessionStorage.getItem('civicWatchSummaries');

if (cachedData) {
  masterSummaries.push(...JSON.parse(cachedData));
  console.log("Loaded instantly from browser cache!");
  
  fetch(`${API_BASE}/api/summaries`)
    .then(res => res.json())
    .then(data => {
      sessionStorage.setItem('civicWatchSummaries', JSON.stringify(formatData(data)));
    }).catch(err => console.error(err));

} else {
  try {
    const response = await fetch(`${API_BASE}/api/summaries`);
    if (!response.ok) throw new Error("Failed to fetch");
    const data = await response.json();
    
    const formattedData = formatData(data);
    masterSummaries.push(...formattedData);
    
    sessionStorage.setItem('civicWatchSummaries', JSON.stringify(formattedData));
    console.log("Fetched from database and cached!");
  } catch (error) {
    console.error("Failed to fetch from Database:", error);
  }
}