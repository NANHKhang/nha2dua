import { useState, useEffect, useRef } from 'react';
import API from '../api/axios';

const toSlug = (str) =>
  String(str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');

export default function AdminLayout({ currentUser, onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');

  const menus = [
    { id: 'dashboard', label: 'Tổng quan' },
    { id: 'categories', label: 'Danh mục' },
    { id: 'products', label: 'Sản phẩm' },
    { id: 'orders', label: 'Đơn hàng' },
    { id: 'users', label: 'Người dùng' }
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f1f5f9' }}>
      {/* SIDEBAR */}
      <aside style={{ width: '250px', backgroundColor: '#0f172a', color: '#fff', padding: '1.5rem 1rem', flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <div style={{ padding: '0 0.75rem 1.25rem', borderBottom: '1px solid #1e293b', marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '1.2rem', fontWeight: '800' }}>Nhà 2 Đứa Dashboard</div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.3rem' }}>
              Xin chào, {currentUser?.full_name || 'Admin'}
            </div>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {menus.map((m) => (
              <button
                key={m.id}
                onClick={() => setActiveTab(m.id)}
                style={{
                  textAlign: 'left',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.92rem',
                  fontWeight: activeTab === m.id ? '600' : '400',
                  backgroundColor: activeTab === m.id ? '#1d4ed8' : 'transparent',
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
          style={{ padding: '0.7rem', backgroundColor: '#1e293b', color: '#f87171', border: '1px solid #334155', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
        >
          Đăng xuất
        </button>
      </aside>

      {/* MAIN CONTENT */}
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

/* ============================================================================
   1. TỔNG QUAN HỆ THỐNG (TRANG 1 FIGMA)
============================================================================ */
function DashboardView() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    API.get('/api/dashboard/stats').then((res) => {
      if (res.data?.success && res.data?.data) setStats(res.data.data);
    });
  }, []);

  if (!stats) return <p>Đang tải dữ liệu tổng quan...</p>;

  const statusMap = {
    pending: { text: 'Chờ xác nhận', cls: 'badge-warning' },
    confirmed: { text: 'Đã xác nhận', cls: 'badge-info' },
    shipping: { text: 'Đang giao', cls: 'badge-info' },
    completed: { text: 'Hoàn thành', cls: 'badge-success' },
    cancelled: { text: 'Đã hủy', cls: 'badge-danger' }
  };

  const cards = [
    { title: 'Doanh thu hoàn thành', value: `${Number(stats.totalRevenue || 0).toLocaleString('vi-VN')} ₫`, color: '#16a34a' },
    { title: 'Tổng đơn hàng', value: stats.totalOrders || 0, color: '#1d4ed8' },
    { title: 'Sản phẩm đang bán', value: stats.totalProducts || 0, color: '#d97706' },
    { title: 'Khách hàng', value: stats.totalUsers || 0, color: '#7c3aed' }
  ];

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '1.5rem' }}>Tổng quan hệ thống</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        {cards.map((c, i) => (
          <div key={i} className="card" style={{ marginBottom: 0, borderLeft: `4px solid ${c.color}` }}>
            <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.4rem' }}>{c.title}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '800', color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <h3 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '1rem' }}>Đơn hàng gần đây</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Mã đơn</th>
              <th>Người nhận</th>
              <th>Tổng tiền</th>
              <th>Thanh toán</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {(stats.recentOrders || []).map((o) => {
              const st = statusMap[o.status] || { text: o.status, cls: 'badge-gray' };
              return (
                <tr key={o.id}>
                  <td><strong>{o.order_code}</strong></td>
                  <td>{o.receiver_name}</td>
                  <td><strong>{Number(o.total_amount).toLocaleString('vi-VN')} ₫</strong></td>
                  <td>
                    <span className={`badge ${o.payment_status === 'paid' ? 'badge-info' : 'badge-gray'}`}>
                      {o.payment_status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                    </span>
                  </td>
                  <td><span className={`badge ${st.cls}`}>{st.text}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ============================================================================
   2. QUẢN LÝ DANH MỤC SẢN PHẨM (TRANG 2 FIGMA)
============================================================================ */
function CategoriesView() {
  const [list, setList] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [parentId, setParentId] = useState('');

  const load = () => {
    API.get('/api/categories').then((res) => {
      if (res.data?.success && Array.isArray(res.data.data)) setList(res.data.data);
    });
  };
  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setSlug('');
    setParentId('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { name, slug, parent_id: parentId ? Number(parentId) : null };
      if (editingId) await API.put(`/api/categories/${editingId}`, payload);
      else await API.post('/api/categories', payload);
      resetForm();
      load();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xác nhận xóa danh mục này?')) return;
    try {
      await API.delete(`/api/categories/${id}`);
      load();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '1.5rem' }}>Quản lý danh mục sản phẩm</h1>

      <form onSubmit={handleSubmit} className="card">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <input className="form-control" placeholder="Tên danh mục *" required value={name}
            onChange={(e) => { setName(e.target.value); if (!editingId) setSlug(toSlug(e.target.value)); }} />
          <input className="form-control" placeholder="Slug * (tự tạo từ tên)" required value={slug}
            onChange={(e) => setSlug(e.target.value)} />
          <select className="form-control" value={parentId} onChange={(e) => setParentId(e.target.value)}>
            <option value="">-- Danh mục gốc --</option>
            {list.filter((c) => c.id !== editingId).map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button type="submit" className="btn btn-primary">{editingId ? 'Lưu cập nhật' : 'Thêm danh mục'}</button>
          <button type="button" onClick={resetForm} className="btn btn-outline">Hủy</button>
        </div>
      </form>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Tên danh mục</th>
              <th>Slug</th>
              <th>Danh mục cha</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {list.map((c) => (
              <tr key={c.id}>
                <td>{c.id}</td>
                <td><strong>{c.name}</strong></td>
                <td><code>{c.slug}</code></td>
                <td>{list.find((p) => p.id === c.parent_id)?.name || '—'}</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button className="btn btn-warn" onClick={() => { setEditingId(c.id); setName(c.name); setSlug(c.slug); setParentId(c.parent_id || ''); }}>Sửa</button>
                    <button className="btn btn-danger" onClick={() => handleDelete(c.id)}>Xóa</button>
                  </div>
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
   3. QUẢN LÝ SẢN PHẨM (TRANG 3 FIGMA - IMPORT FILE ẢNH TỪ MÁY)
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
    const pList = Array.isArray(pRes.data?.data) ? pRes.data.data : [];
    const cList = Array.isArray(cRes.data?.data) ? cRes.data.data : [];
    setProducts(pList);
    setCategories(cList);
    if (cList.length > 0 && !form.category_id) {
      setForm((prev) => ({ ...prev, category_id: cList[0].id }));
    }
  };
  useEffect(() => { load(); }, []);

  const handleFileImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_W = 800;
        const scale = img.width > MAX_W ? MAX_W / img.width : 1;
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setForm((prev) => ({ ...prev, thumbnail_url: canvas.toDataURL('image/jpeg', 0.8) }));
      };
      img.src = ev.target.result;
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
      alert(res.data?.message || 'Đã xóa');
      load();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '1.5rem' }}>Quản lý sản phẩm</h1>

      <form onSubmit={handleSubmit} className="card">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <input className="form-control" placeholder="Tên sản phẩm *" required value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value, slug: editingId ? form.slug : toSlug(e.target.value) })} />
          <input className="form-control" placeholder="Slug * (tự tạo từ tên)" required value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })} />
          <select className="form-control" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input className="form-control" type="number" placeholder="Giá bán (VND) *" required value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })} />
          <input className="form-control" type="number" placeholder="Số lượng tồn kho" value={form.stock_quantity}
            onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })} />
          <select className="form-control" value={form.is_active} onChange={(e) => setForm({ ...form, is_active: Number(e.target.value) })}>
            <option value={1}>Đang bán</option>
            <option value={0}>Đã ẩn</option>
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem', marginBottom: '1rem', alignItems: 'center' }}>
          <input className="form-control" placeholder="Mô tả chi tiết..." value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileImport} style={{ display: 'none' }} />
            <button type="button" onClick={() => fileInputRef.current?.click()} className="btn btn-outline btn-sm">
              Chọn ảnh từ máy
            </button>
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Ảnh được tự nén trước khi lưu</span>
          </div>
        </div>

        {form.thumbnail_url && (
          <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <img src={form.thumbnail_url} alt="Preview" style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
            <button type="button" onClick={() => setForm({ ...form, thumbnail_url: '' })} className="btn btn-outline btn-sm">Xóa ảnh</button>
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button type="submit" className="btn btn-primary">{editingId ? 'Lưu cập nhật' : 'Thêm sản phẩm'}</button>
          <button type="button" onClick={resetForm} className="btn btn-outline">Hủy</button>
        </div>
      </form>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>STT</th>
              <th>Ảnh</th>
              <th>Tên sản phẩm</th>
              <th>Danh mục</th>
              <th>Giá bán</th>
              <th>Kho</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p, idx) => (
              <tr key={p.id}>
                <td>{idx + 1}</td>
                <td>
                  <div style={{ width: '48px', height: '48px', background: '#f1f5f9', borderRadius: '6px', overflow: 'hidden' }}>
                    {p.thumbnail_url && <img src={p.thumbnail_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                  </div>
                </td>
                <td>
                  <strong>{p.name}</strong>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{p.slug}</div>
                </td>
                <td>{p.category_name}</td>
                <td><strong>{Number(p.price).toLocaleString('vi-VN')} ₫</strong></td>
                <td>{p.stock_quantity}</td>
                <td>
                  <span className={`badge ${p.is_active ? 'badge-success' : 'badge-danger'}`}>
                    {p.is_active ? 'Đang bán' : 'Đã ẩn'}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button className="btn btn-warn" onClick={() => { setEditingId(p.id); setForm({ ...p, thumbnail_url: p.thumbnail_url || '', description: p.description || '' }); }}>Sửa</button>
                    <button className="btn btn-danger" onClick={() => handleDelete(p.id)}>Xóa</button>
                  </div>
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
   4. QUẢN LÝ ĐƠN HÀNG (TRANG 4 FIGMA)
============================================================================ */
function OrdersView() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);

  const load = () => {
    API.get('/api/orders').then((res) => {
      if (res.data?.success && Array.isArray(res.data.data)) setOrders(res.data.data);
    });
  };
  useEffect(() => { load(); }, []);

  const viewDetails = async (order) => {
    setSelectedOrder(order);
    const res = await API.get(`/api/orders/${order.id}/items`);
    if (res.data?.success && Array.isArray(res.data.data)) setOrderItems(res.data.data);
  };

  const updateStatus = async (order, status, payment_status) => {
    await API.put(`/api/orders/${order.id}/status`, { status, payment_status });
    load();
  };

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '1.5rem' }}>Quản lý đơn hàng</h1>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Mã đơn</th>
              <th>Khách nhận</th>
              <th>Địa chỉ</th>
              <th>Tổng tiền</th>
              <th>Thanh toán</th>
              <th>Trạng thái đơn</th>
              <th>Chi tiết</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td><strong>{o.order_code}</strong></td>
                <td>
                  <strong>{o.receiver_name}</strong>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{o.receiver_phone}</div>
                </td>
                <td style={{ maxWidth: '220px' }}>{o.shipping_address}</td>
                <td><strong>{Number(o.total_amount).toLocaleString('vi-VN')} ₫</strong></td>
                <td>
                  <select className="form-control" style={{ padding: '0.35rem 0.5rem', fontSize: '0.85rem' }}
                    value={o.payment_status} onChange={(e) => updateStatus(o, o.status, e.target.value)}>
                    <option value="unpaid">Chưa thanh toán</option>
                    <option value="paid">Đã thanh toán</option>
                  </select>
                </td>
                <td>
                  <select className="form-control" style={{ padding: '0.35rem 0.5rem', fontSize: '0.85rem' }}
                    value={o.status} onChange={(e) => updateStatus(o, e.target.value, o.payment_status)}>
                    <option value="pending">Chờ xác nhận</option>
                    <option value="confirmed">Đã xác nhận</option>
                    <option value="shipping">Đang giao</option>
                    <option value="completed">Hoàn thành</option>
                    <option value="cancelled">Đã hủy</option>
                  </select>
                </td>
                <td>
                  <button onClick={() => viewDetails(o)} className="btn btn-primary btn-sm">Xem</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedOrder && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Chi tiết đơn hàng #{selectedOrder.order_code}</h3>
              <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: '0.25rem' }}>
                <span className="badge badge-info" style={{ marginRight: '0.5rem' }}>
                  {selectedOrder.payment_method === 'bank_transfer' ? 'Chuyển khoản' : 'COD'}
                </span>
                {selectedOrder.note && <span>Ghi chú: {selectedOrder.note}</span>}
              </div>
            </div>
            <button onClick={() => setSelectedOrder(null)} className="btn btn-outline btn-sm">Đóng</button>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Tên sản phẩm lúc mua</th>
                <th>Đơn giá</th>
                <th>Số lượng</th>
                <th>Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {orderItems.map((it) => (
                <tr key={it.id}>
                  <td>{it.product_name}</td>
                  <td>{Number(it.unit_price).toLocaleString('vi-VN')} ₫</td>
                  <td>{it.quantity}</td>
                  <td><strong>{(Number(it.unit_price) * it.quantity).toLocaleString('vi-VN')} ₫</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ============================================================================
   5. QUẢN LÝ TÀI KHOẢN NGƯỜI DÙNG (TRANG 5 FIGMA)
============================================================================ */
function UsersView() {
  const [users, setUsers] = useState([]);

  const load = () => {
    API.get('/api/users').then((res) => {
      if (res.data?.success && Array.isArray(res.data.data)) setUsers(res.data.data);
    });
  };
  useEffect(() => { load(); }, []);

  const updateUser = async (u, nextActive, nextRoleId) => {
    await API.put(`/api/users/${u.id}`, { is_active: nextActive, role_id: nextRoleId });
    load();
  };

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '1.5rem' }}>Quản lý tài khoản người dùng</h1>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>STT</th>
              <th>Họ tên</th>
              <th>Email</th>
              <th>SĐT</th>
              <th>Vai trò</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, idx) => (
              <tr key={u.id}>
                <td>{idx + 1}</td>
                <td><strong>{u.full_name}</strong></td>
                <td>{u.email}</td>
                <td>{u.phone || '—'}</td>
                <td>
                  <select
                    className="form-control"
                    style={{ width: 'auto', padding: '0.3rem 0.5rem', fontSize: '0.85rem' }}
                    value={u.role_id}
                    onChange={(e) => updateUser(u, u.is_active, Number(e.target.value))}
                  >
                    <option value={1}>customer</option>
                    <option value={2}>admin</option>
                  </select>
                </td>
                <td>
                  <span className={`badge ${u.is_active ? 'badge-success' : 'badge-danger'}`}>
                    {u.is_active ? 'Hoạt động' : 'Bị khóa'}
                  </span>
                </td>
                <td>
                  <button
                    onClick={() => updateUser(u, u.is_active ? 0 : 1, u.role_id)}
                    className={`btn btn-sm ${u.is_active ? 'btn-danger' : 'btn-primary'}`}
                  >
                    {u.is_active ? 'Khóa' : 'Mở khóa'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}