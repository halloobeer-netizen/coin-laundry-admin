(() => {
  const style = document.createElement('style');
  style.textContent = `
    .auth-hidden{visibility:hidden!important}.auth-screen{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;padding:24px;background:#f4f7fb;font-family:Inter,system-ui,sans-serif}.auth-card{width:min(420px,100%);background:#fff;border:1px solid #e3e9f1;border-radius:22px;padding:28px;box-shadow:0 24px 70px rgba(25,47,83,.12)}.auth-logo{width:52px;height:52px;border-radius:16px;display:grid;place-items:center;background:#eef3fb;font-size:25px;margin-bottom:18px}.auth-card h1{margin:0 0 8px;font-size:25px;color:#1f2e45}.auth-card p{margin:0 0 22px;color:#75839a;font-size:13px;line-height:1.55}.auth-field{display:flex;flex-direction:column;gap:7px;margin-bottom:14px;font-size:12px;font-weight:700;color:#37475f}.auth-field input{border:1px solid #dbe3ee;border-radius:11px;padding:12px 13px;font:inherit;outline:none;background:#fbfcfe}.auth-field input:focus{border-color:#315e9d;background:#fff}.auth-btn{width:100%;border:0;border-radius:11px;padding:12px 14px;background:#234f8b;color:#fff;font-weight:800;cursor:pointer}.auth-btn:disabled{opacity:.55;cursor:default}.auth-state{min-height:18px;margin-top:12px;font-size:12px;color:#c34752}.auth-setup{background:#fff7e7;border:1px solid #f2d79d;border-radius:12px;padding:12px 14px;color:#77551a;font-size:12px;line-height:1.5}.auth-logout{border:1px solid #dce4ef;background:#fff;border-radius:10px;padding:8px 11px;font-size:12px;font-weight:700;color:#44546b;cursor:pointer}
  `;
  document.head.appendChild(style);

  const shell = document.querySelector('.app-shell');
  const mobileNav = document.querySelector('.mobile-nav');
  shell?.classList.add('auth-hidden');
  mobileNav?.classList.add('auth-hidden');

  function revealApp(configured, username) {
    shell?.classList.remove('auth-hidden');
    mobileNav?.classList.remove('auth-hidden');
    if (!configured) return;
    const actions = document.querySelector('.top-actions');
    if (actions && !document.getElementById('logoutBtn')) {
      const btn = document.createElement('button');
      btn.id = 'logoutBtn';
      btn.className = 'auth-logout';
      btn.textContent = username ? `Logout · ${username}` : 'Logout';
      btn.onclick = async () => {
        btn.disabled = true;
        try { await fetch('/api/auth', { method:'DELETE' }); } catch (_) {}
        location.reload();
      };
      actions.insertBefore(btn, actions.firstChild);
    }
  }

  function showLogin(configured) {
    const screen = document.createElement('div');
    screen.className = 'auth-screen';
    screen.innerHTML = `<div class="auth-card"><div class="auth-logo">🧺</div><h1>Login Admin</h1><p>Masuk untuk mengakses dashboard dan operasional outlet.</p>${configured ? `<form id="authForm"><label class="auth-field">Username<input id="authUsername" autocomplete="username" required></label><label class="auth-field">Password<input id="authPassword" type="password" autocomplete="current-password" required></label><button id="authSubmit" class="auth-btn" type="submit">Masuk</button><div id="authState" class="auth-state"></div></form>` : `<div class="auth-setup"><strong>Login belum diaktifkan.</strong><br>Tambahkan ADMIN_USERNAME, ADMIN_PASSWORD, dan AUTH_SECRET di Environment Variables Vercel, lalu redeploy.</div>`}</div>`;
    document.body.appendChild(screen);
    if (!configured) {
      revealApp(false);
      screen.style.position='relative'; screen.style.minHeight='100vh';
      shell?.classList.add('auth-hidden'); mobileNav?.classList.add('auth-hidden');
      return;
    }
    const form=document.getElementById('authForm');
    form.onsubmit=async e=>{
      e.preventDefault();
      const submit=document.getElementById('authSubmit');
      const state=document.getElementById('authState');
      submit.disabled=true; state.textContent='Memeriksa...';
      try {
        const r=await fetch('/api/auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:document.getElementById('authUsername').value,password:document.getElementById('authPassword').value})});
        const data=await r.json().catch(()=>({}));
        if(!r.ok) throw new Error(data.error||'Login gagal');
        location.reload();
      } catch(err){state.textContent=err.message;submit.disabled=false;}
    };
  }

  fetch('/api/auth',{cache:'no-store'})
    .then(r=>r.json())
    .then(state=>{
      if(state.configured && state.authenticated) revealApp(true,state.username);
      else showLogin(Boolean(state.configured));
    })
    .catch(()=>showLogin(false));
})();
