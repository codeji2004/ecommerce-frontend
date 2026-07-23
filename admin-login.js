const API_BASE = 'https://ecommerce-backend-noia.onrender.com';
const form = document.querySelector('#login-form');
const error = document.querySelector('#login-error');
form.addEventListener('submit', async event => {
  event.preventDefault();
  error.textContent = '';
  const data = Object.fromEntries(new FormData(form));
  const response = await fetch(`${API_BASE}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  const result = await response.json();
  if (!response.ok) return (error.textContent = result.message || 'تعذر تسجيل الدخول.');
  window.location.href = '/admin.html';
});
