const supabaseUrl = 'https://wytipsmhzgrtxhpojvjt.supabase.co';
const supabaseKey = 'sb_publishable_95Eiuz84ZNZxm83jTGrF-Q_GS6uViKk';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

const showPasswordBtn = document.getElementById('showPasswordBtn');
const passwordInput = document.getElementById('passwordInput');
const emailInput = document.getElementById('emailInput');
const submitBtn = document.getElementById('submitBtn');
const mainContainer = document.getElementById('mainContainer');

if (localStorage.getItem('hasVisitedSetPassword') === 'true') {
    emailInput.disabled = true;
    passwordInput.disabled = true;
    showPasswordBtn.disabled = true;
    submitBtn.disabled = true;
    submitBtn.innerText = 'Access Denied';
    
    const deniedMsg = document.createElement('h2');
    deniedMsg.style.color = 'red';
    deniedMsg.innerText = 'Access Denied. Password already set.';
    mainContainer.prepend(deniedMsg);
    
    throw new Error('Page locked.');
}

supabase.auth.getSession().then(({ data: { session } }) => {
    if (session && session.user && session.user.email) {
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

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (session) {
        const { error: updateError } = await supabase.auth.updateUser({ password: password });
        
        if (updateError) {
            alert('Error updating password: ' + updateError.message);
        } else {
            localStorage.setItem('hasVisitedSetPassword', 'true');
            alert('Password set successfully!');
            window.location.replace('webpages/login.html'); 
        }
    } else {
        alert('Invalid or expired invitation link. Please use the link sent to your email.');
    }
});