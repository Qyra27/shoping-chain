import { useState, useEffect } from 'react';
import { useContract } from './hooks/useContract'; 
import { nativeToScVal } from "@stellar/stellar-sdk";

function App() {
  const {
    publicKey,
    isWalletConnected,
    xlmBalance,
    connectWallet,
    disconnectWallet,
    readContract,
    writeContract,
    txLoading,
    txError
  } = useContract();

  const [products, setProducts] = useState([]);
  const [newProductName, setNewProductName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(false);

  const parseProducts = (scVal) => {
    return scVal.map(p => ({
      id: Number(p.id),
      seller: p.seller,
      name: p.name,
      price: Number(p.price),
    }));
  }

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const result = await readContract("get_products");
      setProducts(result ? parseProducts(result) : []);
    } catch (err) {
      console.error("Gagal ambil produk:", err);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!isWalletConnected) return alert("Koneksikan wallet dulu!");
    try {
      const args = [
        nativeToScVal(publicKey, { type: "address" }),
        nativeToScVal(newProductName, { type: "string" }),
        nativeToScVal(Number(newProductPrice), { type: "u64" }),
      ];
      await writeContract("create_product", args);
      alert("Produk berhasil didaftarkan!");
      setNewProductName('');
      setNewProductPrice('');
      fetchProducts();
    } catch (err) {
      console.error("Gagal tambah produk:", err);
    }
  };

  const handleBuyProduct = async (id) => {
    if (!isWalletConnected) return alert("Koneksikan wallet dulu!");
    try {
      const args = [
        nativeToScVal(publicKey, { type: "address" }),
        nativeToScVal(id, { type: "u64" }),
      ];
      await writeContract("buy_product", args);
      alert("Pembelian berhasil!");
      fetchProducts();
    } catch (err) {
      console.error("Gagal beli:", err);
    }
  };

  // Styles (sama seperti sebelumnya)
  const styles = {
    container: { backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif", color: '#1e293b' },
    nav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 5%', backgroundColor: '#ffffff', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', position: 'sticky', top: 0, zIndex: 100 },
    logo: { fontSize: '1.5rem', fontWeight: 'bold', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '10px' },
    walletCard: { display: 'flex', alignItems: 'center', gap: '15px' },
    btnPrimary: { backgroundColor: '#3b82f6', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', transition: '0.3s' },
    btnOutline: { backgroundColor: 'transparent', border: '1px solid #e2e8f0', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' },
    hero: { textAlign: 'center', padding: '60px 20px', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: 'white', marginBottom: '40px' },
    section: { maxWidth: '1100px', margin: '0 auto', padding: '0 20px' },
    cardGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '25px', marginBottom: '50px' },
    productCard: { backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', border: '1px solid #f1f5f9', transition: 'transform 0.2s' },
    formCard: { backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', marginBottom: '40px', maxWidth: '500px', margin: '0 auto 40px auto' },
    input: { width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', boxSizing: 'border-box' },
    badge: { fontSize: '0.7rem', padding: '4px 8px', borderRadius: '12px', backgroundColor: '#eff6ff', color: '#3b82f6', fontWeight: 'bold' }
  };

 return (
    <div style={styles.container}>
      {/* Navbar */}
      <nav style={styles.nav}>
        <div style={styles.logo}>🛒 QYRA STORE</div>
        <div style={styles.walletCard}>
          {isWalletConnected && (
            <div style={{ textAlign: 'right', display: 'none', display: 'block' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{xlmBalance} XLM</div>
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{publicKey.substring(0, 6)}...{publicKey.substring(52)}</div>
            </div>
          )}
          {!isWalletConnected ? (
            <button onClick={connectWallet} style={styles.btnPrimary}>Connect Wallet</button>
          ) : (
            <button onClick={disconnectWallet} style={styles.btnOutline}>Logout</button>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <header style={styles.hero}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>Blockchain Market</h1>
        <p style={{ opacity: 0.9 }}>Beli dan jual barang secara aman di jaringan Stellar Soroban.</p>
      </header>

      <main style={styles.section}>
        {/* Form Tambah Produk */}
        <div style={styles.formCard}>
          <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Daftarkan Produk Baru</h3>
          <form onSubmit={handleAddProduct}>
            <input 
              style={styles.input}
              placeholder="Nama Barang (contoh: Kopi Luwak)" 
              value={newProductName}
              onChange={(e) => setNewProductName(e.target.value)}
              required
            />
            <input 
              style={styles.input}
              type="number" 
              placeholder="Harga dalam XLM" 
              value={newProductPrice}
              onChange={(e) => setNewProductPrice(e.target.value)}
              required
            />
            <button type="submit" disabled={txLoading} style={{...styles.btnPrimary, width: '100%', marginTop: '10px', backgroundColor: txLoading ? '#94a3b8' : '#3b82f6' }}>
              {txLoading ? "Memproses..." : "Konfirmasi Jual"}
            </button>
          </form>
          {txError && <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '10px' }}>⚠️ {txError}</p>}
        </div>

        {/* List Produk */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.5rem' }}>Eksplor Produk</h2>
          <button onClick={fetchProducts} style={styles.btnOutline}>🔄 Refresh</button>
        </div>

        {loadingProducts ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>Memuat data dari blockchain...</div>
        ) : (
          <div style={styles.cardGrid}>
            {products.length === 0 && (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                Belum ada produk yang dijual saat ini.
              </div>
            )}
            {products.map((p) => (
              <div key={p.id.toString()} style={styles.productCard} className="hover-card">
                <div style={{ height: '160px', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>
                  📦
                </div>
                <div style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{p.name}</h3>
                    <span style={styles.badge}>ID: {p.id.toString()}</span>
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#059669', marginBottom: '15px' }}>
                    {p.price.toString()} <span style={{ fontSize: '0.9rem', color: '#64748b' }}>XLM</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '20px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    Seller: {p.seller.substring(0, 10)}...
                  </div>
                  
                  <button 
                    onClick={() => handleBuyProduct(p.id)}
                    disabled={txLoading || p.seller === publicKey}
                    style={{ 
                      ...styles.btnPrimary, 
                      width: "100%", 
                      backgroundColor: p.seller === publicKey ? '#f1f5f9' : '#3b82f6',
                      color: p.seller === publicKey ? '#94a3b8' : 'white',
                      cursor: (txLoading || p.seller === publicKey) ? 'not-allowed' : 'pointer',
                      border: p.seller === publicKey ? '1px solid #e2e8f0' : 'none'
                    }}
                  >
                    {p.seller === publicKey ? "Barang Milik Anda" : "Beli Sekarang"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      
      <footer style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: '0.8rem' }}>
        Built on Stellar Soroban • 2026
      </footer>
    </div>
  );
}

export default App;