const money = n => `${Number(n).toLocaleString('ar-DZ')} د.ج`;
const API_BASE = 'https://ecommerce-backend-noia.onrender.com';
const ordersList = document.querySelector('#orders-list');
const ordersCount = document.querySelector('#orders-count');
const productList = document.querySelector('#admin-products');
const productForm = document.querySelector('#product-form');
const statusMessage = document.querySelector('#product-status');
let orders = [];
let products = [];

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[character]));

function renderOrders() {
  ordersCount.textContent = orders.length.toLocaleString('ar-DZ');
  ordersList.innerHTML = orders.length ? orders.map(order => {
    const status = order.status || 'جديد';
    return `<article class="order" data-order-id="${order._id}">
      <div class="order-top">
        <div>
          <strong>#${String(order._id).slice(-6).toUpperCase()}</strong>
          <span class="status-tag status-${status}">${escapeHtml(status)}</span>
        </div>
        <b>${money(order.total)}</b>
      </div>
      <div class="order-customer">
        <span>👤 ${escapeHtml(order.customer.name)}</span>
        <span>☎ ${escapeHtml(order.customer.phone)}</span>
        <span>⌖ ${escapeHtml(order.customer.address)}</span>
      </div>
      <div class="order-items">
        ${order.items.map(item => `<span>${escapeHtml(item.name)} × ${item.quantity}</span>`).join('')}
      </div>
      <div class="order-actions">
        <select class="order-status-select" data-order-status="${order._id}">
          <option value="جديد" ${status === 'جديد' ? 'selected' : ''}>جديد</option>
          <option value="تم التأكيد" ${status === 'تم التأكيد' ? 'selected' : ''}>تم التأكيد</option>
          <option value="تم التوصيل" ${status === 'تم التوصيل' ? 'selected' : ''}>تم التوصيل</option>
          <option value="ملغى" ${status === 'ملغى' ? 'selected' : ''}>ملغى</option>
        </select>
        <button class="delete-order-btn" data-delete-order="${order._id}">حذف الطلب</button>
      </div>
    </article>`;
  }).join('') : '<p class="empty">لا توجد طلبات بعد.</p>';
}

function renderProducts() {
  productList.innerHTML = products.length ? products.map(product => `<article class="admin-product"><img src="${escapeHtml(product.image)}" alt=""><div><small>${escapeHtml(product.category)}</small><h3>${escapeHtml(product.name)}</h3><strong>${money(product.price)}</strong></div><div class="admin-product-actions"><button class="copy-link-btn" data-copy-link="${product._id}">نسخ الرابط 🔗</button><button data-edit="${product._id}">تعديل</button><button data-delete="${product._id}">حذف</button></div></article>`).join('') : '<p class="empty">لا توجد منتجات.</p>';
}

async function loadProducts() {
  const response = await fetch(`${API_BASE}/api/admin/products`);
  if (response.status === 401) return (window.location.href = '/admin-login.html');
  products = await response.json();
  if (!products.length) products = await fetch(`${API_BASE}/api/products`).then(result => result.json());
  renderProducts();
}

fetch(`${API_BASE}/api/orders`).then(response => { if (response.status === 401) return (window.location.href = '/admin-login.html'); return response.json(); }).then(data => { if (Array.isArray(data)) { orders = data; renderOrders(); } });
loadProducts();

const socket = io(API_BASE);
socket.on('connect', () => document.querySelector('#connection-status').textContent = 'متصل الآن');
socket.on('connect_error', () => { document.querySelector('#connection-status').textContent = 'جارٍ إعادة الاتصال…'; });
socket.on('new-order', order => { orders.unshift(order); renderOrders(); document.querySelector('#connection-status').textContent = 'وصل طلب جديد للتو!'; });

productForm.addEventListener('submit', async event => {
  event.preventDefault();
  const formData = new FormData(productForm);
  const id = formData.get('id');
  formData.delete('id');
  const response = await fetch(id ? `${API_BASE}/api/admin/products/${id}` : `${API_BASE}/api/admin/products`, { method: id ? 'PUT' : 'POST', body: formData });
  const result = await response.json();
  if (!response.ok) return (statusMessage.textContent = result.message || 'تعذر حفظ المنتج.');
  statusMessage.textContent = id ? 'تم تعديل المنتج.' : 'تمت إضافة المنتج.';
  productForm.reset();
  productForm.elements.id.value = '';
  document.querySelector('#product-submit-label').textContent = 'إضافة المنتج';
  document.querySelector('#cancel-edit').style.display = 'none';
  await loadProducts();
});

document.querySelector('#admin-products').addEventListener('click', async event => {
  const button = event.target.closest('button');
  if (!button) return;

  if (button.dataset.copyLink) {
    const product = products.find(item => String(item._id) === String(button.dataset.copyLink));
    if (!product) return;
    const link = `${window.location.origin}/product.html?id=${product._id}`;
    navigator.clipboard.writeText(link).then(() => {
      statusMessage.textContent = `تم نسخ رابط «${product.name}» المباشر! 🔗`;
    }).catch(() => {
      prompt('انسخ رابط المنتج المباشر:', link);
    });
    return;
  }

  const product = products.find(item => String(item._id) === String(button.dataset.edit || button.dataset.delete));
  if (!product) return;
  if (button.dataset.edit) {
    Object.entries(product).forEach(([key, value]) => { if (key !== 'image' && productForm.elements[key]) productForm.elements[key].value = value; });
    document.querySelector('#product-submit-label').textContent = 'حفظ التعديل';
    document.querySelector('#cancel-edit').style.display = 'inline-flex';
    productForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } else if (confirm(`هل تريد حذف «${product.name}»؟`)) {
    const response = await fetch(`${API_BASE}/api/admin/products/${product._id}`, { method: 'DELETE' });
    if (response.ok) { statusMessage.textContent = 'تم حذف المنتج.'; await loadProducts(); }
  }
});

document.querySelector('#orders-list').addEventListener('change', async event => {
  const select = event.target.closest('.order-status-select');
  if (!select) return;
  const orderId = select.dataset.orderStatus;
  const status = select.value;
  const response = await fetch(`${API_BASE}/api/admin/orders/${orderId}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  if (response.ok) {
    const updated = orders.find(o => String(o._id) === String(orderId));
    if (updated) updated.status = status;
    renderOrders();
  }
});

document.querySelector('#orders-list').addEventListener('click', async event => {
  const btn = event.target.closest('[data-delete-order]');
  if (!btn) return;
  const orderId = btn.dataset.deleteOrder;
  if (confirm('هل أنت تأكد من حذف هذا الطلب؟')) {
    const response = await fetch(`${API_BASE}/api/admin/orders/${orderId}`, { method: 'DELETE' });
    if (response.ok) {
      orders = orders.filter(o => String(o._id) !== String(orderId));
      renderOrders();
    }
  }
});

document.querySelector('#cancel-edit').addEventListener('click', () => { productForm.reset(); productForm.elements.id.value = ''; document.querySelector('#product-submit-label').textContent = 'إضافة المنتج'; document.querySelector('#cancel-edit').style.display = 'none'; });
document.querySelector('#logout-button').addEventListener('click', async () => { await fetch(`${API_BASE}/api/auth/logout`, { method: 'POST' }); window.location.href = '/admin-login.html'; });
