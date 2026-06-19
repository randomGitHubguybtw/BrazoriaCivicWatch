import { masterSummaries } from '../data/summaries.js';

const supabaseUrl = 'https://wytipsmhzgrtxhpojvjt.supabase.co';
const supabaseKey = 'sb_publishable_95Eiuz84ZNZxm83jTGrF-Q_GS6uViKk';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

const allowedCities = [
  "Alvin", "Angleton", "Bailey's Prairie", "Bonney", "Brazoria", "Brazoria County",
  "Brookside Village", "Clute", "Danbury", "Freeport", "Hillcrest Village",
  "Holiday Lakes", "Iowa Colony", "Jones Creek", "Lake Jackson", "Liverpool",
  "Manvel", "Oyster Creek", "Pearland", "Quintana", "Richwood", "Sandy Point",
  "Surfside", "Sweeny", "West Columbia", "Alvin ISD", "Angleton ISD", "Brazosport ISD",
  "Columbia-Brazoria ISD", "Damon ISD", "Danbury ISD", "Friendswood ISD", "Pearland ISD",
  "Sweeny ISD"
];

async function checkAccess() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) window.location.replace("../webpages/login.html");
}

async function loadMySubmissions() {
  const { data: { user } } = await supabase.auth.getUser();
  
  const oneMonthAgo = new Date();
  oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
  const dateLimit = oneMonthAgo.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('summaries')
    .select('*')
    .eq('user_id', user.id)
    .gte('date', dateLimit)
    .order('date', { ascending: false });

  if (error) return;
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
  await supabase.from('summaries').delete().eq('id', id);
  loadMySubmissions();
};

window.editMeeting = async (id) => {
  const { data } = await supabase.from('summaries').select('*').eq('id', id).single();
  document.getElementById('editId').value = data.id;
  document.getElementById('cityInput').value = data.city;
  document.getElementById('dateInput').value = data.date;
  document.getElementById('absenteesInput').value = data.absentees ? data.absentees.join(', ') : '';
  document.getElementById('transcriptionLinkInput').value = data.transcriptionLink;
  document.getElementById('transcriptionInput').value = data.transcription;
  document.getElementById('summaryInput').value = data.summary;
  document.getElementById('saveButton').innerText = 'Update Meeting';
  document.getElementById('cancelButton').style.display = 'inline';
};

async function saveMeeting() {
  const { data: { user } } = await supabase.auth.getUser();
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
    user_id: user.id,
    city: city,
    date: date,
    absentees: document.getElementById('absenteesInput').value.split(',').map(n => n.trim()),
    transcriptionLink: transcriptionLink,
    transcription: document.getElementById('transcriptionInput').value,
    summary: summary
  };

  if (id) {
    await supabase.from('summaries').update(payload).eq('id', id);
  } else {
    await supabase.from('summaries').insert([payload]);
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