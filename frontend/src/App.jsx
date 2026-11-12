import { useState, useEffect } from 'react';
import API from './api/axios';

function App() {
  // 'dashboard' = màn hình tổng quan ban đầu, 'categories' = mở bảng CRUD danh mục
  const [activeMenu, setActiveMenu] = useState('dashboard');

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  // State cho Form Thêm / Sửa
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [parentId, setParentId] = useState('');

  // Tải danh sách danh mục từ API
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await API.get('/api/categories');
      if (res.data.success) {
        setCategories(res.data.data);
      }
    } catch (err) {
      alert('Lỗi tải danh sách danh mục: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Chỉ tải dữ liệu bảng khi bấm vào mục "Quản lý danh mục sản phẩm"
  useEffect(() => {
    if (activeMenu === 'categories') {
      fetchCategories();
    }
  }, [activeMenu]);

  // Tự động tạo slug theo tên danh mục khi thêm mới
  const handleNameChange = (e) => {
    const val = e.target.value;
    setName(val);
    if (!editingId) {
      const generatedSlug = val
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[đĐ]/g, 'd')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
      setSlug(generatedSlug);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setSlug('');
    setParentId('');
  };

  // Thêm mới hoặc Cập nhật danh mục
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) {
      return alert('Vui lòng nhập đầy đủ Tên danh mục và Slug!');
    }

    const payload = {
      name: name.trim(),
      slug: slug.trim(),
      parent_id: parentId ? Number(parentId) : null
    };

    try {
      if (editingId) {
        await API.put(`/api/categories/${editingId}`, payload);
        alert('Cập nhật danh mục thành công!');
      } else {
        await API.post('/api/categories', payload);
        alert('Thêm danh mục mới thành công!');
      }
      resetForm();
      fetchCategories();
    } catch (err) {
      alert('Lỗi: ' + (err.response?.data?.message || err.message));
    }
  };

  // Chọn dòng để sửa
  const handleEdit = (item) => {
    setEditingId(item.id);
    setName(item.name);
    setSlug(item.slug);
    setParentId(item.parent_id || '');
  };

  // Xóa danh mục
  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa danh mục này?')) return;
    try {
      await API.delete(`/api/categories/${id}`);
      alert('Đã xóa danh mục!');
      fetchCategories();
    } catch (err) {
      alert('Không thể xóa (có thể danh mục đang chứa danh mục con hoặc sản phẩm): ' + (err.response?.data?.message || err.message));
    }
  };

  // Lấy tên danh mục cha để hiển thị trên bảng
  const getParentName = (pId) => {
    if (!pId) return '—';
    const parent = categories.find((c) => c.id === pId);
    return parent ? parent.name : `#${pId}`;
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* SIDEBAR BÊN TRÁI */}
      <aside style={{ width: '260px', backgroundColor: '#1e293b', color: '#fff', padding: '1.5rem 1rem' }}>
        <div
          onClick={() => setActiveMenu('dashboard')}
          style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '2rem', padding: '0 0.75rem', cursor: 'pointer' }}
        >
          Furniture Admin
        </div>

        <nav>
          <button
            onClick={() => setActiveMenu('categories')}
            style={{
              width: '100%',
              textAlign: 'left',
              padding: '0.75rem 1rem',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.95rem',
              fontWeight: '500',
              backgroundColor: activeMenu === 'categories' ? '#2563eb' : 'transparent',
              color: '#fff'
            }}
          >
            Quản lý danh mục sản phẩm
          </button>
        </nav>
      </aside>

      {/* KHU VỰC NỘI DUNG CHÍNH */}
      <main style={{ flex: 1, padding: '2rem' }}>
        {/* HEADER */}
        <header style={{ backgroundColor: '#fff', padding: '1rem 1.5rem', borderRadius: '8px', marginBottom: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.25rem' }}>
            {activeMenu === 'dashboard' ? 'Trang chủ Dashboard' : 'Quản lý danh mục sản phẩm'}
          </h2>
          {activeMenu !== 'dashboard' && (
            <button
              onClick={() => setActiveMenu('dashboard')}
              style={{ padding: '0.4rem 0.9rem', backgroundColor: '#e2e8f0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Về Dashboard
            </button>
          )}
        </header>

        {/* MÀN HÌNH 1: DASHBOARD BAN ĐẦU */}
        {activeMenu === 'dashboard' && (
          <div style={{ backgroundColor: '#fff', padding: '2.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <h3 style={{ marginBottom: '0.75rem' }}>Xin chào Quản trị viên</h3>
            <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
              Hệ thống quản trị website bán nội thất. Bấm vào mục <strong>Quản lý danh mục sản phẩm</strong> ở menu bên trái để mở bảng thao tác dữ liệu.
            </p>
            <button
              onClick={() => setActiveMenu('categories')}
              style={{ padding: '0.65rem 1.25rem', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}
            >
              Mở Quản lý danh mục sản phẩm
            </button>
          </div>
        )}

        {/* MÀN HÌNH 2: BẢNG CRUD DANH MỤC SẢN PHẨM */}
        {activeMenu === 'categories' && (
          <div>
            {/* FORM THÊM / SỬA */}
            <form onSubmit={handleSubmit} style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <h3 style={{ marginBottom: '1rem', fontSize: '1.05rem' }}>
                {editingId ? `Cập nhật danh mục #${editingId}` : 'Thêm danh mục mới'}
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.9rem' }}>Tên danh mục *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={handleNameChange}
                    placeholder="Ví dụ: Bàn ăn gỗ"
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.9rem' }}>Slug *</label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="ban-an-go"
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.9rem' }}>Danh mục cha (tùy chọn)</label>
                  <select
                    value={parentId}
                    onChange={(e) => setParentId(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                  >
                    <option value="">-- Không có (Danh mục gốc) --</option>
                    {categories
                      .filter((cat) => cat.id !== editingId)
                      .map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <button type="submit" style={{ padding: '0.5rem 1.25rem', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '0.5rem' }}>
                  {editingId ? 'Lưu cập nhật' : 'Thêm danh mục'}
                </button>
                {editingId && (
                  <button type="button" onClick={resetForm} style={{ padding: '0.5rem 1.25rem', backgroundColor: '#64748b', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    Hủy
                  </button>
                )}
              </div>
            </form>

            {/* BẢNG DANH SÁCH DANH MỤC */}
            <div style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <h3 style={{ marginBottom: '1rem', fontSize: '1.05rem' }}>Danh sách danh mục sản phẩm</h3>

              {loading ? (
                <p>Đang tải dữ liệu...</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                      <th style={{ padding: '0.75rem' }}>ID</th>
                      <th style={{ padding: '0.75rem' }}>Tên danh mục</th>
                      <th style={{ padding: '0.75rem' }}>Slug</th>
                      <th style={{ padding: '0.75rem' }}>Danh mục cha</th>
                      <th style={{ padding: '0.75rem' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ padding: '1rem', textAlign: 'center', color: '#64748b' }}>
                          Chưa có danh mục nào.
                        </td>
                      </tr>
                    ) : (
                      categories.map((item) => (
                        <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '0.75rem' }}>{item.id}</td>
                          <td style={{ padding: '0.75rem' }}><strong>{item.name}</strong></td>
                          <td style={{ padding: '0.75rem' }}><code>{item.slug}</code></td>
                          <td style={{ padding: '0.75rem' }}>{getParentName(item.parent_id)}</td>
                          <td style={{ padding: '0.75rem' }}>
                            <button
                              onClick={() => handleEdit(item)}
                              style={{ marginRight: '0.5rem', padding: '0.35rem 0.75rem', backgroundColor: '#f59e0b', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                            >
                              Sửa
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              style={{ padding: '0.35rem 0.75rem', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                            >
                              Xóa
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;