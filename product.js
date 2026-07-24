const money = n => `${Number(n).toLocaleString('ar-DZ')} د.ج`;
const API_BASE = 'https://ecommerce-backend-1-kf21.onrender.com';
const $ = selector => document.querySelector(selector);
let currentProduct = null;

function showToast(message) {
  $('#toast').textContent = message;
  $('#toast').classList.add('show');
  setTimeout(() => $('#toast').classList.remove('show'), 2800);
}

async function loadSingleProduct() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  if (!id) {
    $('#loading-state').style.display = 'none';
    $('#error-state').style.display = 'block';
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/api/products/${id}`);
    if (!response.ok) throw new Error('Not found');
    currentProduct = await response.json();

    document.title = `${currentProduct.name} | تسوق`;
    $('#product-category').textContent = currentProduct.category;
    $('#product-title').textContent = currentProduct.name;
    $('#product-price').textContent = money(currentProduct.price);
    $('#product-desc').textContent = currentProduct.description || 'لا يوجد وصف خاص لهذا المنتج.';
    $('#product-img').src = currentProduct.image;
    $('#product-img').alt = currentProduct.name;

    $('#loading-state').style.display = 'none';
    $('#product-content').style.display = 'grid';
  } catch (error) {
    $('#loading-state').style.display = 'none';
    $('#error-state').style.display = 'block';
  }
}

$('#direct-order-form').onsubmit = async event => {
  event.preventDefault();
  if (!currentProduct) return;

  const form = new FormData(event.target);
  const item = {
    id: currentProduct._id,
    name: currentProduct.name,
    price: currentProduct.price,
    image: currentProduct.image,
    quantity: 1
  };

  try {
    const response = await fetch(`${API_BASE}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer: Object.fromEntries(form),
        items: [item],
        total: currentProduct.price
      })
    });

    const result = await response.json();
    if (!response.ok) return showToast(result.message || 'تعذر إرسال الطلب.');

    event.target.reset();
    showToast('تم تأكيد طلبك بنجاح! سنتواصل معك قريبًا لتأكيد التوصيل.');
  } catch (error) {
    showToast('حدث خطأ أثناء إرسال الطلب، يرجى المحاولة مرة أخرى.');
  }
};

loadSingleProduct();
