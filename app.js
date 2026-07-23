const state = { products: [], active: 'الكل', selected: null };
const money = n => `${Number(n).toLocaleString('ar-DZ')} د.ج`;
const API_BASE = 'https://ecommerce-backend-noia.onrender.com';
const $ = selector => document.querySelector(selector);

async function loadProducts() {
  state.products = await fetch(`${API_BASE}/api/products`).then(response => response.json());
  renderProducts();
}

function renderProducts() {
  const products = state.active === 'الكل' ? state.products : state.products.filter(product => product.category === state.active);
  $('#products-grid').innerHTML = products.map(product => `<article class="product-card" data-buy="${product._id}"><button class="product-image" aria-label="طلب ${product.name}"><img src="${product.image}" alt="${product.name}"><span>اطلب الآن ←</span></button><div class="product-info"><small>${product.category}</small><h3>${product.name}</h3><strong>${money(product.price)}</strong></div></article>`).join('');
}

function openCheckout(id) {
  const product = state.products.find(item => item._id === id);
  if (!product) return;
  state.selected = product;
  $('#checkout-product-name').textContent = product.name;
  $('#checkout-product-price').textContent = `${money(product.price)} — الدفع عند الاستلام فقط.`;
  $('#checkout-modal').classList.add('visible');
}

function showToast(message) {
  $('#toast').textContent = message;
  $('#toast').classList.add('show');
  setTimeout(() => $('#toast').classList.remove('show'), 2800);
}

document.addEventListener('click', event => {
  const button = event.target.closest('button');
  const buyTarget = event.target.closest('[data-buy]');
  if (buyTarget) openCheckout(buyTarget.dataset.buy);
  if (button?.dataset.category) {
    state.active = button.dataset.category;
    document.querySelectorAll('#filters button').forEach(item => item.classList.toggle('active', item === button));
    renderProducts();
  }
  if (button?.classList.contains('close-modal')) $('#checkout-modal').classList.remove('visible');
});

$('#checkout-form').onsubmit = async event => {
  event.preventDefault();
  if (!state.selected) return;
  const form = new FormData(event.target);
  const item = { id: state.selected._id, name: state.selected.name, price: state.selected.price, image: state.selected.image, quantity: 1 };
  const response = await fetch(`${API_BASE}/api/orders`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ customer: Object.fromEntries(form), items: [item], total: state.selected.price }) });
  const result = await response.json();
  if (!response.ok) return showToast(result.message || 'تعذر إرسال الطلب.');
  state.selected = null;
  event.target.reset();
  $('#checkout-modal').classList.remove('visible');
  showToast('تم تأكيد طلبك! سنتواصل معك قريبًا.');
};

loadProducts().catch(() => showToast('تعذر تحميل المنتجات.'));

async function checkAdminSession() {
  try {
    const res = await fetch(`${API_BASE}/api/auth/me`);
    if (res.ok) {
      const adminNav = $('#admin-nav-item');
      if (adminNav) {
        adminNav.innerHTML = `<a href="/admin.html" class="admin-badge-button">لوحة الإدارة ⚙️</a>`;
      }
    }
  } catch (_) {}
}
checkAdminSession();

if (typeof io !== 'undefined') {
  const socket = io(API_BASE);
  socket.on('products-updated', () => loadProducts().catch(() => {}));
}
