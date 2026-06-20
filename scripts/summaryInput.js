import { masterSummaries } from '../data/summaries.js';

const supabaseUrl = 'https://wytipsmhzgrtxhpojvjt.supabase.co';
const supabaseKey = 'sb_publishable_95Eiuz84ZNZxm83jTGrF-Q_GS6uViKk';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

const API_BASE = 'http://localhost:3000';

const allowedCities = [
  "Alvin", "Angleton", "Bailey's Prairie", "Bonney", "Brazoria", "Brazoria County",
  "Brookside Village", "Clute", "Danbury", "Freeport", "Hillcrest Village",
  "Holiday Lakes", "Iowa Colony", "Jones Creek", "Lake Jackson", "Liverpool",
  "Manvel", "Oyster Creek", "Pearland", "Quintana", "Richwood", "Sandy Point",
  "Surfside", "Sweeny", "West Columbia", "Alvin ISD", "Angleton ISD", "Brazosport ISD",
  "Columbia-Brazoria ISD", "Damon ISD", "Danbury ISD", "Friendswood ISD", "Pearland ISD",
  "Sweeny ISD"
];

async function getToken() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token;
}

async function checkAccess() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) window.location.replace("../webpages/login.html");
}

async function loadMySubmissions() {
  const token = await getToken();
  if (!token) return;

  const oneMonthAgo = new Date();
  oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
  const dateLimit = oneMonthAgo.toISOString().split('T')[0];

  const response = await fetch(`${API_BASE}/api/summaries/me?dateLimit=${dateLimit}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!response.ok) return;
  const data = await response.json();

  const container = document.getElementById('mySubmissions');
  container.innerHTML = data.map(m => `
    <div style="margin-bottom:10px;">
      <strong class="meeting-date">${m.city} (${m.date})</strong>
      <button class="js-hands-off edit-button" onclick="window.editMeeting('${m.id}')">Edit</button>
      <button class="js-hands-off edit-button" onclick="window.deleteMeeting('${m.id}')">Delete</button>
    </div>
  `).join('');
}

window.deleteMeeting = async (id) => {
  const token = await getToken();
  await fetch(`${API_BASE}/api/summaries/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  sessionStorage.removeItem('civicWatchSummaries');
  loadMySubmissions();
};

window.editMeeting = async (id) => {
  const token = await getToken();
  const response = await fetch(`${API_BASE}/api/summaries/${id}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  
  document.getElementById('editId').value = data.id;
  document.getElementById('cityInput').value = data.city;
  document.getElementById('dateInput').value = data.date;
  
  let absenteesVal = data.absentees;
  if (typeof absenteesVal === 'string') absenteesVal = JSON.parse(absenteesVal);
  document.getElementById('absenteesInput').value = absenteesVal ? absenteesVal.join(', ') : '';
  
  document.getElementById('transcriptionLinkInput').value = data.transcriptionLink;
  document.getElementById('transcriptionInput').value = data.transcription;
  document.getElementById('summaryInput').value = data.summary;
  document.getElementById('saveButton').innerText = 'Update Meeting';
  document.getElementById('cancelButton').style.display = 'inline';
};

async function saveMeeting() {
  const token = await getToken();
  if (!token) return;

  const id = document.getElementById('editId').value;
  const city = document.getElementById('cityInput').value.trim();
  const date = document.getElementById('dateInput').value.trim();
  const transcriptionLink = document.getElementById('transcriptionLinkInput').value.trim();
  const summary = document.getElementById('summaryInput').value.trim();

  if (!city || !date || !transcriptionLink || !summary) {
    alert("Please fill out the required fields: Meeting Location, Date, Transcription Link, and Summary.");
    return;
  }

  if (!allowedCities.includes(city)) {
    alert("Please select a valid Meeting Location from the dropdown list.");
    return;
  }

  const payload = {
    city: city,
    date: date,
    absentees: document.getElementById('absenteesInput').value.split(',').map(n => n.trim()),
    transcriptionLink: transcriptionLink,
    transcription: document.getElementById('transcriptionInput').value,
    summary: summary
  };

  const endpoint = id ? `${API_BASE}/api/summaries/${id}` : `${API_BASE}/api/summaries`;
  const method = id ? 'PUT' : 'POST';

  const response = await fetch(endpoint, {
    method: method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    alert("Error saving to database! The server rejected the request.");
    console.error("Server responded with status:", response.status);
    return;
  }
  
  document.getElementById('cityInput').value = '';
  document.getElementById('dateInput').value = '';
  document.getElementById('absenteesInput').value = '';
  document.getElementById('transcriptionLinkInput').value = '';
  document.getElementById('transcriptionInput').value = '';
  document.getElementById('summaryInput').value = '';
  document.getElementById('editId').value = '';
  document.getElementById('saveButton').innerText = 'Save to Archive';
  document.getElementById('cancelButton').style.display = 'none';
  sessionStorage.removeItem('civicWatchSummaries');
  loadMySubmissions();
}

document.getElementById('cancelButton').onclick = () => {
  document.getElementById('editId').value = '';
  document.getElementById('saveButton').innerText = 'Save to Archive';
  document.getElementById('cancelButton').style.display = 'none';
};

checkAccess();
loadMySubmissions();
document.getElementById('saveButton').addEventListener('click', saveMeeting);