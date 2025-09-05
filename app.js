// Barber queue app - localStorage backed, simple admin
const STORE_KEY = 'barber_orders_v2';
let ADMIN_PASS = 'admin123'; // Default - غيّرها في الكود إذا أردت
let isAdmin = false;

const orderForm = document.getElementById('orderForm');
const firstname = document.getElementById('firstname');
const lastname = document.getElementById('lastname');
const phone = document.getElementById('phone');
const service = document.getElementById('service');
const notes = document.getElementById('notes');
const feedback = document.getElementById('feedback');
const queueList = document.getElementById('queueList');
const totalEl = document.getElementById('total');
const todayCountEl = document.getElementById('todayCount');
const exportJsonBtn = document.getElementById('exportJson');
const exportCsvBtn = document.getElementById('exportCsv');
const clearAllBtn = document.getElementById('clearAll');
const clearFormBtn = document.getElementById('clearFormBtn');
const adminLoginBtn = document.getElementById('adminLogin');
const adminLogoutBtn = document.getElementById('adminLogout');
const adminPassInput = document.getElementById('adminPass');

function loadOrders(){ const raw = localStorage.getItem(STORE_KEY); return raw ? JSON.parse(raw) : []; }
function saveOrders(arr){ localStorage.setItem(STORE_KEY, JSON.stringify(arr)); }
function nowISO(){ return new Date().toISOString(); }
function formatTime(iso){ const d = new Date(iso); return d.toLocaleString('ar-DZ', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }); }

function render(){
  const arr = loadOrders().sort((a,b)=> new Date(a.created) - new Date(b.created));
  queueList.innerHTML = '';
  arr.forEach((item, idx) => {
    const li = document.createElement('li');
    const info = document.createElement('div');
    info.className = 'queue-info';
    info.innerHTML = `<strong>${item.firstname} ${item.lastname}</strong>
                      <div class="meta">${item.service} — ${item.phone || 'هاتف غير مسجل'} — ${formatTime(item.created)}</div>`;
    const right = document.createElement('div');
    right.className = 'controls-right';
    right.innerHTML = `<span class="tag">#${idx+1}</span>`;
    if(isAdmin){
      const btnDone = document.createElement('button');
      btnDone.textContent = 'تم';
      btnDone.style.marginRight = '8px';
      btnDone.onclick = ()=>{ markDone(item.id) };
      const btnDel = document.createElement('button');
      btnDel.textContent = 'حذف';
      btnDel.className = 'danger';
      btnDel.onclick = ()=>{ deleteOrder(item.id) };
      right.appendChild(btnDone);
      right.appendChild(btnDel);
    }
    li.appendChild(info);
    li.appendChild(right);
    queueList.appendChild(li);
  });

  totalEl.textContent = arr.length;
  const today = arr.filter(i => new Date(i.created).toDateString() === new Date().toDateString()).length;
  todayCountEl.textContent = today;
}

function addOrder(o){
  const arr = loadOrders();
  arr.push(o);
  saveOrders(arr);
  render();
}

function markDone(id){
  let arr = loadOrders();
  arr = arr.filter(i => i.id !== id);
  saveOrders(arr);
  render();
}

function deleteOrder(id){
  if(!confirm('تأكيد الحذف؟')) return;
  markDone(id);
}

orderForm.addEventListener('submit', (e)=>{
  e.preventDefault();
  const now = new Date();
  const businessStart = new Date(now);
  businessStart.setHours(8,0,0,0);
  const businessEnd = new Date(now);
  businessEnd.setHours(24,0,0,0);

  if(now < businessStart || now > businessEnd){
    feedback.textContent = 'خارج ساعات العمل (08:00 - 00:00). سيتم قبول الطلب لكن انتبه لمواعيد المحل.';
  } else {
    feedback.textContent = 'تم استلام الطلب بنجاح!';
  }

  const order = {
    id: 'o_' + Math.random().toString(36).slice(2,9),
    firstname: firstname.value.trim(),
    lastname: lastname.value.trim(),
    phone: phone.value.trim(),
    service: service.value,
    notes: notes.value.trim(),
    created: nowISO()
  };

  addOrder(order);
  orderForm.reset();
  setTimeout(()=> feedback.textContent = '', 3500);
});

clearFormBtn.addEventListener('click', ()=> orderForm.reset());

exportJsonBtn.addEventListener('click', ()=>{
  const arr = loadOrders();
  const blob = new Blob([JSON.stringify(arr, null, 2)], {type:'application/json;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'orders.json'; a.click();
  URL.revokeObjectURL(url);
});

exportCsvBtn.addEventListener('click', ()=>{
  const arr = loadOrders();
  if(arr.length===0){ alert('لا توجد بيانات للتصدير'); return; }
  const keys = ['id','firstname','lastname','phone','service','notes','created'];
  const lines = [keys.join(',')];
  arr.forEach(r=>{
    const row = keys.map(k=> `"${String(r[k]||'').replace(/"/g,'""')}"`).join(',');
    lines.push(row);
  });
  const blob = new Blob([lines.join('\n')], {type:'text/csv;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'orders.csv'; a.click();
  URL.revokeObjectURL(url);
});

clearAllBtn.addEventListener('click', ()=>{
  if(!confirm('هل تريد مسح كل الطلبات؟')) return;
  localStorage.removeItem(STORE_KEY);
  render();
});

adminLoginBtn.addEventListener('click', ()=>{
  const val = adminPassInput.value;
  if(val === ADMIN_PASS){
    isAdmin = true;
    adminLoginBtn.style.display = 'none';
    adminLogoutBtn.style.display = 'inline-block';
    alert('تم تفعيل وضع الإدارة');
    render();
  } else {
    alert('كلمة المرور خاطئة');
  }
});

adminLogoutBtn.addEventListener('click', ()=>{
  isAdmin = false;
  adminLoginBtn.style.display = 'inline-block';
  adminLogoutBtn.style.display = 'none';
  render();
});

// initial render
render();
