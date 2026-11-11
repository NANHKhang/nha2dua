import { useState, useEffect } from 'react';
import API from './api/axios';
import './App.css';

function App() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 1. READ: Lấy danh sách danh mục từ Backend
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await API.get('/api/categories');
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (err) {
      setError('Không thể tải danh sách danh mục: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Tự động tạo slug khi gõ name (nếu chưa vào chế độ sửa)
  const handleNameChange = (e) => {
    const value = e.target.value;
    setName(value);
    if (!editingId) {
      const generatedSlug = value
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

  // 2. CREATE / UPDATE: Thêm mới hoặc Cập nhật
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !slug) return alert('Vui lòng nhập đầy đủ Name và Slug!');

    try {
      if (editingId) {
        // Cập nhật (PUT)
        await API.put(`/api/categories/${editingId}`, { name, slug });
        alert('Cập nhật thành công!');
      } else {
        // Thêm mới (POST)
        await API.post('/api/categories', { name, slug });
        alert('Thêm danh mục mới thành công!');
      }
      // Reset form & tải lại danh sách
      setName('');
      setSlug('');
      setEditingId(null);
      fetchCategories();
    } catch (err) {
      alert('Lỗi: ' + (err.response?.data?.message || err.message));
    }
  };

  // Chọn dòng để sửa
  const handleEdit = (category) => {
    setEditingId(category.id);
    setName(category.name);
    setSlug(category.slug);
  };

  // Hủy sửa
  const handleCancelEdit = () => {
    setEditingId(null);
    setName('');
    setSlug('');
  };

  // 3. DELETE: Xóa danh mục
  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa danh mục này?')) return;
    try {
      await API.delete(`/api/categories/${id}`);
      alert('Xóa danh mục thành công!');
      fetchCategories();
    } catch (err) {
      alert('Không thể xóa: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h2> Quản Lý Danh Mục Sản Phẩm</h2>

      {/* FORM THÊM / SỬA */}
      <form onSubmit={handleSubmit} style={{ background: '#f4f4f4', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem' }}>
        <h3>{editingId ? 'Cập Nhật Danh Mục' : 'Thêm Danh Mục Mới'}</h3>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Tên danh mục:</label>
          <input
            type="text"
            value={name}
            onChange={handleNameChange}
            placeholder="Ví dụ: Bàn ăn gỗ"
            style={{ width: '100%', padding: '0.5rem', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Slug (Đường dẫn tĩnh):</label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="ban-an-go"
            style={{ width: '100%', padding: '0.5rem', boxSizing: 'border-box' }}
          />
        </div>
        <div>
          <button type="submit" style={{ padding: '0.5rem 1.5rem', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '0.5rem' }}>
            {editingId ? 'Lưu Thay Đổi' : 'Thêm Mới'}
          </button>
          {editingId && (
            <button type="button" onClick={handleCancelEdit} style={{ padding: '0.5rem 1.5rem', backgroundColor: '#6c757d', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              Hủy
            </button>
          )}
        </div>
      </form>

      {/* DANH SÁCH BẢNG CATEGORIES */}
      <h3>Danh Sách Hiện Có</h3>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {loading ? (
        <p>Đang tải dữ liệu...</p>
      ) : (
        <table border="1" cellPadding="10" cellSpacing="0" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#eee' }}>
              <th>ID</th>
              <th>Tên Danh Mục</th>
              <th>Slug</th>
              <th>Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center' }}>Chưa có dữ liệu nào.</td>
              </tr>
            ) : (
              categories.map((cat) => (
                <tr key={cat.id}>
                  <td>{cat.id}</td>
                  <td><strong>{cat.name}</strong></td>
                  <td><code>{cat.slug}</code></td>
                  <td>
                    <button onClick={() => handleEdit(cat)} style={{ marginRight: '0.5rem', padding: '0.3rem 0.8rem', backgroundColor: '#ffc107', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                      Sửa
                    </button>
                    <button onClick={() => handleDelete(cat.id)} style={{ padding: '0.3rem 0.8rem', backgroundColor: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
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
  );
}

export default App;