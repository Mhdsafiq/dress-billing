import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { invoicesDB, getSettings } from '../db/db';
import { Printer, Download, ArrowLeft } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { numberToWords } from '../utils/numberToWords';
import './InvoicePreview.css';

const InvoicePreview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      const inv = await invoicesDB.getItem(id);
      const set = await getSettings();
      setInvoice(inv);
      setSettings(set);
    };
    loadData();
  }, [id]);

  if (!invoice || !settings) return <div className="container">Loading Invoice...</div>;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    const element = document.getElementById('invoice-content');
    const opt = {
      margin:       0.2,
      filename:     `Invoice_${invoice.invoiceNo}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };

  const invoiceDate = new Date(invoice.date).toLocaleDateString('en-GB');
  const dueDate = new Date(invoice.date + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB');

  return (
    <div className="invoice-preview-container page-enter-active">
      <div className="invoice-actions no-print">
        <button className="btn btn-secondary" onClick={() => navigate('/')}>
          <ArrowLeft size={18} /> Back
        </button>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={handlePrint}>
            <Printer size={18} /> Print
          </button>
          <button className="btn btn-primary" onClick={handleDownloadPDF}>
            <Download size={18} /> PDF
          </button>
        </div>
      </div>

      <div className="invoice-paper" id="invoice-content">
        {/* Header */}
        <div className="inv-header">
          <div className="inv-logo">
            {settings.logoUrl ? <img src={settings.logoUrl} alt="Logo" /> : <div className="placeholder-logo">LOGO</div>}
          </div>
          <div className="inv-company-details">
            <h1 className="company-name">{settings.shopName}</h1>
            <p className="tagline">{settings.tagline}</p>
            <p className="reg-info">
              {settings.panNumber && <span>Pan No {settings.panNumber}</span>}
              {settings.gstin && <span> GSTIN {settings.gstin}</span>}
            </p>
            <p className="contact-info">
              {settings.mobile && <span>📞 {settings.mobile}</span>}
              {settings.email && <span> ✉️ {settings.email}</span>}
            </p>
            <p className="address-info">📍 {settings.address}</p>
          </div>
          <div className="inv-title-box">
            <h2>TAX INVOICE</h2>
            <div className="original-badge">ORIGINAL FOR RECIPIENT</div>
          </div>
        </div>

        {/* Invoice Meta */}
        <div className="inv-meta">
          <div>
            <strong>Invoice No:</strong> #{invoice.invoiceNo}
          </div>
          <div>
            <strong>Date:</strong> {new Date(invoice.date).toLocaleDateString('en-IN')}
          </div>
          <div>
            <strong>Due Date</strong><br/>
            {dueDate}
          </div>
        </div>

        {/* Addresses */}
        <div className="inv-addresses">
          <div className="address-box">
            <div className="box-title">Bill To</div>
            <strong>{invoice.billTo.name}</strong>
            <p>{invoice.billTo.address}</p>
            <p>Mobile: {invoice.billTo.mobile}</p>
            {invoice.billTo.gstin && <p>GSTIN: {invoice.billTo.gstin}</p>}
            <p>Place of Supply: {invoice.billTo.placeOfSupply}</p>
          </div>
          <div className="address-box">
            <div className="box-title">Ship To</div>
            <strong>{invoice.shipTo.name}</strong>
            <p>{invoice.shipTo.address}</p>
            <p>Mobile: {invoice.shipTo.mobile}</p>
          </div>
        </div>

        {/* Table */}
        <div className="inv-table-wrapper">
          <table className="inv-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Items</th>
                <th>Qty.</th>
                <th>Rate</th>
                <th>Tax</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, idx) => (
                <tr key={idx}>
                  <td>{idx + 1}</td>
                  <td>{item.name}</td>
                  <td>{item.qty} {item.unit}</td>
                  <td>{item.rate}</td>
                  <td>
                    {((item.rate * item.qty * item.tax) / 100).toFixed(2)}
                    <br/><span className="tax-percent">({item.tax}%)</span>
                  </td>
                  <td>{(item.rate * item.qty).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="2" className="text-right font-bold">SUBTOTAL</td>
                <td>{invoice.items.reduce((acc, item) => acc + item.qty, 0)}</td>
                <td></td>
                <td></td>
                <td className="font-bold">₹{invoice.totals.subtotal.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Calculation Summary */}
        <div className="inv-summary-wrapper">
          <div className="spacer"></div>
          <div className="inv-calc">
            <div className="calc-row">
              <span>Taxable Amount</span>
              <span>₹{invoice.totals.subtotal.toFixed(2)}</span>
            </div>
            <div className="calc-row">
              <span>CGST</span>
              <span>₹{invoice.totals.cgst.toFixed(2)}</span>
            </div>
            <div className="calc-row">
              <span>SGST</span>
              <span>₹{invoice.totals.sgst.toFixed(2)}</span>
            </div>
            <div className="calc-row grand-total-row">
              <span>Total Amount</span>
              <span>₹{invoice.totals.grandTotal.toFixed(2)}</span>
            </div>
            
            <div className="amount-in-words">
              <strong>Total Amount (in words)</strong><br/>
              {numberToWords(Math.round(invoice.totals.grandTotal))}
            </div>

            <div className="signature-box">
              {settings.signatureUrl && <img src={settings.signatureUrl} alt="Signature" />}
              <div className="sig-line">Signature</div>
              <div className="sig-name">{settings.shopName}</div>
            </div>
          </div>
        </div>

        <div className="inv-footer">
          Invoice created using <strong>Billing Software</strong>
        </div>
      </div>
    </div>
  );
};

export default InvoicePreview;
