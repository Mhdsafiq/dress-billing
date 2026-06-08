import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProducts, saveInvoice, getNextInvoiceNo } from '../db/db';
import { Search, Plus, Minus, FileCheck, User, Truck, ArrowRight, ArrowLeft, FastForward } from 'lucide-react';
import './Billing.css';

const Billing = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [step, setStep] = useState(1);
  
  // Bill To
  const [billTo, setBillTo] = useState({
    name: '', address: '', mobile: '', gstin: '', placeOfSupply: 'Tamil Nadu'
  });
  
  // Ship To
  const [shipTo, setShipTo] = useState({
    name: '', address: '', mobile: ''
  });

  const [sameAsBilling, setSameAsBilling] = useState(true);
  
  const [discountPercent, setDiscountPercent] = useState('');
  const [discountFlat, setDiscountFlat] = useState('');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const data = await getProducts();
    setProducts(data);
  };

  const handleSearch = (e) => setSearch(e.target.value);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()))
  );

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateCartQty = (id, newQty) => {
    if (newQty <= 0) {
      setCart(prev => prev.filter(item => item.id !== id));
      return;
    }
    setCart(prev => prev.map(item => item.id === id ? { ...item, qty: newQty } : item));
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let cgst = 0;
    let sgst = 0;

    cart.forEach(item => {
      const itemTotal = item.rate * item.qty;
      subtotal += itemTotal;
      const taxAmount = (itemTotal * item.tax) / 100;
      cgst += taxAmount / 2;
      sgst += taxAmount / 2;
    });

    let grandTotal = subtotal + cgst + sgst;

    let discountAmount = 0;
    if (discountPercent) {
      discountAmount += (grandTotal * Number(discountPercent)) / 100;
    }
    if (discountFlat) {
      discountAmount += Number(discountFlat);
    }

    grandTotal -= discountAmount;

    return { subtotal, cgst, sgst, discountAmount, grandTotal };
  };

  const totals = calculateTotals();

  const handleNextStep = () => {
    if (cart.length === 0) {
      alert("Please add products to the bill.");
      return;
    }
    setStep(2);
  };

  const handleGenerateInvoice = async (skipCustomerDetails = false) => {
    if (cart.length === 0) {
      alert("Please add products to the bill.");
      return;
    }

    let finalBillTo = { ...billTo };
    if (skipCustomerDetails) {
      finalBillTo = {
        name: 'CASH', address: '', mobile: '', gstin: '', placeOfSupply: 'Tamil Nadu'
      };
    } else if (!billTo.name) {
      alert("Customer Name is required. If this is a cash sale, click Skip.");
      return;
    }

    const finalShipTo = skipCustomerDetails ? { ...finalBillTo } : (sameAsBilling ? { ...finalBillTo } : shipTo);

    const timestamp = new Date().getTime();
    const nextInvoiceNo = await getNextInvoiceNo();

    const invoiceData = {
      invoiceNo: nextInvoiceNo,
      date: timestamp,
      billTo: finalBillTo,
      shipTo: finalShipTo,
      items: cart,
      totals
    };

    const id = await saveInvoice(invoiceData);
    navigate(`/invoice/${id}`);
  };

  return (
    <div className="container page-enter-active billing-page">
      <div className="wizard-header">
        <h2>{step === 1 ? 'Add Products' : 'Customer Details'}</h2>
        <div className="wizard-steps">
          <span className={`step-dot ${step === 1 ? 'active' : ''}`}>1</span>
          <span className="step-line"></span>
          <span className={`step-dot ${step === 2 ? 'active' : ''}`}>2</span>
        </div>
      </div>

      {step === 1 && (
        <div className="billing-step animate-slide-up">
          <div className="card search-card">
            <div className="search-wrapper">
              <Search size={18} className="search-icon" />
              <input 
                type="text" 
                placeholder="Search products..." 
                value={search} 
                onChange={handleSearch} 
                className="form-input search-input"
              />
            </div>
            <div className="product-grid">
              {filteredProducts.map(p => (
                <div key={p.id} className="product-btn" onClick={() => addToCart(p)}>
                  <div className="p-name">{p.name}</div>
                  <div className="p-rate">₹{p.rate}</div>
                </div>
              ))}
              {filteredProducts.length === 0 && <p style={{ gridColumn: '1/-1', textAlign: 'center', fontSize: '0.875rem' }}>No products found</p>}
            </div>
          </div>

          <div className="card cart-card">
            <div className="cart-header">
              <h3>Cart Items</h3>
              <span className="cart-total-badge">₹{totals.grandTotal.toFixed(2)}</span>
            </div>
            {cart.length === 0 ? (
              <p className="empty-cart">Cart is empty</p>
            ) : (
              <div className="cart-list">
                {cart.map(item => (
                  <div key={item.id} className="cart-item">
                    <div className="cart-item-info">
                      <div className="ci-name">{item.name}</div>
                      <div className="ci-rate">₹{item.rate} x {item.qty}</div>
                    </div>
                    <div className="cart-item-actions">
                      <button className="btn-icon-sm" onClick={() => updateCartQty(item.id, item.qty - 1)}><Minus size={14}/></button>
                      <input 
                        type="number" 
                        value={item.qty} 
                        onChange={(e) => updateCartQty(item.id, Number(e.target.value))}
                        className="qty-input"
                      />
                      <button className="btn-icon-sm" onClick={() => updateCartQty(item.id, item.qty + 1)}><Plus size={14}/></button>
                    </div>
                    <div className="ci-total">₹{(item.rate * item.qty).toFixed(2)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="wizard-actions">
            <button className="btn btn-primary next-btn" onClick={handleNextStep}>
              Next Step <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="billing-step animate-slide-up">
          <div className="card form-card">
            <h3 className="section-title"><User size={18}/> Bill To</h3>
            <div className="form-group">
              <input type="text" placeholder="Customer / Shop Name" className="form-input" value={billTo.name} onChange={e => setBillTo({...billTo, name: e.target.value})} />
            </div>
            <div className="form-group">
              <input type="text" placeholder="Mobile Number" className="form-input" value={billTo.mobile} onChange={e => setBillTo({...billTo, mobile: e.target.value})} />
            </div>
            <div className="form-group">
              <textarea placeholder="Address" className="form-input" rows="2" value={billTo.address} onChange={e => setBillTo({...billTo, address: e.target.value})}></textarea>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <input type="text" placeholder="GSTIN Number" className="form-input" value={billTo.gstin} onChange={e => setBillTo({...billTo, gstin: e.target.value})} />
              </div>
              <div className="form-group">
                <input type="text" placeholder="Place of Supply" className="form-input" value={billTo.placeOfSupply} onChange={e => setBillTo({...billTo, placeOfSupply: e.target.value})} />
              </div>
            </div>
          </div>

          <div className="card form-card">
            <h3 className="section-title">
              <span style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}><Truck size={18}/> Ship To</span>
              <label className="checkbox-label">
                <input type="checkbox" checked={sameAsBilling} onChange={(e) => setSameAsBilling(e.target.checked)} />
                Same as Bill To
              </label>
            </h3>
            
            {!sameAsBilling && (
              <div className="animate-slide-up">
                <div className="form-group">
                  <input type="text" placeholder="Delivery Name" className="form-input" value={shipTo.name} onChange={e => setShipTo({...shipTo, name: e.target.value})} />
                </div>
                <div className="form-group">
                  <input type="text" placeholder="Mobile Number" className="form-input" value={shipTo.mobile} onChange={e => setShipTo({...shipTo, mobile: e.target.value})} />
                </div>
                <div className="form-group">
                  <textarea placeholder="Delivery Address" className="form-input" rows="2" value={shipTo.address} onChange={e => setShipTo({...shipTo, address: e.target.value})}></textarea>
                </div>
              </div>
            )}
          </div>

          <div className="card form-card">
            <h3 className="section-title">Discount</h3>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label" style={{fontSize: '0.75rem'}}>Discount (%)</label>
                <input type="number" placeholder="e.g. 5" className="form-input" value={discountPercent} onChange={e => {setDiscountPercent(e.target.value); setDiscountFlat('');}} min="0" step="0.1" />
              </div>
              <div className="form-group">
                <label className="form-label" style={{fontSize: '0.75rem'}}>Flat Discount (₹)</label>
                <input type="number" placeholder="e.g. 100" className="form-input" value={discountFlat} onChange={e => {setDiscountFlat(e.target.value); setDiscountPercent('');}} min="0" />
              </div>
            </div>
          </div>

          <div className="card totals-card" style={{ marginBottom: '1.5rem' }}>
            {totals.discountAmount > 0 && (
              <div className="tot-row" style={{ color: 'var(--color-danger)' }}>
                <span>Discount Applied</span>
                <span>- ₹{totals.discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="tot-row grand-total">
              <span>Grand Total</span>
              <span>₹{totals.grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <div className="wizard-actions dual-actions">
            <button className="btn btn-secondary back-btn" onClick={() => setStep(1)}>
              <ArrowLeft size={18} /> Back
            </button>
            <div className="generate-actions">
              <button className="btn btn-danger skip-btn" onClick={() => handleGenerateInvoice(true)}>
                <FastForward size={18} /> Skip
              </button>
              <button className="btn btn-primary generate-btn" onClick={() => handleGenerateInvoice(false)}>
                <FileCheck size={18} /> Generate Bill
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Billing;
