'use client';

import React, { useState, useEffect, useMemo, Component } from 'react';
import Link from 'next/link';
import { db, auth } from '@/lib/firebase';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  runTransaction,
} from 'firebase/firestore';
import { toast } from 'sonner';
import {
  Plus,
  Minus,
  Search,
  ShoppingCart,
  ShoppingBag,
  Trash2,
  Package,
  History,
  Loader2,
  X,
  Edit2,
  AlertCircle,
  Boxes,
  Wallet,
  TrendingUp,
  CalendarClock,
  Receipt,
  Copy,
  Check,
  UserCircle2,
  Tag,
  BadgePercent,
  PackagePlus,
  Warehouse,
  Info,
  AlertTriangle,
} from 'lucide-react';

const CATEGORIES = ['All', 'General', 'Paper', 'Pen & Pencil', 'Accessories', 'Books'];
const CUSTOM_CATEGORY_VALUE = '__custom__';
const PRODUCTS_COLLECTION = 'stationery_products';
const SALES_COLLECTION = 'stationery_sales';
const STOCK_LOGS_COLLECTION = 'stationery_stock_logs';

// ── Helper: একটি sale আজকের কিনা চেক করে (createdAt পেন্ডিং হলে বর্তমান সময় ধরা হয়) ──
const isSaleToday = (sale) => {
  const saleDate = sale.createdAt?.toDate ? sale.createdAt.toDate() : new Date();
  return saleDate.toDateString() === new Date().toDateString();
};

const generateInvoiceId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `INV-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
};

// ── Helper: নিরাপদ নাম্বার (NaN হলে fallback) ──
const safeNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

// ── Helper: ইনপুট থেকে ঋণাত্মক চিহ্ন সরানো (নেগেটিভ ভ্যালু ঠেকাতে) ──
const sanitizeNonNegativeInput = (raw) => raw.replace(/-/g, '');

// ── Helper: ওয়েটেড এভারেজ কস্ট হিসাব ──
const calcWeightedAvgCost = (currentStock, currentCost, addQty, newCost) => {
  const totalQty = currentStock + addQty;
  if (totalQty <= 0) return newCost;
  return (currentStock * currentCost + addQty * newCost) / totalQty;
};

// ── Helper: Clipboard কপি + fallback (non-HTTPS/পুরনো ব্রাউজার) ──
const copyToClipboard = async (text) => {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return true;
  }
  // Fallback: হিডেন টেক্সটএরিয়া + execCommand
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  let success = false;
  try {
    success = document.execCommand('copy');
  } catch (err) {
    success = false;
  }
  document.body.removeChild(textarea);
  if (!success) throw new Error('Copy failed');
  return true;
};

const colorMap = {
  indigo: 'bg-indigo-50 border-indigo-100 text-indigo-600',
  blue: 'bg-blue-50 border-blue-100 text-blue-600',
  purple: 'bg-purple-50 border-purple-100 text-purple-600',
  emerald: 'bg-emerald-50 border-emerald-100 text-emerald-600',
  teal: 'bg-teal-50 border-teal-100 text-teal-600',
  amber: 'bg-amber-50 border-amber-100 text-amber-600',
  rose: 'bg-rose-50 border-rose-100 text-rose-600',
};
const valueColorMap = {
  indigo: 'text-indigo-900',
  blue: 'text-blue-900',
  purple: 'text-purple-900',
  emerald: 'text-emerald-900',
  teal: 'text-teal-900',
  amber: 'text-amber-900',
  rose: 'text-rose-900',
};

// ══════════════ ── Error Boundary (crash হলে blank screen ঠেকাবে) ── ══════════════
class InventoryErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, info) {
    console.error('AdminSchoolStationary crashed:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 max-w-lg mx-auto mt-12 bg-white border border-red-100 rounded-2xl shadow-sm text-center space-y-3">
          <AlertTriangle className="w-10 h-10 text-red-500 mx-auto" />
          <h2 className="text-lg font-bold text-gray-800">কিছু একটা ভুল হয়েছে</h2>
          <p className="text-sm text-gray-500">
            পেজটি লোড করতে সমস্যা হয়েছে। দয়া করে পেজ রিফ্রেশ করুন।
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
          >
            রিফ্রেশ করুন
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Skeleton Loader ──
const InventorySkeleton = () => (
  <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 animate-pulse">
    <div className="h-24 bg-gray-200/70 rounded-2xl" />
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="h-20 bg-gray-200/70 rounded-xl" />
      ))}
    </div>
    <div className="h-64 bg-gray-200/70 rounded-2xl" />
  </div>
);

const AdminSchoolStationaryInner = () => {
  const [products, setProducts] = useState([]);
  const [salesHistory, setSalesHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter & Modal States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Product Form States
  const [formData, setFormData] = useState({
    name: '',
    category: 'General',
    customCategory: '',
    price: '',
    costPrice: '',
    stock: '',
  });

  // ── Cart States ──
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartDiscount, setCartDiscount] = useState('');
  const [cartCustomerName, setCartCustomerName] = useState('');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [cartInvoice, setCartInvoice] = useState(null);
  const [cartCopied, setCartCopied] = useState(false);

  // ── Restock States ──
  const [restockModalOpen, setRestockModalOpen] = useState(false);
  const [restockProduct, setRestockProduct] = useState(null);
  const [restockQty, setRestockQty] = useState('');
  const [restockNewCostPrice, setRestockNewCostPrice] = useState('');
  const [restockNewSellPrice, setRestockNewSellPrice] = useState('');
  const [isRestocking, setIsRestocking] = useState(false);

  // 1. Fetch Realtime Data
  useEffect(() => {
    const qProducts = query(collection(db, PRODUCTS_COLLECTION), orderBy('createdAt', 'desc'));
    const unsubProducts = onSnapshot(
      qProducts,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setProducts(items);
        setLoading(false);
      },
      (error) => {
        console.error('Products Fetch Error:', error);
        toast.error('পণ্য লোড করতে ব্যর্থ হয়েছে!');
        setLoading(false);
      }
    );

    const qSales = query(collection(db, SALES_COLLECTION), orderBy('createdAt', 'desc'));
    const unsubSales = onSnapshot(
      qSales,
      (snapshot) => {
        const sales = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setSalesHistory(sales);
      },
      (error) => {
        console.error('Sales Fetch Error:', error);
      }
    );

    return () => {
      unsubProducts();
      unsubSales();
    };
  }, []);

  // ── স্টকের সাথে কার্ট সিঙ্ক (কার্ট খালি থাকলে skip — পারফরম্যান্স ফিক্স) ──
  useEffect(() => {
    setCart((prevCart) => {
      if (prevCart.length === 0) return prevCart;
      return prevCart
        .map((item) => {
          const liveProduct = products.find((p) => p.id === item.productId);
          if (!liveProduct) return null;
          return {
            ...item,
            price: liveProduct.price,
            costPrice: liveProduct.costPrice,
            stock: liveProduct.stock,
            qty: Math.min(item.qty, liveProduct.stock),
          };
        })
        .filter((item) => item && item.qty > 0);
    });
  }, [products]);

  // ── Open Modal for Create or Edit ──
  const handleOpenModal = (product = null) => {
    if (product) {
      const isKnownCategory = CATEGORIES.includes(product.category);
      setEditingProduct(product);
      setFormData({
        name: product.name,
        category: isKnownCategory ? product.category || 'General' : CUSTOM_CATEGORY_VALUE,
        customCategory: isKnownCategory ? '' : product.category || '',
        price: product.price,
        costPrice: product.costPrice ?? '',
        stock: product.stock,
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        category: 'General',
        customCategory: '',
        price: '',
        costPrice: '',
        stock: '',
      });
    }
    setIsAddModalOpen(true);
  };

  // 2. Add or Edit Product
  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    const { name, category, customCategory, price, costPrice, stock } = formData;

    const finalCategory = category === CUSTOM_CATEGORY_VALUE ? customCategory.trim() : category;
    const trimmedName = name.trim();

    if (!trimmedName || price === '' || (!editingProduct && stock === '')) {
      toast.warning('সবগুলো ফিল্ড সঠিকভাবে পূরণ করুন!');
      return;
    }
    if (category === CUSTOM_CATEGORY_VALUE && !finalCategory) {
      toast.warning('কাস্টম ক্যাটাগরির নাম লিখুন!');
      return;
    }
    if (safeNumber(price) < 0 || safeNumber(costPrice) < 0) {
      toast.warning('দাম ঋণাত্মক (negative) হতে পারবে না!');
      return;
    }

    // ── ডুপ্লিকেট পণ্য চেক (শুধু নতুন পণ্য তৈরির সময়) ──
    if (!editingProduct) {
      const duplicate = products.find(
        (p) => p.name.trim().toLowerCase() === trimmedName.toLowerCase()
      );
      if (duplicate) {
        const confirmed = confirm(
          `"${trimmedName}" নামে ইতিমধ্যে একটি পণ্য আছে (স্টক: ${duplicate.stock} টি)। আপনি কি সত্যিই আলাদা একটি নতুন এন্ট্রি হিসেবে যোগ করতে চান? (নাহলে বাতিল করে "স্টক যোগ করুন" ব্যবহার করুন)`
        );
        if (!confirmed) return;
      }
    }

    const toastId = toast.loading(
      editingProduct ? 'পণ্য আপডেট করা হচ্ছে...' : 'নতুন পণ্য সেভ করা হচ্ছে...'
    );

    try {
      if (editingProduct) {
        // ── এডিট মোডে stock পরিবর্তন করা হয় না — শুধু "স্টক যোগ করুন" দিয়েই stock বদলাবে, নাহলে weighted-avg cost হিসাব ভেঙে যায় ──
        const payload = {
          name: trimmedName,
          category: finalCategory || 'General',
          price: safeNumber(price),
          costPrice: costPrice === '' ? 0 : safeNumber(costPrice),
        };
        const productRef = doc(db, PRODUCTS_COLLECTION, editingProduct.id);
        await updateDoc(productRef, { ...payload, updatedAt: serverTimestamp() });
        toast.success('পণ্য সফলভাবে আপডেট হয়েছে!', { id: toastId });
      } else {
        const payload = {
          name: trimmedName,
          category: finalCategory || 'General',
          price: safeNumber(price),
          costPrice: costPrice === '' ? 0 : safeNumber(costPrice),
          stock: safeNumber(stock),
        };
        await addDoc(collection(db, PRODUCTS_COLLECTION), {
          ...payload,
          createdAt: serverTimestamp(),
        });
        toast.success('নতুন পণ্য ইনভেন্টরিতে সেভ হয়েছে!', { id: toastId });
      }

      setIsAddModalOpen(false);
      setFormData({ name: '', category: 'General', customCategory: '', price: '', costPrice: '', stock: '' });
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('পণ্য সেভ করতে সমস্যা হয়েছে!', { id: toastId });
    }
  };

  // 3. Delete Product
  const handleDeleteProduct = async (id, name) => {
    if (!confirm(`আপনি কি নিশ্চিত যে "${name}" পণ্যটি ডিলিট করতে চান?`)) return;

    const toastId = toast.loading('পণ্য মোছা হচ্ছে...');
    try {
      await deleteDoc(doc(db, PRODUCTS_COLLECTION, id));
      toast.success('পণ্যটি সফলভাবে মুছে ফেলা হয়েছে', { id: toastId });
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('পণ্য ডিলিট করতে সমস্যা হয়েছে!', { id: toastId });
    }
  };

  // ══════════════ ── স্টক যোগ করুন (Restock) ── ══════════════

  const openRestockModal = (product) => {
    setRestockProduct(product);
    setRestockQty('');
    setRestockNewCostPrice('');
    setRestockNewSellPrice('');
    setRestockModalOpen(true);
  };

  const closeRestockModal = () => {
    setRestockModalOpen(false);
    setRestockProduct(null);
    setRestockQty('');
    setRestockNewCostPrice('');
    setRestockNewSellPrice('');
  };

  // ── লাইভ প্রিভিউ (safeNumber দিয়ে NaN প্রতিরোধ) ──
  const restockPreview = useMemo(() => {
    if (!restockProduct) return null;
    const currentStock = safeNumber(restockProduct.stock);
    const currentCost = safeNumber(restockProduct.costPrice);
    const addQty = safeNumber(restockQty);
    const newCost = restockNewCostPrice === '' ? currentCost : safeNumber(restockNewCostPrice, currentCost);
    const weightedAvgCost = calcWeightedAvgCost(currentStock, currentCost, addQty, newCost);

    return {
      currentStock,
      currentCost,
      addQty,
      newCost,
      newTotalStock: currentStock + addQty,
      weightedAvgCost: Math.round(weightedAvgCost * 100) / 100,
    };
  }, [restockProduct, restockQty, restockNewCostPrice]);

  const handleConfirmRestock = async () => {
    if (!restockProduct) return;
    const addQty = safeNumber(restockQty);

    if (!addQty || addQty <= 0) {
      toast.warning('স্টকে যোগ করার সঠিক পরিমাণ লিখুন!');
      return;
    }

    setIsRestocking(true);
    const toastId = toast.loading('স্টক যোগ করা হচ্ছে...');

    try {
      const productRef = doc(db, PRODUCTS_COLLECTION, restockProduct.id);
      let logPayload = null;

      await runTransaction(db, async (transaction) => {
        const productDoc = await transaction.get(productRef);
        if (!productDoc.exists()) {
          throw new Error('পণ্যটি ডাটাবেজে পাওয়া যায়নি!');
        }

        const data = productDoc.data();
        const currentStock = safeNumber(data.stock);
        const currentCost = safeNumber(data.costPrice);
        const currentSellPrice = safeNumber(data.price);

        const newCost = restockNewCostPrice === '' ? currentCost : safeNumber(restockNewCostPrice, currentCost);
        const newSellPrice =
          restockNewSellPrice === '' ? currentSellPrice : safeNumber(restockNewSellPrice, currentSellPrice);

        const weightedAvgCost = calcWeightedAvgCost(currentStock, currentCost, addQty, newCost);
        const newTotalStock = currentStock + addQty;

        transaction.update(productRef, {
          stock: newTotalStock,
          costPrice: Math.round(weightedAvgCost * 100) / 100,
          price: newSellPrice,
          updatedAt: serverTimestamp(),
        });

        logPayload = {
          productId: restockProduct.id,
          productName: restockProduct.name,
          addedQty: addQty,
          previousStock: currentStock,
          newStock: newTotalStock,
          previousCostPrice: currentCost,
          incomingCostPrice: newCost,
          weightedAvgCostAfter: Math.round(weightedAvgCost * 100) / 100,
          previousSellPrice: currentSellPrice,
          newSellPrice,
          performedBy: auth?.currentUser?.email || auth?.currentUser?.uid || 'unknown',
          createdAt: serverTimestamp(),
        };
      });

      if (logPayload) {
        await addDoc(collection(db, STOCK_LOGS_COLLECTION), logPayload);
      }

      toast.success(`${restockProduct.name} এ ${addQty} টি স্টক যোগ হয়েছে!`, { id: toastId });
      closeRestockModal();
    } catch (error) {
      console.error('Error restocking product:', error);
      toast.error(error.message || 'স্টক যোগ করতে ব্যর্থ হয়েছে!', { id: toastId });
    } finally {
      setIsRestocking(false);
    }
  };

  // ══════════════ ── Cart ── ══════════════

  const addToCart = (product) => {
    if (product.stock <= 0) {
      toast.warning('এই পণ্যটি স্টকে নেই!');
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        if (existing.qty >= product.stock) {
          toast.warning('স্টকে আর পণ্য নেই!');
          return prev;
        }
        return prev.map((item) =>
          item.productId === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          price: safeNumber(product.price),
          costPrice: safeNumber(product.costPrice),
          stock: product.stock,
          qty: 1,
        },
      ];
    });

    toast.success(`${product.name} কার্টে যোগ হয়েছে!`);
  };

  const updateCartQty = (productId, newQty) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.productId !== productId) return item;
          const clamped = Math.max(0, Math.min(newQty, item.stock));
          return { ...item, qty: clamped };
        })
        .filter((item) => item.qty > 0)
    );
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setCartDiscount('');
    setCartCustomerName('');
    setCartInvoice(null);
    setCartCopied(false);
  };

  const openCart = () => {
    setCartInvoice(null);
    setCartCopied(false);
    setIsCartOpen(true);
  };

  const closeCart = () => setIsCartOpen(false);

  const cartItemCount = useMemo(() => cart.reduce((acc, item) => acc + item.qty, 0), [cart]);

  const cartTotals = useMemo(() => {
    const subtotal = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
    const discountValue = Math.min(safeNumber(cartDiscount), subtotal > 0 ? subtotal : 0);
    const grandTotal = Math.max(subtotal - discountValue, 0);
    const grossProfit = cart.reduce((acc, item) => acc + (item.price - item.costPrice) * item.qty, 0);
    const netProfit = grossProfit - discountValue;
    return { subtotal, discountValue, grandTotal, netProfit };
  }, [cart, cartDiscount]);

  const { subtotal: cartSubtotal, discountValue: cartDiscountValue, grandTotal: cartGrandTotal, netProfit: cartNetProfit } =
    cartTotals;

  // 4. Checkout
  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.warning('কার্ট খালি! আগে পণ্য যোগ করুন।');
      return;
    }

    const discount = Math.max(safeNumber(cartDiscount), 0);
    if (discount > cartSubtotal) {
      toast.warning('ছাড়ের পরিমাণ মোট মূল্যের চেয়ে বেশি হতে পারবে না!');
      return;
    }

    setIsCheckingOut(true);
    const toastId = toast.loading('বিক্রি প্রসেস করা হচ্ছে...');

    try {
      const finalCustomerName = cartCustomerName.trim() || 'সাধারণ গ্রাহক';
      const saleDateLabel = new Date().toLocaleString('bn-BD', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
      const invoiceId = generateInvoiceId();
      const invoiceItems = [];

      await runTransaction(db, async (transaction) => {
        const productSnapshots = await Promise.all(
          cart.map((item) => transaction.get(doc(db, PRODUCTS_COLLECTION, item.productId)))
        );

        productSnapshots.forEach((snap, idx) => {
          const cartItem = cart[idx];
          if (!snap.exists()) {
            throw new Error(`"${cartItem.name}" পণ্যটি ডাটাবেজে পাওয়া যায়নি!`);
          }
          const currentStock = snap.data().stock || 0;
          if (currentStock < cartItem.qty) {
            throw new Error(`"${cartItem.name}" এর জন্য পর্যাপ্ত স্টক নেই!`);
          }
        });

        cart.forEach((cartItem, idx) => {
          const snap = productSnapshots[idx];
          const currentStock = snap.data().stock || 0;
          const productRef = doc(db, PRODUCTS_COLLECTION, cartItem.productId);
          transaction.update(productRef, { stock: currentStock - cartItem.qty });

          const unitPrice = cartItem.price;
          const unitCost = cartItem.costPrice || 0;
          const itemSubtotal = unitPrice * cartItem.qty;
          const itemDiscountShare = cartSubtotal > 0 ? (itemSubtotal / cartSubtotal) * discount : 0;
          const itemTotalPrice = itemSubtotal - itemDiscountShare;
          const itemProfit = (unitPrice - unitCost) * cartItem.qty - itemDiscountShare;

          const newSaleRef = doc(collection(db, SALES_COLLECTION));
          transaction.set(newSaleRef, {
            invoiceId,
            productId: cartItem.productId,
            productName: cartItem.name,
            customerName: finalCustomerName,
            qty: cartItem.qty,
            unitPrice,
            subtotal: itemSubtotal,
            discount: Math.round(itemDiscountShare * 100) / 100,
            totalPrice: Math.round(itemTotalPrice * 100) / 100,
            profit: Math.round(itemProfit * 100) / 100,
            date: saleDateLabel,
            createdAt: serverTimestamp(),
          });

          invoiceItems.push({
            name: cartItem.name,
            qty: cartItem.qty,
            unitPrice,
            total: Math.round(itemTotalPrice * 100) / 100,
          });
        });
      });

      toast.success(`${cart.length} ধরনের পণ্য বিক্রি সম্পন্ন হয়েছে!`, { id: toastId });

      setCartInvoice({
        invoiceId,
        customerName: finalCustomerName,
        date: saleDateLabel,
        items: invoiceItems,
        subtotal: cartSubtotal,
        discount,
        grandTotal: cartGrandTotal,
      });

      setCart([]);
    } catch (error) {
      console.error('Error checking out:', error);
      toast.error(error.message || 'বিক্রি আপডেট করতে ব্যর্থ হয়েছে!', { id: toastId });
    } finally {
      setIsCheckingOut(false);
    }
  };

  const buildCartInvoiceText = () => {
    if (!cartInvoice) return '';
    const lines = [
      '🧾 বিক্রয় ইনভয়েস',
      '━━━━━━━━━━━━━━━━━━',
      `গ্রাহক: ${cartInvoice.customerName}`,
      `তারিখ: ${cartInvoice.date}`,
      '─────────────',
    ];
    cartInvoice.items.forEach((item) => {
      lines.push(`${item.name} × ${item.qty} = ৳ ${item.total.toLocaleString('bn-BD')}`);
    });
    lines.push('─────────────', `সাবটোটাল: ৳ ${cartInvoice.subtotal.toLocaleString('bn-BD')}`);
    if (cartInvoice.discount > 0) {
      lines.push(`ছাড়: - ৳ ${cartInvoice.discount.toLocaleString('bn-BD')}`);
    }
    lines.push(
      `সর্বমোট: ৳ ${cartInvoice.grandTotal.toLocaleString('bn-BD')}`,
      '━━━━━━━━━━━━━━━━━━',
      'ধন্যবাদ আমাদের সাথে থাকার জন্য! 🙏'
    );
    return lines.join('\n');
  };

  const handleCopyCartInvoice = async () => {
    try {
      await copyToClipboard(buildCartInvoiceText());
      setCartCopied(true);
      toast.success('ইনভয়েস কপি হয়েছে! এখন শেয়ার করতে পারবেন।');
      setTimeout(() => setCartCopied(false), 2000);
    } catch (error) {
      toast.error('কপি করতে সমস্যা হয়েছে — ম্যানুয়ালি সিলেক্ট করে কপি করুন।');
    }
  };

  // ══════════════ ── Derived / Memoized Data ── ══════════════

  // ── ডাইনামিক ক্যাটাগরি তালিকা (কাস্টম ক্যাটাগরিসহ, কেস-ইনসেনসিটিভ ডিডুপ) ──
  const dynamicCategories = useMemo(() => {
    const map = new Map();
    map.set('all', 'All');
    CATEGORIES.filter((c) => c !== 'All').forEach((c) => map.set(c.toLowerCase(), c));
    products.forEach((p) => {
      const cat = (p.category || '').trim();
      if (cat && !map.has(cat.toLowerCase())) {
        map.set(cat.toLowerCase(), cat);
      }
    });
    return Array.from(map.values());
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === 'All' ||
        (item.category || '').toLowerCase() === selectedCategory.toLowerCase();
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  const summaryCards = useMemo(() => {
    const totalProductsCount = products.length;
    // ── ইনভেন্টরির প্রকৃত বিনিয়োগ মূল্য: costPrice দিয়ে, price দিয়ে না ──
    const totalStockCostValue = products.reduce(
      (acc, item) => acc + safeNumber(item.costPrice) * safeNumber(item.stock),
      0
    );
    const totalSoldQty = salesHistory.reduce((acc, s) => acc + safeNumber(s.qty), 0);
    const totalSalesAmount = salesHistory.reduce((acc, s) => acc + safeNumber(s.totalPrice), 0);
    const totalProfit = salesHistory.reduce((acc, s) => acc + safeNumber(s.profit), 0);

    const todaySales = salesHistory.filter(isSaleToday);
    const todaySalesAmount = todaySales.reduce((acc, s) => acc + safeNumber(s.totalPrice), 0);
    const todayProfit = todaySales.reduce((acc, s) => acc + safeNumber(s.profit), 0);

    return [
      { label: 'মোট পণ্য', value: `${totalProductsCount} টি`, icon: Package, color: 'indigo' },
      {
        label: 'ইনভেন্টরি মূল্য (ক্রয়মূল্যে)',
        value: `৳ ${totalStockCostValue.toLocaleString('bn-BD')}`,
        icon: Boxes,
        color: 'blue',
      },
      { label: 'মোট বিক্রি হয়েছে', value: `${totalSoldQty} টি`, icon: ShoppingCart, color: 'purple' },
      { label: 'মোট বিক্রয় (টাকা)', value: `৳ ${totalSalesAmount.toLocaleString('bn-BD')}`, icon: Wallet, color: 'emerald' },
      { label: 'মোট লাভ', value: `৳ ${totalProfit.toLocaleString('bn-BD')}`, icon: TrendingUp, color: 'teal' },
      { label: 'আজকের বিক্রি', value: `৳ ${todaySalesAmount.toLocaleString('bn-BD')}`, icon: CalendarClock, color: 'amber' },
      { label: 'আজকের লাভ', value: `৳ ${todayProfit.toLocaleString('bn-BD')}`, icon: TrendingUp, color: 'rose' },
    ];
  }, [products, salesHistory]);

  if (loading) {
    return <InventorySkeleton />;
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 bg-gray-50/50 min-h-screen relative pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Package className="w-7 h-7 text-indigo-600" />
            স্কুল স্টেশনারি ইনভেন্টরি ও সেলস
          </h1>
          <p className="text-sm text-gray-500 mt-1">পণ্য স্টক, বিক্রি এবং লেনদেনের রিয়েল-টাইম হিসাব</p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Link
            href="/dashboard/admin/admin-school-stationary/history"
            className="flex-1 md:flex-none bg-gray-800 hover:bg-gray-900 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition shadow-sm"
          >
            <History className="w-4 h-4" />
            হিস্টরি
          </Link>

          <button
            onClick={openCart}
            className="relative flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition shadow-sm"
          >
            <ShoppingBag className="w-4 h-4" />
            কার্ট
            {cartItemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                {cartItemCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── সামারি কার্ডসমূহ ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={`p-4 rounded-xl border ${colorMap[card.color]} flex flex-col gap-2 min-w-0`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold opacity-80">{card.label}</span>
                <Icon className="w-4 h-4 shrink-0 opacity-70" />
              </div>
              <p className={`text-base md:text-lg font-bold truncate ${valueColorMap[card.color]}`}>
                {card.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Main Content */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b pb-4">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="পণ্য খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-indigo-500 bg-gray-50/50 focus:bg-white transition"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {dynamicCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedCategory.toLowerCase() === cat.toLowerCase()
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* ── Desktop Table View ── */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-gray-400 font-semibold bg-gray-50/50">
                <th className="p-3">পণ্যের নাম</th>
                <th className="p-3">দাম</th>
                <th className="p-3">স্টক status</th>
                <th className="p-3">কার্ট</th>
                <th className="p-3 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-400">
                    কোনো পণ্য পাওয়া যায়নি। + বাটনে ক্লিক করে নতুন পণ্য যুক্ত করুন।
                  </td>
                </tr>
              ) : (
                filteredProducts.map((item) => {
                  const inCartQty = cart.find((c) => c.productId === item.id)?.qty || 0;
                  return (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition">
                      <td className="p-3 font-semibold text-gray-800">
                        {item.name}
                        <span className="block text-xs font-normal text-gray-400">
                          {item.category || 'General'}
                        </span>
                      </td>
                      <td className="p-3 font-medium text-gray-700">৳ {item.price}</td>
                      <td className="p-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold ${
                            item.stock <= 0
                              ? 'bg-gray-100 text-gray-500'
                              : item.stock < 5
                              ? 'bg-red-100 text-red-600'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {item.stock < 5 && item.stock > 0 && <AlertCircle className="w-3 h-3" />}
                          {item.stock <= 0 ? 'আউট অফ স্টক' : `${item.stock} টি`}
                        </span>
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => addToCart(item)}
                          disabled={item.stock <= 0 || inCartQty >= item.stock}
                          className="relative bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
                        >
                          <PackagePlus className="w-3.5 h-3.5" />
                          কার্টে যোগ করুন
                          {inCartQty > 0 && (
                            <span className="ml-1 bg-white/20 px-1.5 py-0.5 rounded-full text-[10px]">
                              {inCartQty}
                            </span>
                          )}
                        </button>
                      </td>
                      <td className="p-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => openRestockModal(item)}
                            className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                            title="স্টক যোগ করুন"
                          >
                            <Warehouse className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenModal(item)}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                            title="সম্পাদনা করুন"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(item.id, item.name)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="পণ্য মুছুন"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Mobile Card View ── */}
        <div className="md:hidden space-y-3">
          {filteredProducts.length === 0 ? (
            <p className="text-center text-gray-400 py-8">
              কোনো পণ্য পাওয়া যায়নি। + বাটনে ক্লিক করে নতুন পণ্য যুক্ত করুন।
            </p>
          ) : (
            filteredProducts.map((item) => {
              const inCartQty = cart.find((c) => c.productId === item.id)?.qty || 0;
              return (
                <div key={item.id} className="border border-gray-100 rounded-xl p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-gray-800">{item.name}</p>
                      <p className="text-xs text-gray-400">{item.category || 'General'}</p>
                    </div>
                    <span
                      className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold ${
                        item.stock <= 0
                          ? 'bg-gray-100 text-gray-500'
                          : item.stock < 5
                          ? 'bg-red-100 text-red-600'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {item.stock <= 0 ? 'আউট অফ স্টক' : `${item.stock} টি`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">৳ {item.price}</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openRestockModal(item)}
                        className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                      >
                        <Warehouse className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenModal(item)}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(item.id, item.name)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => addToCart(item)}
                    disabled={item.stock <= 0 || inCartQty >= item.stock}
                    className="w-full relative bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white px-3 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 transition"
                  >
                    <PackagePlus className="w-4 h-4" />
                    কার্টে যোগ করুন
                    {inCartQty > 0 && (
                      <span className="ml-1 bg-white/20 px-1.5 py-0.5 rounded-full text-[10px]">
                        {inCartQty}
                      </span>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Floating Add Product Button */}
      <button
        onClick={() => handleOpenModal()}
        className="fixed bottom-6 right-6 bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center z-40 active:scale-95"
        title="নতুন পণ্য যুক্ত করুন"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Add / Edit Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 relative animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                {editingProduct ? (
                  <>
                    <Edit2 className="w-5 h-5 text-indigo-600" />
                    পণ্য সম্পাদনা করুন
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5 text-indigo-600" />
                    নতুন পণ্য যোগ করুন
                  </>
                )}
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editingProduct && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-700">
                  স্টক পরিমাণ এখান থেকে বদলানো যাবে না — নতুন স্টক যোগ করতে পণ্য তালিকায় গুদাম আইকনে
                  ক্লিক করুন, সেখানে গড় ক্রয়মূল্য সঠিকভাবে হিসাব হবে।
                </p>
              </div>
            )}

            <form onSubmit={handleSubmitProduct} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">পণ্যের নাম</label>
                <input
                  type="text"
                  maxLength={120}
                  placeholder="যেমন: A4 offset paper"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600  mb-1 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5" />
                  ক্যাটাগরি
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-indigo-500 bg-white"
                >
                  {CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                  <option value={CUSTOM_CATEGORY_VALUE}>✏️ কাস্টম ক্যাটাগরি...</option>
                </select>

                {formData.category === CUSTOM_CATEGORY_VALUE && (
                  <input
                    type="text"
                    autoFocus
                    maxLength={40}
                    placeholder="নতুন ক্যাটাগরির নাম লিখুন"
                    value={formData.customCategory}
                    onChange={(e) => setFormData({ ...formData, customCategory: e.target.value })}
                    className="w-full mt-2 px-3 py-2 border border-indigo-200 rounded-lg text-sm focus:outline-indigo-500 bg-indigo-50/40"
                    required
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">ক্রয়মূল্য (৳)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={formData.costPrice}
                    onChange={(e) =>
                      setFormData({ ...formData, costPrice: sanitizeNonNegativeInput(e.target.value) })
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-indigo-500"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">লাভ হিসাবের জন্য ব্যবহৃত হবে</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">বিক্রয়মূল্য (৳)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: sanitizeNonNegativeInput(e.target.value) })
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">স্টক পরিমাণ</label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={editingProduct ? editingProduct.stock : formData.stock}
                  onChange={(e) =>
                    !editingProduct &&
                    setFormData({ ...formData, stock: sanitizeNonNegativeInput(e.target.value) })
                  }
                  disabled={!!editingProduct}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-indigo-500 disabled:bg-gray-100 disabled:text-gray-400"
                  required={!editingProduct}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
                >
                  {editingProduct ? 'আপডেট করুন' : 'ইনভেন্টরিতে সেভ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Restock Modal ── */}
      {restockModalOpen && restockProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 relative animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Warehouse className="w-5 h-5 text-emerald-600" />
                স্টক যোগ করুন
              </h2>
              <button
                onClick={closeRestockModal}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
              <p className="font-semibold text-gray-800">{restockProduct.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                বর্তমান স্টক: <span className="font-semibold">{restockProduct.stock} টি</span> • বর্তমান
                ক্রয়মূল্য: ৳ {safeNumber(restockProduct.costPrice).toFixed(2)}
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">
                কতগুলো নতুন স্টক যোগ করছেন
              </label>
              <input
                type="number"
                min="1"
                placeholder="যেমন: 20"
                value={restockQty}
                onChange={(e) => setRestockQty(sanitizeNonNegativeInput(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-indigo-500"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">নতুন ক্রয়মূল্য (৳)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  placeholder={`ডিফল্ট: ${safeNumber(restockProduct.costPrice).toFixed(2)}`}
                  value={restockNewCostPrice}
                  onChange={(e) => setRestockNewCostPrice(sanitizeNonNegativeInput(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">নতুন বিক্রয়মূল্য (৳)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  placeholder={`ডিফল্ট: ${safeNumber(restockProduct.price).toFixed(2)}`}
                  value={restockNewSellPrice}
                  onChange={(e) => setRestockNewSellPrice(sanitizeNonNegativeInput(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-indigo-500"
                />
              </div>
            </div>
            <p className="text-[10px] text-gray-400 -mt-2">
              দাম পরিবর্তন না হলে খালি রাখুন — আগের দামই ব্যবহার হবে
            </p>

            {restockPreview && restockPreview.addQty > 0 && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 space-y-1.5">
                <p className="text-xs font-bold text-emerald-800 flex items-center gap-1 mb-2">
                  <Info className="w-3.5 h-3.5" />
                  স্টক যোগের পর নতুন হিসাব
                </p>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>মোট স্টক</span>
                  <span className="font-semibold text-gray-800">
                    {restockPreview.currentStock} + {restockPreview.addQty} = {restockPreview.newTotalStock} টি
                  </span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>আগের ক্রয়মূল্য</span>
                  <span>৳ {restockPreview.currentCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>নতুন চালানের ক্রয়মূল্য</span>
                  <span>৳ {restockPreview.newCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-900 text-base pt-1 border-t border-emerald-200 mt-1">
                  <span>গড় ক্রয়মূল্য (নতুন)</span>
                  <span>৳ {restockPreview.weightedAvgCost.toFixed(2)}</span>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={closeRestockModal}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                বাতিল
              </button>
              <button
                onClick={handleConfirmRestock}
                disabled={isRestocking}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2"
              >
                {isRestocking && <Loader2 className="w-4 h-4 animate-spin" />}
                স্টক যোগ নিশ্চিত করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Cart Modal ── */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4 relative animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-emerald-600" />
                {cartInvoice ? 'বিক্রয় সম্পন্ন হয়েছে' : 'কার্ট ও চেকআউট'}
              </h2>
              <button onClick={closeCart} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            {!cartInvoice ? (
              <>
                {cart.length === 0 ? (
                  <div className="text-center py-10 text-gray-400">
                    <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    কার্ট খালি — পণ্য তালিকা থেকে কার্টে যোগ করুন চাপুন
                  </div>
                ) : (
                  <>
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {cart.map((item) => (
                        <div
                          key={item.productId}
                          className="flex items-center justify-between gap-2 bg-gray-50 border border-gray-100 rounded-xl p-3"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-gray-800 truncate">{item.name}</p>
                            <p className="text-xs text-gray-500">
                              ৳ {item.price} × {item.qty} = ৳ {(item.price * item.qty).toLocaleString('bn-BD')}
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => updateCartQty(item.productId, item.qty - 1)}
                              className="w-7 h-7 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 flex items-center justify-center transition"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-6 text-center text-sm font-semibold text-gray-700">
                              {item.qty}
                            </span>
                            <button
                              onClick={() => updateCartQty(item.productId, item.qty + 1)}
                              disabled={item.qty >= item.stock}
                              className="w-7 h-7 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40 flex items-center justify-center transition"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => removeFromCart(item.productId)}
                              className="w-7 h-7 rounded-lg text-red-500 hover:bg-red-50 flex items-center justify-center transition ml-1"
                              title="কার্ট থেকে সরান"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-600  mb-1 flex items-center gap-1">
                          <BadgePercent className="w-3.5 h-3.5" />
                          ছাড় (৳) ঐচ্ছিক
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          inputMode="decimal"
                          placeholder="0.00"
                          value={cartDiscount}
                          onChange={(e) => setCartDiscount(sanitizeNonNegativeInput(e.target.value))}
                          className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600  mb-1 flex items-center gap-1">
                          <UserCircle2 className="w-3.5 h-3.5" />
                          গ্রাহকের নাম
                        </label>
                        <input
                          type="text"
                          maxLength={80}
                          placeholder="ঐচ্ছিক"
                          value={cartCustomerName}
                          onChange={(e) => setCartCustomerName(e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 space-y-1">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>মোট আইটেম</span>
                        <span>{cartItemCount} টি</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>সাবটোটাল</span>
                        <span>৳ {cartSubtotal.toLocaleString('bn-BD')}</span>
                      </div>
                      {cartDiscountValue > 0 && (
                        <div className="flex justify-between text-sm text-rose-600 font-medium">
                          <span>ছাড়</span>
                          <span>- ৳ {cartDiscountValue.toLocaleString('bn-BD')}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-indigo-900 text-base pt-1 border-t border-indigo-100 mt-1">
                        <span>সর্বমোট</span>
                        <span>৳ {cartGrandTotal.toLocaleString('bn-BD')}</span>
                      </div>
                      <div className="flex justify-between text-xs font-semibold text-emerald-700 pt-1 border-t border-dashed border-indigo-200 mt-1">
                        <span>আনুমানিক লাভ</span>
                        <span>৳ {cartNetProfit.toLocaleString('bn-BD')}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={clearCart}
                        className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 border transition"
                      >
                        কার্ট খালি করুন
                      </button>
                      <button
                        onClick={handleCheckout}
                        disabled={isCheckingOut}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition shadow-sm"
                      >
                        {isCheckingOut ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <ShoppingCart className="w-4 h-4" />
                        )}
                        বিক্রি নিশ্চিত করুন
                      </button>
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
                <div className="bg-linear-to-br from-indigo-50 to-white border border-indigo-100 rounded-xl p-5 space-y-3">
                  <div className="flex items-center gap-2 text-indigo-700 font-bold border-b border-dashed border-indigo-200 pb-3">
                    <Receipt className="w-5 h-5" />
                    বিক্রয় ইনভয়েস
                  </div>

                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">গ্রাহক</span>
                      <span className="font-semibold text-gray-800">{cartInvoice.customerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">তারিখ</span>
                      <span className="font-semibold text-gray-800 text-xs">{cartInvoice.date}</span>
                    </div>
                  </div>

                  <div className="border-t border-dashed border-indigo-200 pt-2 space-y-1.5">
                    {cartInvoice.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          {item.name} <span className="text-gray-400">× {item.qty}</span>
                        </span>
                        <span className="font-semibold text-gray-800">
                          ৳ {item.total.toLocaleString('bn-BD')}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-dashed border-indigo-200 pt-2 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">সাবটোটাল</span>
                      <span className="text-gray-800">৳ {cartInvoice.subtotal.toLocaleString('bn-BD')}</span>
                    </div>
                    {cartInvoice.discount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">ছাড়</span>
                        <span className="text-rose-600 font-semibold">
                          - ৳ {cartInvoice.discount.toLocaleString('bn-BD')}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-dashed border-indigo-200">
                    <span className="font-bold text-gray-700">সর্বমোট</span>
                    <span className="font-extrabold text-indigo-700 text-lg">
                      ৳ {cartInvoice.grandTotal.toLocaleString('bn-BD')}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleCopyCartInvoice}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition shadow-sm"
                  >
                    {cartCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {cartCopied ? 'কপি হয়েছে!' : 'ইনভয়েস কপি করুন'}
                  </button>
                  <button
                    onClick={closeCart}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 border transition"
                  >
                    বন্ধ করুন
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const AdminSchoolStationary = () => (
  <InventoryErrorBoundary>
    <AdminSchoolStationaryInner />
  </InventoryErrorBoundary>
);

export default AdminSchoolStationary;