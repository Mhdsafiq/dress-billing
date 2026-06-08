import localforage from 'localforage';
import { supabase } from './supabase';

// LocalForage Instances
export const productsDB = localforage.createInstance({ name: 'DressBillingDB', storeName: 'products' });
export const stockDB = localforage.createInstance({ name: 'DressBillingDB', storeName: 'stock_history' });
export const settingsDB = localforage.createInstance({ name: 'DressBillingDB', storeName: 'settings' });
export const invoicesDB = localforage.createInstance({ name: 'DressBillingDB', storeName: 'invoices' });

// ==========================================
// PUSH TO SUPABASE (Online Sync)
// ==========================================
const pushToSupabase = async (table, data) => {
  if (navigator.onLine) {
    try {
      await supabase.from(table).upsert(data);
    } catch (err) {
      console.error(`Error syncing ${table} to Supabase:`, err);
    }
  }
};

// ==========================================
// FULL SYNC LOGIC (Pull & Push everything)
// ==========================================
export const performSync = async () => {
  if (!navigator.onLine) return { success: false, message: 'No internet connection' };

  try {
    // 1. Pull Products
    const { data: serverProducts } = await supabase.from('products').select('*');
    if (serverProducts) {
      for (const p of serverProducts) await productsDB.setItem(p.id, p);
    }
    // 2. Push Local Products
    const localProducts = await getProducts();
    if (localProducts.length > 0) await supabase.from('products').upsert(localProducts);

    // 1. Pull Settings
    const { data: serverSettings } = await supabase.from('settings').select('*');
    if (serverSettings && serverSettings.length > 0) {
      await settingsDB.setItem('shop_settings', serverSettings[0]);
    } else {
      // 2. Push Local Settings if exist
      const localSettings = await getSettings();
      await supabase.from('settings').upsert({ id: 'shop_settings', ...localSettings });
    }

    // 1. Pull Invoices
    const { data: serverInvoices } = await supabase.from('invoices').select('*');
    if (serverInvoices) {
      for (const inv of serverInvoices) await invoicesDB.setItem(inv.id, inv);
    }
    // 2. Push Local Invoices
    const localInvoices = await getInvoices();
    if (localInvoices.length > 0) await supabase.from('invoices').upsert(localInvoices);

    return { success: true, message: 'Cloud sync successful' };
  } catch (error) {
    console.error('Sync failed:', error);
    return { success: false, message: 'Sync failed: ' + error.message };
  }
};

// ==========================================
// LOCAL OPERATIONS (With auto-push)
// ==========================================

export const getProducts = async () => {
  const products = [];
  await productsDB.iterate((value, key) => {
    products.push({ ...value, id: key });
  });
  return products;
};

export const saveProduct = async (product) => {
  const id = product.id || Date.now().toString();
  const finalProduct = { ...product, id };
  await productsDB.setItem(id, finalProduct);
  pushToSupabase('products', finalProduct); // Background sync
  return id;
};

export const deleteProduct = async (id) => {
  await productsDB.removeItem(id);
  if (navigator.onLine) {
    supabase.from('products').delete().eq('id', id).catch(err => {
      console.error('Error deleting product from Supabase:', err);
    });
  }
};

export const getSettings = async () => {
  const defaultSettings = {
    shopName: 'SUSEE FASHIONS',
    tagline: 'So, you look different',
    panNumber: '',
    gstin: '',
    mobile: '',
    email: '',
    address: '',
    logoUrl: null,
    signatureUrl: null
  };
  const settings = await settingsDB.getItem('shop_settings');
  return settings || defaultSettings;
};

export const saveSettings = async (settings) => {
  await settingsDB.setItem('shop_settings', settings);
  pushToSupabase('settings', { id: 'shop_settings', ...settings }); // Background sync
};

export const saveInvoice = async (invoice) => {
  const id = invoice.invoiceNo || Date.now().toString();
  const finalInvoice = { ...invoice, id };
  await invoicesDB.setItem(id, finalInvoice);
  pushToSupabase('invoices', finalInvoice); // Background sync
  return id;
};

export const getInvoices = async () => {
  const invoices = [];
  await invoicesDB.iterate((value) => {
    invoices.push(value);
  });
  return invoices.sort((a, b) => b.date - a.date);
};

export const deleteInvoice = async (id) => {
  await invoicesDB.removeItem(id);
  if (navigator.onLine) {
    supabase.from('invoices').delete().eq('id', id).catch(err => {
      console.error('Error deleting invoice from Supabase:', err);
    });
  }
};

export const getNextInvoiceNo = async () => {
  const invoices = await getInvoices();
  const nums = invoices.map(inv => parseInt(inv.invoiceNo, 10)).filter(n => !isNaN(n));
  
  let nextNo = 1;
  const numSet = new Set(nums);
  while (numSet.has(nextNo)) {
    nextNo++;
  }
  
  return nextNo.toString();
};

export const addStockHistory = async (productId, quantity, type = 'ADD') => {
  const id = Date.now().toString();
  const record = { id, productId, quantity, type, date: new Date().getTime() };
  await stockDB.setItem(id, record);
  pushToSupabase('stock_history', record); // Background sync
  return record;
};

export const getStockForProduct = async (productId) => {
  let totalStock = 0;
  await stockDB.iterate((value) => {
    if (value.productId === productId) {
      totalStock += (value.type === 'ADD' ? value.quantity : -value.quantity);
    }
  });
  return totalStock;
};
