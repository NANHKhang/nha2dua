import { useState, useEffect } from 'react';
import API from '../api/axios';

export default function UserLayout({ currentUser, onLoginSuccess, onUpdateUser, onLogout }) {
  const [page, setPage] = useState('home');
  const [showMegaMenu, setShowMegaMenu] = useState(false);

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('price-asc');

  const [activeRootCatId, setActiveRootCatId] = useState(null);
  const [activeSubCatId, setActiveSubCatId] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [detailQty, setDetailQty] = useState(1);

  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('furniture_cart');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('furniture_cart', JSON.stringify(cart));
  }, [cart]);

  const fetchCatalog = () => {
    Promise.all([API.get('/api/products'), API.get('/api/categories')]).then(([pRes, cRes]) => {
      if (pRes.data?.success && Array.isArray(pRes.data.data)) {
        setProducts(pRes.data.data.filter((p) => p.is_active === 1));
      }
      if (cRes.data?.success && Array.isArray(cRes.data.data)) {
        setCategories(cRes.data.data);
      }
    });
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  const rootCategories = categories.filter((c) => !c.parent_id);

  const sortProducts = (list) => {
    const arr = [...list];
    if (sortBy === 'price-asc') arr.sort((a, b) => Number(a.price) - Number(b.price));
    else if (sortBy === 'price-desc') arr.sort((a, b) => Number(b.price) - Number(a.price));
    else arr.sort((a, b) => Number(b.id) - Number(a.id));
    return arr;
  };

  const openCategoryPage = (rootId, subId = 'all') => {
    setActiveRootCatId(rootId);
    setActiveSubCatId(subId);
    setShowMegaMenu(false);
    setPage('category');
    window.scrollTo(0, 0);
  };

  const openProductDetail = (product) => {
    setSelectedProduct(product);
    setDetailQty(1);
    setShowMegaMenu(false);
    setPage('product-detail');
    window.scrollTo(0, 0);
  };

  const addToCart = (product, qty = 1) => {
    if (product.stock_quantity <= 0) return alert('Sản phẩm tạm hết hàng!');
    setCart((prev) => {
      const exist = prev.find((it) => it.id === product.id);
      if (exist) {
        const nextQty = Math.min(exist.quantity + qty, product.stock_quantity);
        return prev.map((it) => (it.id === product.id ? { ...it, quantity: nextQty } : it));
      }
      return [...prev, { ...product, quantity: Math.min(qty, product.stock_quantity) }];
    });
    alert(`Đã thêm "${product.name}" vào giỏ hàng!`);
  };

  const updateCartQty = (id, delta) => {
    setCart((prev) =>
      prev
        .map((it) => {
          if (it.id !== id) return it;
          const next = it.quantity + delta;
          if (next > it.stock_quantity) return it;
          return { ...it, quantity: next };
        })
        .filter((it) => it.quantity > 0)
    );
  };

  const removeFromCart = (id) => setCart((prev) => prev.filter((it) => it.id !== id));

  const totalCartCount = cart.reduce((sum, it) => sum + it.quantity, 0);
  const totalCartPrice = cart.reduce((sum, it) => sum + Number(it.price) * it.quantity, 0);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc' }}>
      {/* ================= HEADER NHÀ 2 ĐỨA ================= */}
      <header
        style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 40 }}
        onMouseLeave={() => setShowMegaMenu(false)}
      >
        <div className="container" style={{ height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            {/* Logo Nhà 2 Đứa (không khung viền) */}
            <div
              onClick={() => { setPage('home'); setShowMegaMenu(false); }}
              style={{
                fontSize: '1.35rem',
                fontWeight: '800',
                color: '#0f172a',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                letterSpacing: '-0.01em'
              }}
            >
              Nhà 2 Đứa
            </div>

            <button
              onClick={() => setShowMegaMenu(!showMegaMenu)}
              onMouseEnter={() => setShowMegaMenu(true)}
              className="btn btn-outline btn-sm"
              style={{ fontWeight: '600', gap: '0.45rem' }}
            >
              <span>&#9776;</span> Danh mục
            </button>
          </div>

          {/* Thanh tìm kiếm */}
          <div style={{ flex: 1, maxWidth: '460px', position: 'relative' }}>
            <input
              type="text"
              placeholder="Tìm sản phẩm..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (page !== 'home' && page !== 'category') setPage('home');
              }}
              className="form-control"
              style={{ paddingLeft: '2.2rem', borderRadius: '8px', background: '#f8fafc' }}
            />
            <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '0.9rem' }}>
              &#128269;
            </span>
          </div>

          {/* Giỏ hàng & Tài khoản */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={() => { setPage('cart'); setShowMegaMenu(false); }}
              className="btn btn-outline btn-sm"
              style={{ position: 'relative', fontWeight: '600' }}
            >
              &#128722; Giỏ hàng
              {totalCartCount > 0 && (
                <span style={{ background: '#1d4ed8', color: '#fff', borderRadius: '999px', padding: '0.05rem 0.45rem', fontSize: '0.75rem' }}>
                  {totalCartCount}
                </span>
              )}
            </button>

            {currentUser ? (
              <button
                onClick={() => { setPage('profile'); setShowMegaMenu(false); }}
                className="btn btn-outline btn-sm"
                style={{ fontWeight: '600' }}
              >
                &#128100; {currentUser.full_name}
              </button>
            ) : (
              <button
                onClick={() => { setPage('auth'); setShowMegaMenu(false); }}
                className="btn btn-primary btn-sm"
              >
                Đăng nhập
              </button>
            )}
          </div>
        </div>

        {/* ================= MEGA MENU PHONG CÁCH NHÀ XINH ================= */}
        {showMegaMenu && (
          <div className="mega-menu-panel">
            <div className="container mega-menu-layout">
              <div className="mega-menu-columns">
                {rootCategories.map((root) => {
                  const children = categories.filter((c) => Number(c.parent_id) === Number(root.id));
                  return (
                    <div key={root.id} className="mega-cat-group">
                      <div
                        onClick={() => openCategoryPage(root.id, 'all')}
                        className="mega-cat-parent"
                        title={`Xem tất cả ${root.name}`}
                      >
                        {root.name}
                      </div>
                      <ul style={{ listStyle: 'none' }}>
                        {children.map((sub) => (
                          <li
                            key={sub.id}
                            onClick={() => openCategoryPage(root.id, sub.id)}
                            className="mega-cat-item"
                          >
                            {sub.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>

              <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '1.75rem' }}>
                <div style={{ borderRadius: '8px', overflow: 'hidden', marginBottom: '0.85rem', background: '#f1f5f9', height: '140px' }}>
                  <img
                    src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500"
                    alt="Bộ sưu tập Nhà 2 Đứa"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                <div style={{ fontWeight: '700', fontSize: '0.92rem', color: '#0f172a', marginBottom: '0.35rem' }}>
                  Nội thất đẹp cho không gian sống
                </div>
                <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '0.9rem' }}>
                  Khám phá bộ sưu tập mới nhất từ Nhà 2 Đứa
                </p>
                <button
                  onClick={() => {
                    setShowMegaMenu(false);
                    setPage('home');
                    setTimeout(() => document.getElementById('product-section')?.scrollIntoView({ behavior: 'smooth' }), 100);
                  }}
                  style={{
                    background: '#0f172a',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '999px',
                    padding: '0.5rem 1.25rem',
                    fontSize: '0.82rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Xem ngay
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ================= NỘI DUNG CÁC TRANG ================= */}
      <div style={{ flex: 1 }}>
        {page === 'home' && (
          <HomeView
            products={sortProducts(products.filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase())))}
            rootCategories={rootCategories}
            sortBy={sortBy}
            setSortBy={setSortBy}
            onSelectRootCategory={(id) => openCategoryPage(id, 'all')}
            onOpenDetail={openProductDetail}
            onAddToCart={addToCart}
          />
        )}

        {page === 'category' && (
          <CategoryView
            categories={categories}
            products={products}
            activeRootCatId={activeRootCatId}
            activeSubCatId={activeSubCatId}
            setActiveSubCatId={setActiveSubCatId}
            sortBy={sortBy}
            setSortBy={setSortBy}
            sortProducts={sortProducts}
            onGoHome={() => setPage('home')}
            onOpenDetail={openProductDetail}
            onAddToCart={addToCart}
          />
        )}

        {page === 'product-detail' && selectedProduct && (
          <ProductDetailView
            product={selectedProduct}
            categories={categories}
            qty={detailQty}
            setQty={setDetailQty}
            onGoHome={() => setPage('home')}
            onGoCategory={openCategoryPage}
            onAddToCart={addToCart}
          />
        )}

        {page === 'cart' && (
          <CartView
            cart={cart}
            totalCartCount={totalCartCount}
            totalCartPrice={totalCartPrice}
            onUpdateQty={updateCartQty}
            onRemove={removeFromCart}
            onGoCheckout={() => setPage('checkout')}
            onContinueShopping={() => setPage('home')}
          />
        )}

        {page === 'checkout' && (
          <CheckoutView
            currentUser={currentUser}
            cart={cart}
            totalCartPrice={totalCartPrice}
            onOrderSuccess={() => {
              setCart([]);
              fetchCatalog();
              setPage(currentUser ? 'orders' : 'home');
            }}
            onRequireLogin={() => setPage('auth')}
          />
        )}

        {page === 'auth' && (
          <AuthView
            onLoginSuccess={(user) => {
              onLoginSuccess(user);
              setPage('home');
            }}
          />
        )}

        {page === 'orders' && (
          <MyOrdersView
            currentUser={currentUser}
            onRequireLogin={() => setPage('auth')}
          />
        )}

        {page === 'profile' && (
          <ProfileView
            currentUser={currentUser}
            onUpdateUser={onUpdateUser}
            onGoOrders={() => setPage('orders')}
            onLogout={() => {
              onLogout();
              setPage('home');
            }}
          />
        )}
      </div>

      {/* ================= FOOTER NHÀ 2 ĐỨA ================= */}
      <footer style={{ background: '#fff', borderTop: '1px solid #e2e8f0', marginTop: '4rem', paddingTop: '3rem' }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', paddingBottom: '2.5rem' }}>
          <div>
            <div style={{ fontWeight: '800', fontSize: '1.15rem', marginBottom: '0.75rem' }}>Nhà 2 Đứa</div>
            <p style={{ fontSize: '0.88rem', color: '#64748b' }}>Nội thất cho không gian sống của bạn.</p>
          </div>

          <div>
            <div style={{ fontWeight: '700', fontSize: '0.92rem', marginBottom: '0.75rem' }}>Danh mục</div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.88rem', color: '#475569' }}>
              {rootCategories.map((c) => (
                <li key={c.id} onClick={() => openCategoryPage(c.id, 'all')} style={{ cursor: 'pointer' }}>{c.name}</li>
              ))}
            </ul>
          </div>

          <div>
            <div style={{ fontWeight: '700', fontSize: '0.92rem', marginBottom: '0.75rem' }}>Tài khoản</div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.88rem', color: '#475569' }}>
              <li onClick={() => setPage('cart')} style={{ cursor: 'pointer' }}>Giỏ hàng</li>
              <li onClick={() => setPage(currentUser ? 'orders' : 'auth')} style={{ cursor: 'pointer' }}>Đơn hàng của tôi</li>
              <li onClick={() => setPage(currentUser ? 'profile' : 'auth')} style={{ cursor: 'pointer' }}>Thông tin tài khoản</li>
            </ul>
          </div>

          <div>
            <div style={{ fontWeight: '700', fontSize: '0.92rem', marginBottom: '0.75rem' }}>Liên hệ</div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.88rem', color: '#475569' }}>
              <li>180 Cao Lỗ, Phường 4, Quận 8, TP.HCM</li>
              <li>0901 234 567</li>
              <li>contact@nha2dua.vn</li>
            </ul>
          </div>
        </div>

        <div style={{ borderTop: '1px solid #f1f5f9', padding: '1.25rem', textAlign: 'center', fontSize: '0.82rem', color: '#64748b' }}>
          © 2026 Nhà 2 Đứa — Thanh toán khi nhận hàng (COD)
        </div>
      </footer>
    </div>
  );
}

/* ============================================================================
   1. TRANG CHỦ
============================================================================ */
function HomeView({ products, rootCategories, sortBy, setSortBy, onSelectRootCategory, onOpenDetail, onAddToCart }) {
  return (
    <div>
      <section style={{ background: '#1e3a8a', color: '#fff', padding: '3.5rem 0' }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', alignItems: 'center', gap: '2.5rem' }}>
          <div>
            <h1 style={{ fontSize: '2.4rem', fontWeight: '800', lineHeight: '1.2', marginBottom: '1rem' }}>
              Nội thất cho không gian sống của bạn
            </h1>
            <p style={{ color: '#dbeafe', fontSize: '1.05rem', marginBottom: '1.75rem', maxWidth: '460px' }}>
              Sofa, bàn, ghế, tủ, kệ — chọn theo danh mục và đặt hàng thanh toán khi nhận tại Nhà 2 Đứa.
            </p>
            <a href="#product-section" className="btn" style={{ background: '#fff', color: '#1e3a8a', fontWeight: '700', padding: '0.7rem 1.5rem' }}>
              Xem sản phẩm
            </a>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <svg viewBox="0 0 380 210" style={{ width: '100%', maxWidth: '380px', height: 'auto' }}>
              <polygon points="315,20 345,20 355,65 305,65" fill="#dbeafe" />
              <rect x="328" y="65" width="4" height="118" fill="#93c5fd" />
              <ellipse cx="330" cy="183" rx="24" ry="6" fill="#60a5fa" />
              <rect x="35" y="68" width="230" height="58" rx="18" fill="#bfdbfe" />
              <rect x="18" y="96" width="34" height="68" rx="14" fill="#93c5fd" />
              <rect x="248" y="96" width="34" height="68" rx="14" fill="#93c5fd" />
              <rect x="52" y="114" width="96" height="34" rx="10" fill="#dbeafe" />
              <rect x="152" y="114" width="96" height="34" rx="10" fill="#dbeafe" />
              <rect x="48" y="146" width="204" height="18" rx="6" fill="#93c5fd" />
              <rect x="34" y="164" width="6" height="22" rx="3" fill="#60a5fa" />
              <rect x="260" y="164" width="6" height="22" rx="3" fill="#60a5fa" />
            </svg>
          </div>
        </div>
      </section>

      <section className="container" style={{ marginTop: '2.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1rem' }}>Mua theo danh mục</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
          {rootCategories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => onSelectRootCategory(cat.id)}
              style={{
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '1.25rem',
                textAlign: 'center',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
              }}
            >
              {cat.name}
            </div>
          ))}
        </div>
      </section>

      <section id="product-section" className="container" style={{ marginTop: '3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Sản phẩm</h2>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="form-control" style={{ width: 'auto' }}>
            <option value="price-asc">Giá: thấp &rarr; cao</option>
            <option value="price-desc">Giá: cao &rarr; thấp</option>
            <option value="newest">Mới nhất</option>
          </select>
        </div>

        <ProductGrid products={products} onOpenDetail={onOpenDetail} onAddToCart={onAddToCart} />
      </section>
    </div>
  );
}

function ProductGrid({ products, onOpenDetail, onAddToCart }) {
  if (products.length === 0) {
    return <div className="card" style={{ textAlign: 'center', color: '#64748b', padding: '3rem' }}>Không có sản phẩm nào phù hợp.</div>;
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.5rem' }}>
      {products.map((p) => (
        <div
          key={p.id}
          style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
        >
          <div
            onClick={() => onOpenDetail(p)}
            style={{ height: '210px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden' }}
          >
            {p.thumbnail_url ? (
              <img src={p.thumbnail_url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ color: '#94a3b8', fontSize: '0.88rem' }}>Ảnh sản phẩm</span>
            )}
          </div>

          <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.78rem', color: '#2563eb', fontWeight: '600', marginBottom: '0.25rem' }}>{p.category_name}</div>
              <h3 onClick={() => onOpenDetail(p)} style={{ fontSize: '1rem', fontWeight: '700', color: '#0f172a', marginBottom: '0.5rem', cursor: 'pointer' }}>
                {p.name}
              </h3>
              <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', marginBottom: '1rem' }}>
                {Number(p.price).toLocaleString('vi-VN')} ₫
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
              <button onClick={() => onAddToCart(p, 1)} className="btn btn-primary btn-sm" style={{ flex: 1 }}>
                Thêm vào giỏ
              </button>
              <span style={{ fontSize: '0.82rem', color: '#64748b', whiteSpace: 'nowrap' }}>Còn {p.stock_quantity}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CategoryView({ categories, products, activeRootCatId, activeSubCatId, setActiveSubCatId, sortBy, setSortBy, sortProducts, onGoHome, onOpenDetail, onAddToCart }) {
  const rootCat = categories.find((c) => Number(c.id) === Number(activeRootCatId));
  const subCategories = categories.filter((c) => Number(c.parent_id) === Number(activeRootCatId));
  const validCatIds = [Number(activeRootCatId), ...subCategories.map((s) => Number(s.id))];

  const filtered = products.filter((p) => {
    if (activeSubCatId === 'all') return validCatIds.includes(Number(p.category_id));
    return Number(p.category_id) === Number(activeSubCatId);
  });

  return (
    <div className="container" style={{ marginTop: '2rem' }}>
      <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>
        <span onClick={onGoHome} style={{ cursor: 'pointer', color: '#1d4ed8' }}>Trang chủ</span> / <strong>{rootCat?.name || 'Danh mục'}</strong>
      </div>

      <h1 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '1.25rem' }}>{rootCat?.name}</h1>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button onClick={() => setActiveSubCatId('all')} className={`btn btn-sm ${activeSubCatId === 'all' ? 'btn-primary' : 'btn-outline'}`}>
            Tất cả
          </button>
          {subCategories.map((sub) => (
            <button key={sub.id} onClick={() => setActiveSubCatId(sub.id)} className={`btn btn-sm ${Number(activeSubCatId) === Number(sub.id) ? 'btn-primary' : 'btn-outline'}`}>
              {sub.name}
            </button>
          ))}
        </div>

        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="form-control" style={{ width: 'auto' }}>
          <option value="price-asc">Giá: thấp &rarr; cao</option>
          <option value="price-desc">Giá: cao &rarr; thấp</option>
          <option value="newest">Mới nhất</option>
        </select>
      </div>

      <ProductGrid products={sortProducts(filtered)} onOpenDetail={onOpenDetail} onAddToCart={onAddToCart} />
    </div>
  );
}

function ProductDetailView({ product, categories, qty, setQty, onGoHome, onGoCategory, onAddToCart }) {
  const cat = categories.find((c) => Number(c.id) === Number(product.category_id));
  const parentCat = cat?.parent_id ? categories.find((c) => Number(c.id) === Number(cat.parent_id)) : null;

  return (
    <div className="container" style={{ marginTop: '2rem' }}>
      <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.5rem' }}>
        <span onClick={onGoHome} style={{ cursor: 'pointer', color: '#1d4ed8' }}>Trang chủ</span>
        {parentCat && (<>{' / '}<span onClick={() => onGoCategory(parentCat.id, 'all')} style={{ cursor: 'pointer', color: '#1d4ed8' }}>{parentCat.name}</span></>)}
        {cat && (<>{' / '}<span onClick={() => onGoCategory(parentCat ? parentCat.id : cat.id, cat.id)} style={{ cursor: 'pointer', color: '#1d4ed8' }}>{cat.name}</span></>)}
        {' / '}<strong>{product.name}</strong>
      </div>

      <div className="card" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem', padding: '2rem' }}>
        <div style={{ background: '#f1f5f9', borderRadius: '10px', minHeight: '340px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {product.thumbnail_url ? <img src={product.thumbnail_url} alt={product.name} style={{ width: '100%', height: '100%', maxHeight: '420px', objectFit: 'cover' }} /> : <span style={{ color: '#94a3b8' }}>Ảnh sản phẩm</span>}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#2563eb', marginBottom: '0.4rem' }}>{product.category_name}</div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '0.75rem' }}>{product.name}</h1>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#1d4ed8', marginBottom: '0.75rem' }}>{Number(product.price).toLocaleString('vi-VN')} ₫</div>
          <div style={{ marginBottom: '1.25rem' }}><span className="badge badge-success">Còn hàng: {product.stock_quantity} sản phẩm</span></div>
          <p style={{ color: '#475569', marginBottom: '1.75rem', lineHeight: '1.6' }}>{product.description || 'Thiết kế hiện đại, chất liệu bền bỉ, phù hợp mọi không gian nội thất.'}</p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>Số lượng</span>
            <div style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
              <button onClick={() => setQty(Math.max(1, qty - 1))} style={{ padding: '0.4rem 0.85rem', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>-</button>
              <span style={{ padding: '0 0.75rem', fontWeight: '600' }}>{qty}</span>
              <button onClick={() => setQty(Math.min(product.stock_quantity, qty + 1))} style={{ padding: '0.4rem 0.85rem', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>+</button>
            </div>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Tối đa {product.stock_quantity}</span>
          </div>

          <button onClick={() => onAddToCart(product, qty)} className="btn btn-primary" style={{ padding: '0.8rem 1.5rem', fontSize: '1rem' }}>
            Thêm vào giỏ
          </button>
        </div>
      </div>
    </div>
  );
}

function CartView({ cart, totalCartCount, totalCartPrice, onUpdateQty, onRemove, onGoCheckout, onContinueShopping }) {
  return (
    <div className="container" style={{ marginTop: '2rem' }}>
      <h1 style={{ fontSize: '1.6rem', fontWeight: '800', marginBottom: '1.5rem' }}>Giỏ hàng</h1>
      {cart.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: '#64748b', marginBottom: '1rem' }}>Giỏ hàng của bạn hiện đang trống.</p>
          <button onClick={onContinueShopping} className="btn btn-primary">Tiếp tục mua sắm</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
          <div className="card" style={{ padding: '0.5rem 1.5rem' }}>
            {cart.map((item) => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', padding: '1.25rem 0', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                  <div style={{ width: '68px', height: '68px', background: '#f1f5f9', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
                    {item.thumbnail_url && <img src={item.thumbnail_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                  </div>
                  <div>
                    <div style={{ fontWeight: '700', marginBottom: '0.25rem' }}>{item.name}</div>
                    <div style={{ fontSize: '0.88rem', color: '#64748b' }}>{Number(item.price).toLocaleString('vi-VN')} ₫</div>
                  </div>
                </div>
                <div style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '999px' }}>
                  <button onClick={() => onUpdateQty(item.id, -1)} style={{ padding: '0.3rem 0.75rem', background: 'none', border: 'none', cursor: 'pointer' }}>-</button>
                  <span style={{ padding: '0 0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>{item.quantity}</span>
                  <button onClick={() => onUpdateQty(item.id, 1)} style={{ padding: '0.3rem 0.75rem', background: 'none', border: 'none', cursor: 'pointer' }}>+</button>
                </div>
                <div style={{ fontWeight: '700', minWidth: '110px', textAlign: 'right' }}>{(Number(item.price) * item.quantity).toLocaleString('vi-VN')} ₫</div>
                <button onClick={() => onRemove(item.id)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.88rem' }}>Xóa</button>
              </div>
            ))}
          </div>

          <div className="card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1.25rem' }}>Tóm tắt đơn hàng</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.92rem', color: '#475569' }}>
              <span>Tạm tính ({totalCartCount} sản phẩm)</span>
              <span>{totalCartPrice.toLocaleString('vi-VN')} ₫</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '1rem', marginBottom: '1.5rem', fontWeight: '800', fontSize: '1.1rem' }}>
              <span>Tổng cộng</span>
              <span style={{ color: '#1d4ed8' }}>{totalCartPrice.toLocaleString('vi-VN')} ₫</span>
            </div>
            <button onClick={onGoCheckout} className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }}>Tiến hành đặt hàng</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================================
   5. TRANG THANH TOÁN (CHỈ THANH TOÁN KHI NHẬN HÀNG - COD)
============================================================================ */
function CheckoutView({ currentUser, cart, totalCartPrice, onOrderSuccess, onRequireLogin }) {
  const [form, setForm] = useState({
    receiver_name: currentUser?.full_name || '',
    receiver_phone: currentUser?.phone || '',
    shipping_address: '',
    note: '',
    payment_method: 'cod'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      alert('Vui lòng đăng nhập tài khoản trước khi đặt hàng!');
      return onRequireLogin();
    }
    try {
      const res = await API.post('/api/orders', { user_id: currentUser.id, ...form, items: cart });
      if (res.data?.success) {
        alert(`Đặt hàng thành công! Mã đơn hàng: ${res.data.order_code}`);
        onOrderSuccess();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  return (
    <div className="container" style={{ marginTop: '2rem' }}>
      <h1 style={{ fontSize: '1.6rem', fontWeight: '800', marginBottom: '1.5rem' }}>Thanh toán</h1>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
        <div>
          <div className="card">
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '1.25rem' }}>Thông tin nhận hàng</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group"><label className="form-label">Họ tên người nhận *</label><input required placeholder="Nhập họ tên" value={form.receiver_name} onChange={(e) => setForm({ ...form, receiver_name: e.target.value })} className="form-control" /></div>
              <div className="form-group"><label className="form-label">Số điện thoại *</label><input required placeholder="Nhập số điện thoại" value={form.receiver_phone} onChange={(e) => setForm({ ...form, receiver_phone: e.target.value })} className="form-control" /></div>
              <div className="form-group"><label className="form-label">Địa chỉ giao hàng *</label><input required placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành" value={form.shipping_address} onChange={(e) => setForm({ ...form, shipping_address: e.target.value })} className="form-control" /></div>
              <div className="form-group"><label className="form-label">Ghi chú</label><input placeholder="Ví dụ: Gọi trước khi giao" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className="form-control" /></div>
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '1rem' }}>Phương thức thanh toán</h3>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '1rem', border: '1px solid #bfdbfe', background: '#eff6ff', borderRadius: '8px', cursor: 'pointer' }}>
              <input type="radio" name="pay" checked readOnly style={{ marginTop: '0.25rem' }} />
              <div>
                <div style={{ fontWeight: '700', fontSize: '0.92rem' }}>Thanh toán khi nhận hàng (COD)</div>
                <div style={{ fontSize: '0.82rem', color: '#475569' }}>Bạn trả tiền mặt khi nhận được hàng.</div>
              </div>
            </label>
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '1.25rem' }}>Đơn hàng của bạn</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
            {cart.map((it) => (
              <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span style={{ color: '#334155' }}>{it.name} &times; {it.quantity}</span>
                <strong>{(Number(it.price) * it.quantity).toLocaleString('vi-VN')} ₫</strong>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '1rem', marginBottom: '1.5rem', fontWeight: '800', fontSize: '1.1rem' }}>
            <span>Tổng cộng</span>
            <span style={{ color: '#1d4ed8' }}>{totalCartPrice.toLocaleString('vi-VN')} ₫</span>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }}>Đặt hàng</button>
        </div>
      </form>
    </div>
  );
}

function AuthView({ onLoginSuccess }) {
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [regForm, setRegForm] = useState({ full_name: '', email: '', phone: '', password: '' });

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post('/api/auth/login', loginForm);
      if (res.data?.success) onLoginSuccess(res.data.user);
    } catch (err) { alert(err.response?.data?.message || err.message); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post('/api/auth/register', regForm);
      if (res.data?.success) { alert('Đăng ký tài khoản thành công!'); onLoginSuccess(res.data.user); }
    } catch (err) { alert(err.response?.data?.message || err.message); }
  };

  return (
    <div className="container" style={{ marginTop: '3rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', maxWidth: '900px', margin: '0 auto' }}>
        <div className="card">
          <h2 style={{ fontSize: '1.35rem', fontWeight: '800', marginBottom: '1.25rem' }}>Đăng nhập</h2>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group"><label className="form-label">Email *</label><input required type="email" placeholder="email@example.com" value={loginForm.email} onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })} className="form-control" /></div>
            <div className="form-group"><label className="form-label">Mật khẩu *</label><input required type="password" placeholder="••••••" value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} className="form-control" /></div>
            <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem', padding: '0.7rem' }}>Đăng nhập</button>
          </form>
        </div>

        <div className="card">
          <h2 style={{ fontSize: '1.35rem', fontWeight: '800', marginBottom: '1.25rem' }}>Đăng ký tài khoản</h2>
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group"><label className="form-label">Họ tên *</label><input required placeholder="Nhập họ tên" value={regForm.full_name} onChange={(e) => setRegForm({ ...regForm, full_name: e.target.value })} className="form-control" /></div>
            <div className="form-group"><label className="form-label">Email *</label><input required type="email" placeholder="email@example.com" value={regForm.email} onChange={(e) => setRegForm({ ...regForm, email: e.target.value })} className="form-control" /></div>
            <div className="form-group"><label className="form-label">Số điện thoại</label><input placeholder="Không bắt buộc" value={regForm.phone} onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })} className="form-control" /></div>
            <div className="form-group"><label className="form-label">Mật khẩu *</label><input required type="password" placeholder="••••••" value={regForm.password} onChange={(e) => setRegForm({ ...regForm, password: e.target.value })} className="form-control" /></div>
            <button type="submit" className="btn btn-outline" style={{ marginTop: '0.5rem', padding: '0.7rem', fontWeight: '700' }}>Tạo tài khoản</button>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   7. ĐƠN HÀNG CỦA TÔI (CHỈ HIỂN THỊ ĐÚNG ĐƠN CỦA USER ĐANG ĐĂNG NHẬP)
============================================================================ */
function MyOrdersView({ currentUser, onRequireLogin }) {
  const [orders, setOrders] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    if (!currentUser) return;
    API.get(`/api/orders?user_id=${currentUser.id}`).then((res) => {
      if (res.data?.success && Array.isArray(res.data.data)) {
        const myOrders = res.data.data.filter((o) => Number(o.user_id) === Number(currentUser.id));
        setOrders(myOrders);
      }
    });
  }, [currentUser]);

  if (!currentUser) {
    return (
      <div className="container" style={{ marginTop: '3rem', textAlign: 'center' }}>
        <p style={{ marginBottom: '1rem' }}>Vui lòng đăng nhập để xem lịch sử đơn hàng.</p>
        <button onClick={onRequireLogin} className="btn btn-primary">Đăng nhập ngay</button>
      </div>
    );
  }

  const tabs = [
    { id: 'all', label: 'Tất cả' },
    { id: 'pending', label: 'Chờ xác nhận' },
    { id: 'confirmed', label: 'Đã xác nhận' },
    { id: 'shipping', label: 'Đang giao' },
    { id: 'completed', label: 'Hoàn thành' },
    { id: 'cancelled', label: 'Đã hủy' }
  ];

  const statusLabels = {
    pending: { text: 'Chờ xác nhận', cls: 'badge-warning' },
    confirmed: { text: 'Đã xác nhận', cls: 'badge-info' },
    shipping: { text: 'Đang giao', cls: 'badge-info' },
    completed: { text: 'Hoàn thành', cls: 'badge-success' },
    cancelled: { text: 'Đã hủy', cls: 'badge-danger' }
  };

  const filtered = filterStatus === 'all' ? orders : orders.filter((o) => o.status === filterStatus);

  return (
    <div className="container" style={{ marginTop: '2rem', maxWidth: '960px' }}>
      <h1 style={{ fontSize: '1.6rem', fontWeight: '800', marginBottom: '1.25rem' }}>Đơn hàng của tôi</h1>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setFilterStatus(t.id)} className={`btn btn-sm ${filterStatus === t.id ? 'btn-primary' : 'btn-outline'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: '#64748b', padding: '3rem' }}>Không có đơn hàng nào ở trạng thái này.</div>
      ) : (
        filtered.map((o) => {
          const st = statusLabels[o.status] || { text: o.status, cls: 'badge-gray' };
          return (
            <div key={o.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.85rem', marginBottom: '1rem' }}>
                <div>
                  <strong style={{ fontSize: '1rem' }}>{o.order_code}</strong>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Đặt ngày {new Date(o.created_at).toLocaleDateString('vi-VN')}</div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <span className={`badge ${st.cls}`}>{st.text}</span>
                  <span className={`badge ${o.payment_status === 'paid' ? 'badge-info' : 'badge-gray'}`}>{o.payment_status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}</span>
                </div>
              </div>

              {(o.items || []).map((it) => (
                <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #f8fafc' }}>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '0.92rem' }}>{it.product_name}</div>
                    <div style={{ fontSize: '0.82rem', color: '#64748b' }}>Số lượng: {it.quantity}</div>
                  </div>
                  <div style={{ fontWeight: '600' }}>{(Number(it.unit_price) * it.quantity).toLocaleString('vi-VN')} ₫</div>
                </div>
              ))}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #e2e8f0', fontSize: '0.85rem', color: '#475569' }}>
                <div>
                  <div>Người nhận: <strong>{o.receiver_name}</strong> &bull; {o.receiver_phone}</div>
                  <div>Địa chỉ: {o.shipping_address}</div>
                  {o.note && <div>Ghi chú: {o.note}</div>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.8rem' }}>Tổng tiền</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: '800', color: '#1d4ed8' }}>{Number(o.total_amount).toLocaleString('vi-VN')} ₫</div>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

function ProfileView({ currentUser, onUpdateUser, onGoOrders, onLogout }) {
  const [fullName, setFullName] = useState(currentUser?.full_name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const res = await API.put(`/api/auth/profile/${currentUser.id}`, { full_name: fullName, phone });
      if (res.data?.success) { onUpdateUser({ full_name: fullName, phone }); alert('Đã lưu thay đổi hồ sơ!'); }
    } catch (err) { alert(err.response?.data?.message || err.message); }
  };

  return (
    <div className="container" style={{ marginTop: '2rem', maxWidth: '960px' }}>
      <h1 style={{ fontSize: '1.6rem', fontWeight: '800', marginBottom: '1.5rem' }}>Thông tin tài khoản</h1>
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '1.5rem', alignItems: 'start' }}>
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingBottom: '1rem', borderBottom: '1px solid #f1f5f9', marginBottom: '1rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#dbeafe', color: '#1d4ed8', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {(currentUser?.full_name || 'U').charAt(0).toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontWeight: '700', fontSize: '0.92rem' }}>{currentUser?.full_name}</div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', textOverflow: 'ellipsis', overflow: 'hidden' }}>{currentUser?.email}</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <button className="btn btn-sm" style={{ justifyContent: 'flex-start', background: '#eff6ff', color: '#1d4ed8', fontWeight: '600' }}>&#128100; Thông tin tài khoản</button>
            <button onClick={onGoOrders} className="btn btn-sm" style={{ justifyContent: 'flex-start', background: 'transparent', color: '#334155' }}>&#128230; Đơn hàng của tôi</button>
            <button onClick={onLogout} className="btn btn-sm" style={{ justifyContent: 'flex-start', background: 'transparent', color: '#dc2626' }}>&#10162; Đăng xuất</button>
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1.25rem' }}>Hồ sơ của bạn</h3>
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '480px' }}>
            <div className="form-group"><label className="form-label">Họ tên *</label><input required value={fullName} onChange={(e) => setFullName(e.target.value)} className="form-control" /></div>
            <div className="form-group"><label className="form-label">Email đăng nhập</label><input disabled value={currentUser?.email || ''} className="form-control" /><span style={{ fontSize: '0.78rem', color: '#64748b' }}>Email dùng để đăng nhập nên không thể thay đổi.</span></div>
            <div className="form-group"><label className="form-label">Số điện thoại</label><input value={phone} onChange={(e) => setPhone(e.target.value)} className="form-control" /></div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button type="submit" className="btn btn-primary">Lưu thay đổi</button>
              <button type="button" onClick={() => { setFullName(currentUser?.full_name || ''); setPhone(currentUser?.phone || ''); }} className="btn btn-outline">Hủy</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}