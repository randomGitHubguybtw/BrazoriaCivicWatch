import { masterSummaries } from '../data/summaries.js';

const supabaseUrl = 'https://wytipsmhzgrtxhpojvjt.supabase.co';
const supabaseKey = 'sb_publishable_95Eiuz84ZNZxm83jTGrF-Q_GS6uViKk';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

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
      <strong>${m.city} (${m.date})</strong>
      <button onclick="window.editMeeting('${m.id}')">Edit</button>
      <button onclick="window.deleteMeeting('${m.id}')">Delete</button>
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
  
  const payload = {
    user_id: user.id,
    city: document.getElementById('cityInput').value,
    date: document.getElementById('dateInput').value,
    absentees: document.getElementById('absenteesInput').value.split(',').map(n => n.trim()),
    transcriptionLink: document.getElementById('transcriptionLinkInput').value,
    transcription: document.getElementById('transcriptionInput').value,
    summary: document.getElementById('summaryInput').value
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