import { useState, useEffect } from 'react';
import { getProducts, saveProduct, deleteProduct, addStockHistory } from '../db/db';
import { Plus, Edit2, Save, X, Search, Trash2, ArrowLeft } from 'lucide-react';
import './Register.css';

const Register = () => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState({ id: null, name: '', unit: 'PCS', rate: '', tax: '5', initialStock: '' });

  const loadProducts = async () => {
    const data = await getProducts();
    setProducts(data);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadProducts();
  }, []);

  const handleOpenForm = (product = null) => {
    if (product && product.id) {
      setCurrentProduct({ ...product, initialStock: '' }); // Don't show initial stock for edits
    } else {
      setCurrentProduct({ id: null, name: '', unit: 'PCS', rate: '', tax: '5', initialStock: '' });
    }
    setIsFormOpen(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCurrentProduct(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    if (!currentProduct.name || !currentProduct.rate) {
      alert("Please fill all required fields.");
      return;
    }

    const isDuplicate = products.some(p => p.name.trim().toLowerCase() === currentProduct.name.trim().toLowerCase() && p.id !== currentProduct.id);
    if (isDuplicate) {
      alert("This item is already registered.");
      return;
    }

    if (Number(currentProduct.rate) < 0) {
      alert("Please enter a valid Rate.");
      return;
    }

    const isNew = !currentProduct.id;
    const { initialStock, ...productData } = currentProduct;

    const savedId = await saveProduct({
      ...productData,
      rate: Number(productData.rate),
      tax: Number(productData.tax)
    });

    if (isNew && initialStock && Number(initialStock) > 0) {
      await addStockHistory(savedId, Number(initialStock), 'ADD');
    }

    setIsFormOpen(false);
    loadProducts();
    alert(isNew ? "Item added successfully with initial stock!" : "Item updated successfully!");
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      await deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="container page-enter-active">
      {!isFormOpen ? (
        <>
          <div className="header-actions">
            <h2>Registered Items</h2>
            <button className="btn btn-primary" onClick={() => handleOpenForm()}>
              <Plus size={18} /> Add Item
            </button>
          </div>

          <div className="search-wrapper" style={{ marginBottom: '1.5rem' }}>
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search items by name or SKU..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="form-input search-input"
            />
          </div>

          <div className="product-list">
            {filteredProducts.map(p => (
              <div key={p.id} className="card product-card animate-slide-up">
                <div className="product-info">
                  <h3>{p.name}</h3>
                  <p className="product-meta">SKU: {p.sku || 'N/A'} | Unit: {p.unit}</p>
                  <div className="product-pricing">
                    <span className="rate">₹{p.rate}</span>
                    <span className="tax">Tax: {p.tax}%</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn-icon" onClick={() => handleOpenForm(p)}>
                    <Edit2 size={18} />
                  </button>
                  <button className="btn-icon" onClick={() => handleDelete(p.id)} style={{ color: 'var(--color-danger)' }}>
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
            {filteredProducts.length === 0 && <p className="empty-state">No items found.</p>}
          </div>
        </>
      ) : (
        <div className="form-full-page animate-slide-up">
          <div className="header-actions" style={{ marginBottom: '1rem' }}>
            <button className="btn btn-secondary" onClick={() => setIsFormOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
              <ArrowLeft size={18} /> Back
            </button>
            <h2 style={{ margin: 0 }}>{currentProduct.id ? 'Edit Item' : 'New Item'}</h2>
            <div style={{ width: '85px' }}></div>
          </div>
          
          <div className="card" style={{ padding: '1.5rem' }}>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Item Name *</label>
                <input type="text" name="name" value={currentProduct.name} onChange={handleChange} className="form-input" required />
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Unit</label>
                  <select name="unit" value={currentProduct.unit} onChange={handleChange} className="form-input" disabled>
                    <option value="PCS">Pieces (PCS)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Rate (₹) *</label>
                  <input type="number" name="rate" value={currentProduct.rate} onChange={handleChange} className="form-input" required min="0" step="0.01" />
                </div>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Tax Percentage (%)</label>
                  <input type="number" name="tax" value={currentProduct.tax} onChange={handleChange} className="form-input" required min="0" step="0.1" />
                </div>
                {!currentProduct.id && (
                  <div className="form-group">
                    <label className="form-label">Initial Stock</label>
                    <input type="number" name="initialStock" value={currentProduct.initialStock} onChange={handleChange} className="form-input" min="0" placeholder="e.g. 100" />
                  </div>
                )}
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '1rem' }}>
                <Save size={18} /> {currentProduct.id ? 'Update Item' : 'Save Item'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Register;
