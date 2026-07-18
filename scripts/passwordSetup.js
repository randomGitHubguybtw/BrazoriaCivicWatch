const supabaseUrl = 'https://wytipsmhzgrtxhpojvjt.supabase.co';
const supabaseKey = 'sb_publishable_95Eiuz84ZNZxm83jTGrF-Q_GS6uViKk';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

const showPasswordBtn = document.getElementById('showPasswordBtn');
const passwordInput = document.getElementById('passwordInput');
const emailInput = document.getElementById('emailInput');
const submitBtn = document.getElementById('submitBtn');

let activeSession = null;

supabase.auth.onAuthStateChange((event, session) => {
    if (session && session.user && session.user.email) {
        activeSession = session;
        emailInput.value = session.user.email;
        emailInput.disabled = true;
        emailInput.style.opacity = '0.7';
        
        if (window.location.hash) {
            window.history.replaceState(null, document.title, window.location.pathname + window.location.search);
        }
    } else {
        activeSession = null;
    }
});

supabase.auth.getSession().then(({ data: { session } }) => {
    if (session && session.user && session.user.email) {
        activeSession = session;
        emailInput.value = session.user.email;
        emailInput.disabled = true;
        emailInput.style.opacity = '0.7';
    }
});

showPasswordBtn.addEventListener('click', (e) => {
    e.preventDefault(); 
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    showPasswordBtn.innerText = type === 'password' ? 'Show' : 'Hide';
});

submitBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
        alert('Please fill out both email and password fields.');
        return;
    }

    if (password.length < 6) {
        alert('Your password must be at least 6 characters long.');
        return;
    }

    if (activeSession) {
        const { error: updateError } = await supabase.auth.updateUser({ password: password });
        
        if (updateError) {
            alert('Error updating password: ' + updateError.message);
        } else {
            alert('Password set successfully!');
            await supabase.auth.signOut();
            window.location.replace('login.html'); 
        }
    } else {
        alert('No active session found. Please use the exact link sent to your email.');
    }
});