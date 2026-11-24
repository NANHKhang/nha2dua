import { useState, useEffect } from 'react';
import API from '../api/axios';

export default function UserLayout({ currentUser, onLoginSuccess, onLogout }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [orderForm, setOrderForm] = useState({
    receiver_name: currentUser?.full_name || '',
    receiver_phone: currentUser?.phone || '',
    shipping_address: '',
    payment_method: 'cod',
    note: ''
  });

  const [isRegister, setIsRegister] = useState(false);
  const [authForm, setAuthForm] = useState({ email: '', password: '', full_name: '', phone: '' });

  useEffect(() => {
    Promise.all([API.get('/api/products'), API.get('/api/categories')]).then(([pRes, cRes]) => {
      if (pRes.data.success) {
        setProducts(pRes.data.data.filter((p) => p.is_active === 1));
      }
      if (cRes.data.success) setCategories(cRes.data.data);
    });
  }, []);

  useEffect(() => {
    if (currentUser) {
      setOrderForm((prev) => ({
        ...prev,
        receiver_name: currentUser.full_name || prev.receiver_name,
        receiver_phone: currentUser.phone || prev.receiver_phone
      }));
    }
  }, [currentUser]);

  const filteredProducts = products.filter((p) => {
    const matchCat = selectedCategory === 'all' || Number(p.category_id) === Number(selectedCategory);
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSearch;
  });

  const addToCart = (product) => {
    if (product.stock_quantity <= 0) return alert('Sản phẩm tạm hết hàng!');
    setCart((prev) => {
      const exist = prev.find((item) => item.id === product.id);
      if (exist) {
        return prev.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateCartQty = (id, delta) => {
    setCart((prev) =>
      prev
        .map((item) => (item.id === id ? { ...item, quantity: item.quantity + delta } : item))
        .filter((item) => item.quantity > 0)
    );
  };

  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalCartPrice = cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      setShowCart(false);
      setShowAuth(true);
      return alert('Vui lòng đăng nhập tài khoản khách hàng trước khi đặt hàng!');
    }
    try {
      const res = await API.post('/api/orders', {
        user_id: currentUser.id,
        ...orderForm,
        items: cart
      });
      if (res.data.success) {
        alert(`Đặt hàng thành công! Mã đơn của bạn là: ${res.data.order_code}`);
        setCart([]);
        setShowCart(false);
      }
    } catch (err) {
      alert('Lỗi đặt hàng: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      const res = await API.post(endpoint, authForm);
      if (res.data.success) {
        setShowAuth(false);
        setAuthForm({ email: '', password: '', full_name: '', phone: '' });
        onLoginSuccess(res.data.user);
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc', color: '#1e293b' }}>
      {/* HEADER USER (KHÔNG CÓ NÚT ADMIN) */}
      <header style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '1rem 2rem', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#0f172a' }}>
            Nha2Dua <span style={{ color: '#2563eb' }}>Furniture</span>
          </div>

          <input
            type="text"
            placeholder="Tìm kiếm bàn, ghế, sofa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: '0.5rem 1rem', borderRadius: '20px', border: '1px solid #cbd5e1', width: '300px' }}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={() => setShowCart(true)}
              style={{ padding: '0.5rem 1rem', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}
            >
              Giỏ hàng ({totalCartItems})
            </button>

            {currentUser ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.9rem' }}>
                <span>Xin chào, <strong>{currentUser.full_name}</strong></span>
                <button
                  onClick={onLogout}
                  style={{ padding: '0.4rem 0.75rem', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                >
                  Đăng xuất
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuth(true)}
                style={{ padding: '0.5rem 1rem', backgroundColor: '#0f172a', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}
              >
                Đăng nhập
              </button>
            )}
          </div>
        </div>
      </header>

      {/* BANNER */}
      <section style={{ backgroundColor: '#1e293b', color: '#fff', padding: '2.5rem 2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Nội Thất Hiện Đại Cho Không Gian Sống</h1>
        <p style={{ color: '#cbd5e1' }}>Thiết kế tối giản — Chất liệu gỗ tự nhiên bền bỉ — Giao hàng tận nơi</p>
      </section>

      {/* DANH SÁCH SẢN PHẨM */}
      <main style={{ maxWidth: '1200px', width: '100%', margin: '2rem auto', padding: '0 1.5rem', flex: 1 }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          <button
            onClick={() => setSelectedCategory('all')}
            style={{
              padding: '0.45rem 1rem', borderRadius: '20px', border: '1px solid #cbd5e1', cursor: 'pointer',
              backgroundColor: selectedCategory === 'all' ? '#2563eb' : '#fff',
              color: selectedCategory === 'all' ? '#fff' : '#334155'
            }}
          >
            Tất cả sản phẩm
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                padding: '0.45rem 1rem', borderRadius: '20px', border: '1px solid #cbd5e1', cursor: 'pointer',
                backgroundColor: Number(selectedCategory) === cat.id ? '#2563eb' : '#fff',
                color: Number(selectedCategory) === cat.id ? '#fff' : '#334155'
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {filteredProducts.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#64748b', padding: '3rem' }}>Không tìm thấy sản phẩm phù hợp.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.5rem' }}>
            {filteredProducts.map((p) => (
              <div key={p.id} style={{ backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column' }}>
                <img
                  src={p.thumbnail_url || 'https://placehold.co/400x260?text=No+Image'}
                  alt={p.name}
                  style={{ width: '100%', height: '200px', objectFit: 'cover', cursor: 'pointer' }}
                  onClick={() => setSelectedProduct(p)}
                />
                <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: '600' }}>{p.category_name}</span>
                    <h3 onClick={() => setSelectedProduct(p)} style={{ fontSize: '1.05rem', margin: '0.35rem 0', cursor: 'pointer' }}>
                      {p.name}
                    </h3>
                    <div style={{ fontSize: '1.15rem', fontWeight: 'bold', color: '#dc2626', marginBottom: '0.5rem' }}>
                      {Number(p.price).toLocaleString('vi-VN')} đ
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1rem' }}>
                      Còn lại: {p.stock_quantity} sản phẩm
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => addToCart(p)}
                      style={{ flex: 1, padding: '0.55rem', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}
                    >
                      + Thêm giỏ hàng
                    </button>
                    <button
                      onClick={() => setSelectedProduct(p)}
                      style={{ padding: '0.55rem 0.75rem', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer' }}
                    >
                      Chi tiết
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer style={{ backgroundColor: '#0f172a', color: '#94a3b8', textAlign: 'center', padding: '1.5rem', marginTop: '3rem' }}>
        © 2026 Nha2Dua Furniture — Đồ án Website Bán Nội Thất
      </footer>

      {/* MODAL CHI TIẾT SẢN PHẨM */}
      {selectedProduct && (
        <div style={modalOverlayStyle}>
          <div style={modalBoxStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3>{selectedProduct.name}</h3>
              <button onClick={() => setSelectedProduct(null)} style={closeBtnStyle}>X</button>
            </div>
            <img src={selectedProduct.thumbnail_url || 'https://placehold.co/600x350'} alt="" style={{ width: '100%', height: '240px', objectFit: 'cover', borderRadius: '6px', marginBottom: '1rem' }} />
            <p style={{ marginBottom: '0.5rem' }}><strong>Danh mục:</strong> {selectedProduct.category_name}</p>
            <p style={{ marginBottom: '0.5rem', color: '#dc2626', fontSize: '1.2rem', fontWeight: 'bold' }}>
              Giá bán: {Number(selectedProduct.price).toLocaleString('vi-VN')} đ
            </p>
            <p style={{ color: '#475569', marginBottom: '1.5rem' }}>{selectedProduct.description || 'Sản phẩm nội thất cao cấp thiết kế hiện đại.'}</p>
            <button
              onClick={() => { addToCart(selectedProduct); setSelectedProduct(null); }}
              style={{ width: '100%', padding: '0.7rem', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
            >
              Thêm vào giỏ hàng
            </button>
          </div>
        </div>
      )}

      {/* MODAL GIỎ HÀNG */}
      {showCart && (
        <div style={modalOverlayStyle}>
          <div style={{ ...modalBoxStyle, maxWidth: '600px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3>Giỏ hàng & Thanh toán</h3>
              <button onClick={() => setShowCart(false)} style={closeBtnStyle}>X</button>
            </div>

            {cart.length === 0 ? (
              <p style={{ padding: '1.5rem 0', textAlign: 'center', color: '#64748b' }}>Giỏ hàng của bạn đang trống.</p>
            ) : (
              <div>
                {cart.map((item) => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0', borderBottom: '1px solid #e2e8f0' }}>
                    <div>
                      <strong>{item.name}</strong>
                      <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{Number(item.price).toLocaleString('vi-VN')} đ</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button onClick={() => updateCartQty(item.id, -1)} style={{ padding: '0.2rem 0.6rem' }}>-</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateCartQty(item.id, 1)} style={{ padding: '0.2rem 0.6rem' }}>+</button>
                    </div>
                  </div>
                ))}

                <div style={{ textAlign: 'right', fontSize: '1.15rem', fontWeight: 'bold', margin: '1rem 0', color: '#dc2626' }}>
                  Tổng thanh toán: {totalCartPrice.toLocaleString('vi-VN')} đ
                </div>

                <form onSubmit={handlePlaceOrder} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                  <input required placeholder="Họ tên người nhận *" value={orderForm.receiver_name} onChange={(e) => setOrderForm({ ...orderForm, receiver_name: e.target.value })} style={modalInputStyle} />
                  <input required placeholder="Số điện thoại nhận hàng *" value={orderForm.receiver_phone} onChange={(e) => setOrderForm({ ...orderForm, receiver_phone: e.target.value })} style={modalInputStyle} />
                  <input required placeholder="Địa chỉ giao hàng chi tiết *" value={orderForm.shipping_address} onChange={(e) => setOrderForm({ ...orderForm, shipping_address: e.target.value })} style={modalInputStyle} />
                  <select value={orderForm.payment_method} onChange={(e) => setOrderForm({ ...orderForm, payment_method: e.target.value })} style={modalInputStyle}>
                    <option value="cod">Thanh toán khi nhận hàng (COD)</option>
                    <option value="bank_transfer">Chuyển khoản ngân hàng</option>
                  </select>
                  <input placeholder="Ghi chú đơn hàng (tùy chọn)" value={orderForm.note} onChange={(e) => setOrderForm({ ...orderForm, note: e.target.value })} style={modalInputStyle} />
                  <button type="submit" style={{ padding: '0.75rem', backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                    Xác nhận đặt hàng
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL ĐĂNG NHẬP / ĐĂNG KÝ */}
      {showAuth && (
        <div style={modalOverlayStyle}>
          <div style={modalBoxStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3>{isRegister ? 'Đăng ký tài khoản khách hàng' : 'Đăng nhập hệ thống'}</h3>
              <button onClick={() => setShowAuth(false)} style={closeBtnStyle}>X</button>
            </div>
            <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {isRegister && (
                <>
                  <input required placeholder="Họ và tên *" value={authForm.full_name} onChange={(e) => setAuthForm({ ...authForm, full_name: e.target.value })} style={modalInputStyle} />
                  <input placeholder="Số điện thoại" value={authForm.phone} onChange={(e) => setAuthForm({ ...authForm, phone: e.target.value })} style={modalInputStyle} />
                </>
              )}
              <input required type="email" placeholder="Email *" value={authForm.email} onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })} style={modalInputStyle} />
              <input required type="password" placeholder="Mật khẩu *" value={authForm.password} onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })} style={modalInputStyle} />
              <button type="submit" style={{ padding: '0.65rem', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>
                {isRegister ? 'Đăng ký' : 'Đăng nhập'}
              </button>
            </form>
            <div style={{ marginTop: '1rem', fontSize: '0.85rem', textAlign: 'center' }}>
              <button type="button" onClick={() => setIsRegister(!isRegister)} style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', textDecoration: 'underline' }}>
                {isRegister ? 'Đã có tài khoản? Đăng nhập ngay' : 'Chưa có tài khoản? Đăng ký mới'}
              </button>
              <div style={{ marginTop: '0.65rem', color: '#64748b', lineHeight: '1.5' }}>
                <div>Tài khoản Khách: <code>nguyenvana@gmail.com</code> / <code>123456</code></div>
                <div>Tài khoản Admin: <code>admin@furnitureshop.vn</code> / <code>123456</code></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const modalOverlayStyle = { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 50, padding: '1rem' };
const modalBoxStyle = { backgroundColor: '#fff', borderRadius: '8px', padding: '1.5rem', width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto' };
const modalInputStyle = { padding: '0.55rem', border: '1px solid #cbd5e1', borderRadius: '4px', width: '100%' };
const closeBtnStyle = { background: '#e2e8f0', border: 'none', borderRadius: '4px', padding: '0.25rem 0.6rem', cursor: 'pointer', fontWeight: 'bold' };