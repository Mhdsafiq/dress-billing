import { useState, useEffect, useMemo } from 'react';
import { getInvoices, deleteInvoice } from '../db/db';
import { Search, FileText, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './History.css';

const History = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const loadInvoices = async () => {
    const data = await getInvoices();
    setInvoices(data);
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const handleDelete = async (e, id) => {
    e.stopPropagation(); // Prevent navigating to invoice preview
    if (window.confirm("Are you sure you want to delete this invoice? This action cannot be undone.")) {
      await deleteInvoice(id);
      setInvoices(prev => prev.filter(inv => inv.id !== id));
    }
  };

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      let matchesSearch = true;
      let matchesDate = true;

      if (search) {
        matchesSearch = inv.invoiceNo.toLowerCase().includes(search.toLowerCase());
      }

      if (fromDate || toDate) {
        const invDate = new Date(inv.date);
        invDate.setHours(0, 0, 0, 0);

        if (fromDate) {
          const fDate = new Date(fromDate);
          fDate.setHours(0, 0, 0, 0);
          if (invDate < fDate) matchesDate = false;
        }

        if (toDate) {
          const tDate = new Date(toDate);
          tDate.setHours(23, 59, 59, 999);
          if (invDate > tDate) matchesDate = false;
        }
      }

      return matchesSearch && matchesDate;
    });
  }, [invoices, search, fromDate, toDate]);

  const groupedInvoices = useMemo(() => {
    const groups = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    filteredInvoices.forEach(inv => {
      const invDate = new Date(inv.date);
      invDate.setHours(0, 0, 0, 0);
      
      let groupName = '';
      if (invDate.getTime() === today.getTime()) {
        groupName = 'Today';
      } else if (invDate.getTime() === yesterday.getTime()) {
        groupName = 'Yesterday';
      } else {
        const diffTime = Math.abs(today - invDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        if (diffDays <= 7) {
          groupName = invDate.toLocaleDateString('en-US', { weekday: 'long' });
        } else {
          groupName = invDate.toLocaleDateString('en-IN');
        }
      }

      if (!groups[groupName]) groups[groupName] = [];
      groups[groupName].push(inv);
    });

    return groups;
  }, [filteredInvoices]);

  // Keep order like Today, Yesterday, Days...
  const sortedGroupKeys = Object.keys(groupedInvoices).sort((a, b) => {
    if (a === 'Today') return -1;
    if (b === 'Today') return 1;
    if (a === 'Yesterday') return -1;
    if (b === 'Yesterday') return 1;
    return 0; // The actual date sort is already handled by the query returning newest first
  });

  return (
    <div className="container page-enter-active history-page">
      <h2 style={{ marginBottom: '1.5rem' }}>Invoice History</h2>

      <div className="card filter-card animate-slide-up">
        <div className="search-wrapper">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search by Bill Number..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="form-input search-input"
          />
        </div>
        
        <div className="date-filters">
          <div className="form-group">
            <label className="form-label" style={{fontSize: '0.75rem'}}>From Date</label>
            <input 
              type="date" 
              className="form-input" 
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label" style={{fontSize: '0.75rem'}}>To Date</label>
            <input 
              type="date" 
              className="form-input" 
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="history-list">
        {sortedGroupKeys.map(group => (
          <div key={group} className="history-group animate-slide-up">
            <h3 className="group-title">{group}</h3>
            <div className="group-items">
              {groupedInvoices[group].map(inv => (
                <div key={inv.id} className="card invoice-card" onClick={() => navigate(`/invoice/${inv.id}`)}>
                  <div className="inv-info">
                    <div className="inv-no">#{inv.invoiceNo}</div>
                    <div className="inv-customer">{inv.billTo.name || 'CASH'}</div>
                  </div>
                  <div className="inv-amount">
                    <div className="total">₹{inv.totals.grandTotal?.toFixed(2) || '0.00'}</div>
                    <div className="date">{new Date(inv.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                  </div>
                  <button 
                    className="btn-icon" 
                    onClick={(e) => handleDelete(e, inv.id)} 
                    style={{ color: 'var(--color-danger)', marginLeft: '1rem' }}
                    title="Delete Invoice"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
        {sortedGroupKeys.length === 0 && (
          <div className="empty-state">
            <FileText size={48} style={{ opacity: 0.2, margin: '0 auto 1rem' }} />
            <p>No invoices found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
