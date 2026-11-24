import { useState, useEffect, useRef } from 'react';
import API from '../api/axios';

const toSlug = (str) =>
  str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');

export default function AdminLayout({ currentUser, onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');

  const menus = [
    { id: 'dashboard', label: '1. Tổng quan (Dashboard)' },
    { id: 'categories', label: '2. Quản lý danh mục' },
    { id: 'products', label: '3. Quản lý sản phẩm' },
    { id: 'orders', label: '4. Quản lý đơn hàng' },
    { id: 'users', label: '5. Quản lý người dùng' }
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f1f5f9', color: '#1e293b' }}>
      <aside style={{ width: '260px', backgroundColor: '#0f172a', color: '#fff', padding: '1.5rem 1rem', flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '1.3rem', fontWeight: 'bold', padding: '0 0.75rem 1rem', borderBottom: '1px solid #334155', marginBottom: '1rem' }}>
            Furniture Admin
            <div style={{ fontSize: '0.8rem', fontWeight: 'normal', color: '#94a3b8', marginTop: '0.35rem' }}>
              Xin chào, {currentUser?.full_name || 'Admin'}
            </div>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {menus.map((m) => (
              <button
                key={m.id}
                onClick={() => setActiveTab(m.id)}
                style={{
                  textAlign: 'left',
                  padding: '0.75rem 1rem',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: activeTab === m.id ? '600' : '400',
                  backgroundColor: activeTab === m.id ? '#2563eb' : 'transparent',
                  color: activeTab === m.id ? '#fff' : '#cbd5e1'
                }}
              >
                {m.label}
              </button>
            ))}
          </nav>
        </div>

        <button
          onClick={onLogout}
          style={{ marginTop: '2rem', padding: '0.7rem', backgroundColor: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
        >
          Đăng xuất
        </button>
      </aside>

      <main style={{ flex: 1, padding: '2rem', overflowX: 'auto' }}>
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'categories' && <CategoriesView />}
        {activeTab === 'products' && <ProductsView />}
        {activeTab === 'orders' && <OrdersView />}
        {activeTab === 'users' && <UsersView />}
      </main>
    </div>
  );
}

function DashboardView() {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    API.get('/api/dashboard/stats').then((res) => res.data.success && setStats(res.data.data));
  }, []);
  if (!stats) return <p>Đang tải số liệu tổng quan...</p>;

  const cards = [
    { title: 'Doanh thu hoàn thành', value: `${Number(stats.totalRevenue).toLocaleString('vi-VN')} đ`, color: '#16a34a' },
    { title: 'Tổng đơn hàng', value: stats.totalOrders, color: '#2563eb' },
    { title: 'Sản phẩm đang bán', value: stats.totalProducts, color: '#d97706' },
    { title: 'Khách hàng', value: stats.totalUsers, color: '#7c3aed' }
  ];

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem' }}>Tổng quan hệ thống</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {cards.map((c, i) => (
          <div key={i} style={{ background: '#fff', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', borderLeft: `4px solid ${c.color}` }}>
            <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.5rem' }}>{c.title}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>
      <div style={cardStyle}>
        <h3 style={{ marginBottom: '1rem' }}>Đơn hàng gần đây</h3>
        <table style={tableStyle}>
          <thead>
            <tr style={theadStyle}>
              <th style={thStyle}>Mã đơn</th><th style={thStyle}>Người nhận</th><th style={thStyle}>Tổng tiền</th><th style={thStyle}>Thanh toán</th><th style={thStyle}>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {stats.recentOrders.map((o) => (
              <tr key={o.id} style={trStyle}>
                <td style={tdStyle}><strong>{o.order_code}</strong></td>
                <td style={tdStyle}>{o.receiver_name}</td>
                <td style={tdStyle}>{Number(o.total_amount).toLocaleString('vi-VN')} đ</td>
                <td style={tdStyle}>{o.payment_status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}</td>
                <td style={tdStyle}><code>{o.status}</code></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CategoriesView() {
  const [list, setList] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [parentId, setParentId] = useState('');

  const load = () => API.get('/api/categories').then((res) => res.data.success && setList(res.data.data));
  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { name, slug, parent_id: parentId ? Number(parentId) : null };
      if (editingId) await API.put(`/api/categories/${editingId}`, payload);
      else await API.post('/api/categories', payload);
      setEditingId(null); setName(''); setSlug(''); setParentId('');
      load();
    } catch (err) { alert(err.response?.data?.message || err.message); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xác nhận xóa danh mục này?')) return;
    try { await API.delete(`/api/categories/${id}`); load(); }
    catch (err) { alert(err.response?.data?.message || err.message); }
  };

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem' }}>Quản lý danh mục sản phẩm</h2>
      <form onSubmit={handleSubmit} style={cardStyle}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <input style={inputStyle} placeholder="Tên danh mục *" value={name} required onChange={(e) => { setName(e.target.value); if (!editingId) setSlug(toSlug(e.target.value)); }} />
          <input style={inputStyle} placeholder="Slug *" value={slug} required onChange={(e) => setSlug(e.target.value)} />
          <select style={inputStyle} value={parentId} onChange={(e) => setParentId(e.target.value)}>
            <option value="">-- Danh mục gốc --</option>
            {list.filter((c) => c.id !== editingId).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <button type="submit" style={btnPrimary}>{editingId ? 'Lưu cập nhật' : 'Thêm danh mục'}</button>
        {editingId && <button type="button" style={btnSecondary} onClick={() => { setEditingId(null); setName(''); setSlug(''); setParentId(''); }}>Hủy</button>}
      </form>
      <div style={cardStyle}>
        <table style={tableStyle}>
          <thead>
            <tr style={theadStyle}>
              <th style={thStyle}>ID</th><th style={thStyle}>Tên danh mục</th><th style={thStyle}>Slug</th><th style={thStyle}>Danh mục cha</th><th style={thStyle}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {list.map((c) => (
              <tr key={c.id} style={trStyle}>
                <td style={tdStyle}>{c.id}</td>
                <td style={tdStyle}><strong>{c.name}</strong></td>
                <td style={tdStyle}><code>{c.slug}</code></td>
                <td style={tdStyle}>{list.find((p) => p.id === c.parent_id)?.name || '—'}</td>
                <td style={tdStyle}>
                  <button style={btnWarn} onClick={() => { setEditingId(c.id); setName(c.name); setSlug(c.slug); setParentId(c.parent_id || ''); }}>Sửa</button>
                  <button style={btnDanger} onClick={() => handleDelete(c.id)}>Xóa</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ============================================================================
   QUẢN LÝ SẢN PHẨM (IMPORT FILE ẢNH TỪ MÁY TÍNH + XEM TRƯỚC)
============================================================================ */
function ProductsView() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    category_id: '',
    name: '',
    slug: '',
    price: '',
    stock_quantity: 10,
    thumbnail_url: '',
    description: '',
    is_active: 1
  });

  const load = async () => {
    const [pRes, cRes] = await Promise.all([API.get('/api/products'), API.get('/api/categories')]);
    if (pRes.data.success) setProducts(pRes.data.data);
    if (cRes.data.success) {
      setCategories(cRes.data.data);
      if (cRes.data.data.length > 0 && !form.category_id) {
        setForm((prev) => ({ ...prev, category_id: cRes.data.data[0].id }));
      }
    }
  };
  useEffect(() => { load(); }, []);

  // Đọc file ảnh từ máy tính, tự động nén tối ưu kích thước để lưu vào MySQL
  const handleFileImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const scale = img.width > MAX_WIDTH ? MAX_WIDTH / img.width : 1;
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
        setForm((prev) => ({ ...prev, thumbnail_url: compressedBase64 }));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({
      category_id: categories[0]?.id || '',
      name: '',
      slug: '',
      price: '',
      stock_quantity: 10,
      thumbnail_url: '',
      description: '',
      is_active: 1
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        category_id: Number(form.category_id),
        price: Number(form.price),
        stock_quantity: Number(form.stock_quantity),
        is_active: Number(form.is_active)
      };
      if (editingId) await API.put(`/api/products/${editingId}`, payload);
      else await API.post('/api/products', payload);
      resetForm();
      load();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa sản phẩm này?')) return;
    try {
      const res = await API.delete(`/api/products/${id}`);
      alert(res.data.message);
      load();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem' }}>Quản lý sản phẩm</h2>
      <form onSubmit={handleSubmit} style={cardStyle}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <input style={inputStyle} placeholder="Tên sản phẩm *" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: editingId ? form.slug : toSlug(e.target.value) })} />
          <input style={inputStyle} placeholder="Slug *" required value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
          <select style={inputStyle} value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input style={inputStyle} type="number" placeholder="Giá bán (VND) *" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          <input style={inputStyle} type="number" placeholder="Số lượng tồn kho" value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })} />
          <select style={inputStyle} value={form.is_active} onChange={(e) => setForm({ ...form, is_active: Number(e.target.value) })}>
            <option value={1}>Hiển thị trên web</option>
            <option value={0}>Đang ẩn (Ngừng bán)</option>
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem', alignItems: 'center' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', color: '#475569' }}>
              Chọn file hình ảnh từ máy tính:
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileImport}
              style={{ ...inputStyle, padding: '0.35rem' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', color: '#475569' }}>
              Mô tả ngắn sản phẩm:
            </label>
            <input style={inputStyle} placeholder="Nhập mô tả chi tiết..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
        </div>

        {form.thumbnail_url && (
          <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <img src={form.thumbnail_url} alt="Preview" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
            <button
              type="button"
              onClick={() => { setForm((prev) => ({ ...prev, thumbnail_url: '' })); if (fileInputRef.current) fileInputRef.current.value = ''; }}
              style={{ padding: '0.3rem 0.65rem', backgroundColor: '#e2e8f0', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              Xóa ảnh này
            </button>
          </div>
        )}

        <button type="submit" style={btnPrimary}>{editingId ? 'Lưu sản phẩm' : 'Thêm sản phẩm'}</button>
        {editingId && <button type="button" style={btnSecondary} onClick={resetForm}>Hủy</button>}
      </form>

      <div style={cardStyle}>
        <table style={tableStyle}>
          <thead>
            <tr style={theadStyle}>
              <th style={thStyle}>Ảnh</th><th style={thStyle}>Tên sản phẩm</th><th style={thStyle}>Danh mục</th><th style={thStyle}>Giá bán</th><th style={thStyle}>Kho</th><th style={thStyle}>Trạng thái</th><th style={thStyle}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} style={trStyle}>
                <td style={tdStyle}>{p.thumbnail_url ? <img src={p.thumbnail_url} alt="" style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '4px' }} /> : '—'}</td>
                <td style={tdStyle}><strong>{p.name}</strong><div style={{ fontSize: '0.8rem', color: '#64748b' }}>{p.slug}</div></td>
                <td style={tdStyle}>{p.category_name}</td>
                <td style={tdStyle}>{Number(p.price).toLocaleString('vi-VN')} đ</td>
                <td style={tdStyle}>{p.stock_quantity}</td>
                <td style={tdStyle}>{p.is_active ? <span style={{ color: '#16a34a', fontWeight: '600' }}>Đang bán</span> : <span style={{ color: '#dc2626' }}>Đã ẩn</span>}</td>
                <td style={tdStyle}>
                  <button style={btnWarn} onClick={() => { setEditingId(p.id); setForm({ ...p, thumbnail_url: p.thumbnail_url || '', description: p.description || '' }); }}>Sửa</button>
                  <button style={btnDanger} onClick={() => handleDelete(p.id)}>Xóa</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OrdersView() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);

  const load = () => API.get('/api/orders').then((res) => res.data.success && setOrders(res.data.data));
  useEffect(() => { load(); }, []);

  const viewDetails = async (order) => {
    setSelectedOrder(order);
    const res = await API.get(`/api/orders/${order.id}/items`);
    if (res.data.success) setOrderItems(res.data.data);
  };

  const updateStatus = async (order, newStatus, newPayStatus) => {
    await API.put(`/api/orders/${order.id}/status`, { status: newStatus, payment_status: newPayStatus });
    load();
  };

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem' }}>Quản lý đơn hàng</h2>
      <div style={cardStyle}>
        <table style={tableStyle}>
          <thead>
            <tr style={theadStyle}>
              <th style={thStyle}>Mã đơn</th><th style={thStyle}>Khách nhận</th><th style={thStyle}>Địa chỉ</th><th style={thStyle}>Tổng tiền</th><th style={thStyle}>Thanh toán</th><th style={thStyle}>Trạng thái đơn</th><th style={thStyle}>Chi tiết</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} style={trStyle}>
                <td style={tdStyle}><strong>{o.order_code}</strong></td>
                <td style={tdStyle}>{o.receiver_name}<div style={{ fontSize: '0.8rem', color: '#64748b' }}>{o.receiver_phone}</div></td>
                <td style={tdStyle}>{o.shipping_address}</td>
                <td style={tdStyle}><strong>{Number(o.total_amount).toLocaleString('vi-VN')} đ</strong></td>
                <td style={tdStyle}>
                  <select style={inputStyle} value={o.payment_status} onChange={(e) => updateStatus(o, o.status, e.target.value)}>
                    <option value="unpaid">Chưa thanh toán</option><option value="paid">Đã thanh toán</option>
                  </select>
                </td>
                <td style={tdStyle}>
                  <select style={inputStyle} value={o.status} onChange={(e) => updateStatus(o, e.target.value, o.payment_status)}>
                    <option value="pending">Chờ xác nhận</option><option value="confirmed">Đã xác nhận</option><option value="shipping">Đang giao hàng</option><option value="completed">Hoàn thành</option><option value="cancelled">Đã hủy</option>
                  </select>
                </td>
                <td style={tdStyle}><button style={btnPrimary} onClick={() => viewDetails(o)}>Xem món</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selectedOrder && (
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3>Chi tiết đơn hàng #{selectedOrder.order_code}</h3>
            <button style={btnSecondary} onClick={() => setSelectedOrder(null)}>Đóng</button>
          </div>
          <table style={tableStyle}>
            <thead>
              <tr style={theadStyle}><th style={thStyle}>Tên sản phẩm lúc mua</th><th style={thStyle}>Đơn giá</th><th style={thStyle}>Số lượng</th><th style={thStyle}>Thành tiền</th></tr>
            </thead>
            <tbody>
              {orderItems.map((it) => (
                <tr key={it.id} style={trStyle}>
                  <td style={tdStyle}>{it.product_name}</td><td style={tdStyle}>{Number(it.unit_price).toLocaleString('vi-VN')} đ</td><td style={tdStyle}>{it.quantity}</td><td style={tdStyle}><strong>{Number(it.unit_price * it.quantity).toLocaleString('vi-VN')} đ</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function UsersView() {
  const [users, setUsers] = useState([]);
  const load = () => API.get('/api/users').then((res) => res.data.success && setUsers(res.data.data));
  useEffect(() => { load(); }, []);

  const toggleActive = async (u) => {
    await API.put(`/api/users/${u.id}`, { is_active: u.is_active ? 0 : 1, role_id: u.role_id });
    load();
  };

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem' }}>Quản lý tài khoản người dùng</h2>
      <div style={cardStyle}>
        <table style={tableStyle}>
          <thead>
            <tr style={theadStyle}><th style={thStyle}>ID</th><th style={thStyle}>Họ tên</th><th style={thStyle}>Email</th><th style={thStyle}>SĐT</th><th style={thStyle}>Vai trò</th><th style={thStyle}>Trạng thái</th><th style={thStyle}>Hành động</th></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} style={trStyle}>
                <td style={tdStyle}>{u.id}</td><td style={tdStyle}><strong>{u.full_name}</strong></td><td style={tdStyle}>{u.email}</td><td style={tdStyle}>{u.phone || '—'}</td><td style={tdStyle}><code>{u.role_name}</code></td>
                <td style={tdStyle}>{u.is_active ? <span style={{ color: '#16a34a', fontWeight: '600' }}>Hoạt động</span> : <span style={{ color: '#dc2626', fontWeight: '600' }}>Bị khóa</span>}</td>
                <td style={tdStyle}><button style={u.is_active ? btnDanger : btnPrimary} onClick={() => toggleActive(u)}>{u.is_active ? 'Khóa' : 'Mở khóa'}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const cardStyle = { background: '#fff', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: '1.5rem' };
const inputStyle = { width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' };
const tableStyle = { width: '100%', borderCollapse: 'collapse', textAlign: 'left' };
const theadStyle = { background: '#f8fafc', borderBottom: '2px solid #e2e8f0' };
const thStyle = { padding: '0.75rem', fontSize: '0.9rem' };
const trStyle = { borderBottom: '1px solid #e2e8f0' };
const tdStyle = { padding: '0.75rem', fontSize: '0.9rem' };
const btnPrimary = { padding: '0.45rem 0.9rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '0.4rem' };
const btnSecondary = { padding: '0.45rem 0.9rem', background: '#64748b', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' };
const btnWarn = { padding: '0.35rem 0.75rem', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '0.4rem' };
// const btnDanger = { padding: '0.35rem 0.75rem', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' };