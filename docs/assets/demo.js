/*
 * Modo demonstração (GitHub Pages)
 * O GitHub Pages não executa PHP/MySQL, então esta versão simula o login no
 * próprio navegador. Os dados ficam apenas no localStorage de quem está usando
 * e a senha é salva somente como hash SHA-256. Não use senhas reais aqui.
 */
(() => {
  'use strict';

  const USERS_KEY = 'pf_demo_users';
  const SESSION_KEY = 'pf_demo_session';
  const page = document.body.dataset.page;

  const read = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
  };
  const write = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* modo privado */ }
  };

  async function hash(text) {
    if (window.crypto?.subtle) {
      const data = new TextEncoder().encode(`pf-demo:${text}`);
      const buf = await crypto.subtle.digest('SHA-256', data);
      return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
    }
    let h = 0;
    for (const c of text) h = (h * 31 + c.charCodeAt(0)) | 0;
    return `fallback-${h}`;
  }

  const session = () => read(SESSION_KEY, null);
  const login = user => write(SESSION_KEY, { nome: user.nome, email: user.email });
  const logout = () => { try { localStorage.removeItem(SESSION_KEY); } catch {} };

  const alertIcon = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.5v.01"/></svg>';
  const okIcon = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m8 12.5 3 3 5-6"/></svg>';

  function showAlert(type, message) {
    const form = document.querySelector('.auth-form');
    document.querySelectorAll('.auth-card .alert').forEach(el => el.remove());
    const div = document.createElement('div');
    div.className = `alert ${type}`;
    div.setAttribute('role', type === 'error' ? 'alert' : 'status');
    div.innerHTML = (type === 'error' ? alertIcon : okIcon) + '<span></span>';
    div.querySelector('span').textContent = message;
    form.before(div);
  }

  function flash(message) { try { sessionStorage.setItem('pf_flash', message); } catch {} }
  function takeFlash() {
    try { const m = sessionStorage.getItem('pf_flash'); sessionStorage.removeItem('pf_flash'); return m; } catch { return null; }
  }

  if (page === 'login' || page === 'cadastro') {
    if (session()) { location.replace('dashboard.html'); return; }
    const msg = takeFlash();
    if (msg) showAlert('success', msg);

    document.querySelector('[data-guest]')?.addEventListener('click', () => {
      login({ nome: 'Visitante', email: 'visitante@demo' });
      location.href = 'dashboard.html';
    });
  }

  if (page === 'login') {
    document.querySelector('.auth-form').addEventListener('submit', async event => {
      event.preventDefault();
      const email = event.target.email.value.trim().toLowerCase();
      const senha = event.target.senha.value;
      const users = read(USERS_KEY, []);
      const user = users.find(u => u.email === email);
      if (!user || user.senha !== await hash(senha)) {
        showAlert('error', 'E-mail ou senha incorretos.');
        return;
      }
      login(user);
      location.href = 'dashboard.html';
    });
  }

  if (page === 'cadastro') {
    document.querySelector('.auth-form').addEventListener('submit', async event => {
      event.preventDefault();
      const f = event.target;
      const nome = f.nome.value.trim();
      const email = f.email.value.trim().toLowerCase();
      const telefone = f.telefone.value.trim();
      const senha = f.senha.value;

      if (nome.length < 2) return showAlert('error', 'Informe seu nome.');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showAlert('error', 'Informe um e-mail válido.');
      if (telefone.replace(/\D/g, '').length < 10) return showAlert('error', 'Informe um telefone válido.');
      if (senha.length < 6) return showAlert('error', 'A senha precisa ter pelo menos 6 caracteres.');
      if (senha !== f.confirmar_senha.value) return showAlert('error', 'As senhas não coincidem.');

      const users = read(USERS_KEY, []);
      if (users.some(u => u.email === email)) return showAlert('error', 'Este e-mail já está cadastrado.');
      users.push({ nome, email, telefone, senha: await hash(senha), criado_em: new Date().toISOString() });
      write(USERS_KEY, users);
      flash('Conta criada! Agora é só entrar.');
      location.href = 'index.html';
    });
  }

  if (page === 'dashboard') {
    const user = session();
    if (!user) { location.replace('index.html'); return; }
    const nome = user.nome || 'Visitante';
    document.querySelectorAll('[data-user-name]').forEach(el => { el.textContent = nome; });
    document.querySelectorAll('[data-user-first]').forEach(el => { el.textContent = nome.split(' ')[0]; });
    document.querySelectorAll('.avatar').forEach(el => { el.textContent = nome.charAt(0).toUpperCase(); });
    document.querySelector('.logout')?.addEventListener('click', event => {
      event.preventDefault();
      logout();
      location.href = 'index.html';
    });
  }
})();
