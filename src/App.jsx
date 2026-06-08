import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { FileText, PlusSquare, Package, Settings as SettingsIcon, CloudSync, Clock } from 'lucide-react';
import { performSync } from './db/db';
import Billing from './pages/Billing';
import Register from './pages/Register';
import Stock from './pages/Stock';
import Settings from './pages/Settings';
import History from './pages/History';
import InvoicePreview from './pages/InvoicePreview';
import './App.css';

const App = () => {
  const [syncStatus, setSyncStatus] = useState('');

  useEffect(() => {
    // Perform initial sync when app loads
    const initSync = async () => {
      setSyncStatus('Syncing...');
      const res = await performSync();
      setSyncStatus(res.success ? 'Synced' : 'Sync Failed');
      setTimeout(() => setSyncStatus(''), 3000);
    };
    initSync();
  }, []);

  return (
    <Router>
      <div className="app-container">
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Billing />} />
            <Route path="/register" element={<Register />} />
            <Route path="/stock" element={<Stock />} />
            <Route path="/history" element={<History />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/invoice/:id" element={<InvoicePreview />} />
          </Routes>
        </main>

        <nav className="bottom-nav no-print">
          <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <FileText size={24} />
            <span>Billing</span>
          </NavLink>
          <NavLink to="/register" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <PlusSquare size={24} />
            <span>Registered</span>
          </NavLink>
          <NavLink to="/stock" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Package size={24} />
            <span>Stock</span>
          </NavLink>
          <NavLink to="/history" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Clock size={24} />
            <span>History</span>
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <SettingsIcon size={24} />
            <span>Settings</span>
          </NavLink>
        </nav>
        {syncStatus && (
          <div style={{ position: 'fixed', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.7)', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', zIndex: 9999, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <CloudSync size={12} /> {syncStatus}
          </div>
        )}
      </div>
    </Router>
  );
}

export default App;
