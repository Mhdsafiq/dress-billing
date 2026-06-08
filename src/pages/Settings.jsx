import { useState, useEffect } from 'react';
import { getSettings, saveSettings } from '../db/db';
import { Upload, Save, X } from 'lucide-react';
import './Settings.css';

const Settings = () => {
  const [settings, setSettings] = useState({
    shopName: '',
    tagline: '',
    panNumber: '',
    gstin: '',
    mobile: '',
    email: '',
    address: '',
    logoUrl: null,
    signatureUrl: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      const data = await getSettings();
      setSettings(data);
      setLoading(false);
    };
    loadSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings(prev => ({ ...prev, [field]: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    await saveSettings(settings);
    alert('Settings saved successfully!');
  };

  if (loading) return <div className="container">Loading...</div>;

  return (
    <div className="container page-enter-active">
      <h2 style={{ marginBottom: '1.5rem' }}>Business Settings</h2>
      
      <form onSubmit={handleSave} className="card">
        <div className="form-group image-upload-group">
            <div className="form-group">
              <label className="form-label">Shop Logo</label>
              <div className="image-upload-wrapper" style={{ position: 'relative' }}>
                {settings.logoUrl ? (
                  <>
                    <img src={settings.logoUrl} alt="Logo" className="preview-image" />
                    <button type="button" onClick={() => setSettings({...settings, logoUrl: null})} style={{ position: 'absolute', top: '-8px', right: '-8px', background: 'var(--color-danger)', color: 'white', border: 'none', borderRadius: '50%', padding: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <X size={14} />
                    </button>
                  </>
                ) : (
                  <>
                    <div className="upload-placeholder">
                      <Upload size={24} />
                      <span>Upload Logo</span>
                    </div>
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'logoUrl')} className="file-input" />
                  </>
                )}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Signature</label>
              <div className="image-upload-wrapper" style={{ position: 'relative' }}>
                {settings.signatureUrl ? (
                  <>
                    <img src={settings.signatureUrl} alt="Signature" className="preview-image" />
                    <button type="button" onClick={() => setSettings({...settings, signatureUrl: null})} style={{ position: 'absolute', top: '-8px', right: '-8px', background: 'var(--color-danger)', color: 'white', border: 'none', borderRadius: '50%', padding: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <X size={14} />
                    </button>
                  </>
                ) : (
                  <>
                    <div className="upload-placeholder">
                      <Upload size={24} />
                      <span>Upload Signature</span>
                    </div>
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'signatureUrl')} className="file-input" />
                  </>
                )}
              </div>
            </div>
        </div>

        <div className="form-group">
          <label className="form-label">Shop Name</label>
          <input type="text" name="shopName" value={settings.shopName} onChange={handleChange} className="form-input" required />
        </div>

        <div className="form-group">
          <label className="form-label">Tagline</label>
          <input type="text" name="tagline" value={settings.tagline} onChange={handleChange} className="form-input" />
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">PAN Number</label>
            <input type="text" name="panNumber" value={settings.panNumber} onChange={handleChange} className="form-input" />
          </div>
          <div className="form-group">
            <label className="form-label">GSTIN Number</label>
            <input type="text" name="gstin" value={settings.gstin} onChange={handleChange} className="form-input" />
          </div>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Mobile Number</label>
            <input type="text" name="mobile" value={settings.mobile} onChange={handleChange} className="form-input" />
          </div>
          <div className="form-group">
            <label className="form-label">Email ID</label>
            <input type="email" name="email" value={settings.email} onChange={handleChange} className="form-input" />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Shop Address</label>
          <textarea name="address" value={settings.address} onChange={handleChange} className="form-input" rows="3"></textarea>
        </div>

        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
          <Save size={18} /> Save Settings
        </button>
      </form>
    </div>
  );
};

export default Settings;
