import { useState, useEffect, useMemo } from 'react';
import { getProducts, addStockHistory, getStockForProduct } from '../db/db';
import { Plus, Search } from 'lucide-react';
import './Stock.css';

const Stock = () => {
  const [products, setProducts] = useState([]);
  const [stockMap, setStockMap] = useState({});
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantityToAdd, setQuantityToAdd] = useState('');
  const [formSearch, setFormSearch] = useState('');
  const [gridSearch, setGridSearch] = useState('');

  const loadData = async () => {
    const prods = await getProducts();
    setProducts(prods);

    const newStockMap = {};
    for (const p of prods) {
      newStockMap[p.id] = await getStockForProduct(p.id);
    }
    setStockMap(newStockMap);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, []);

  const handleAddStock = async (e) => {
    e.preventDefault();
    if (!selectedProductId || !quantityToAdd) {
      alert("Please select a valid item from the list.");
      return;
    }
    
    await addStockHistory(selectedProductId, Number(quantityToAdd), 'ADD');
    
    // Reset form and reload
    setSelectedProductId('');
    setFormSearch('');
    setQuantityToAdd('');
    await loadData();
    alert('Stock added successfully!');
  };

  const filteredFormProducts = useMemo(() => {
    return products.filter(p => p.name.toLowerCase().includes(formSearch.toLowerCase()) || (p.sku && p.sku.toLowerCase().includes(formSearch.toLowerCase())));
  }, [products, formSearch]);

  const filteredGridProducts = useMemo(() => {
    return products.filter(p => p.name.toLowerCase().includes(gridSearch.toLowerCase()) || (p.sku && p.sku.toLowerCase().includes(gridSearch.toLowerCase())));
  }, [products, gridSearch]);

  return (
    <div className="container page-enter-active">
      <h2 style={{ marginBottom: '1.5rem' }}>Manage Stock</h2>

      <div className="card stock-form-card animate-slide-up">
        <h3>Add Bulk Stock</h3>
        <form onSubmit={handleAddStock} className="stock-form">
          <div className="form-group">
            <label className="form-label">Search Item</label>
            <input 
              type="text" 
              list="stock-items"
              className="form-input" 
              placeholder="Search and select item..." 
              value={formSearch} 
              onChange={(e) => {
                setFormSearch(e.target.value);
                const matched = products.find(p => p.name === e.target.value);
                if (matched) {
                  setSelectedProductId(matched.id);
                } else {
                  setSelectedProductId('');
                }
              }}
              required
            />
            <datalist id="stock-items">
              {products.map(p => (
                <option key={p.id} value={p.name} />
              ))}
            </datalist>
          </div>
          <div className="form-group">
            <label className="form-label">Quantity</label>
            <input 
              type="number" 
              className="form-input" 
              value={quantityToAdd} 
              onChange={(e) => setQuantityToAdd(e.target.value)} 
              min="1" 
              required 
            />
          </div>
          <button type="submit" className="btn btn-primary">
            <Plus size={18} /> Add
          </button>
        </form>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '2rem 0 1rem' }}>
        <h3 style={{ margin: 0 }}>Current Stock Levels</h3>
      </div>
      
      <div className="search-wrapper" style={{ marginBottom: '1rem' }}>
        <Search size={18} className="search-icon" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
        <input 
          type="text" 
          placeholder="Search stock..." 
          value={gridSearch} 
          onChange={(e) => setGridSearch(e.target.value)} 
          className="form-input search-input"
          style={{ paddingLeft: '2.5rem' }}
        />
      </div>

      <div className="stock-grid">
        {filteredGridProducts.map(p => (
          <div key={p.id} className="card stock-item-card animate-slide-up">
            <div className="stock-info">
              <div className="stock-name">{p.name}</div>
              <div className="stock-meta">SKU: {p.sku || 'N/A'}</div>
            </div>
            <div className="stock-quantity">
              <span className="qty-number">{stockMap[p.id] || 0}</span>
              <span className="qty-unit">{p.unit}</span>
            </div>
          </div>
        ))}
        {filteredGridProducts.length === 0 && <p className="empty-state">No items found.</p>}
      </div>
    </div>
  );
};

export default Stock;
