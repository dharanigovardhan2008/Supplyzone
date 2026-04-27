import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './firebase';
import { collection, getDocs, setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { SAMPLE_PRODUCTS } from './mockData';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Billing from './pages/Billing';
import BillHistory from './pages/BillHistory';
import Products from './pages/Products';
import DemandAnalytics from './pages/DemandAnalytics';
import InventoryIntel from './pages/InventoryIntel';
import AIInsights from './pages/AIInsights';
import RevenueReports from './pages/RevenueReports';
import QuickRestock from './pages/QuickRestock';
import Settings from './pages/Settings';

// Components
import Layout from './components/Layout';
import Chatbot from './components/Chatbot';

const App = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    // Seed data with images (robust for demo)
    const seedData = async () => {
      const productsRef = collection(db, 'products');
      const snapshot = await getDocs(productsRef);
      
      // If we already have products, let's just make sure they have images
      // Or if empty, seed them all.
      if (snapshot.empty) {
        console.log('Seeding initial products...');
        for (const product of SAMPLE_PRODUCTS) {
          const newDocRef = doc(productsRef);
          await setDoc(newDocRef, {
            ...product,
            id: newDocRef.id,
            created_at: serverTimestamp(),
            updated_at: serverTimestamp()
          });
        }
      } else {
        // Optional: Update existing docs to ensure they have the latest image URLs from SAMPLE_PRODUCTS
        // based on SKU matching.
        console.log('Ensuring images are present...');
        snapshot.docs.forEach(async (docSnap) => {
          const data = docSnap.data();
          const match = SAMPLE_PRODUCTS.find(p => p.sku === data.sku);
          if (match && (!data.image_url || data.image_url.includes('emoji'))) {
             await setDoc(docSnap.ref, { image_url: match.image_url }, { merge: true });
          }
        });
      }
    };
    seedData();

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" />} />
        
        <Route path="/" element={user ? <Layout><Dashboard /></Layout> : <Navigate to="/login" />} />
        <Route path="/dashboard" element={user ? <Layout><Dashboard /></Layout> : <Navigate to="/login" />} />
        <Route path="/billing" element={user ? <Layout><Billing /></Layout> : <Navigate to="/login" />} />
        <Route path="/billing/history" element={user ? <Layout><BillHistory /></Layout> : <Navigate to="/login" />} />
        <Route path="/products" element={user ? <Layout><Products /></Layout> : <Navigate to="/login" />} />
        <Route path="/analytics/demand" element={user ? <Layout><DemandAnalytics /></Layout> : <Navigate to="/login" />} />
        <Route path="/analytics/inventory" element={user ? <Layout><InventoryIntel /></Layout> : <Navigate to="/login" />} />
        <Route path="/analytics/insights" element={user ? <Layout><AIInsights /></Layout> : <Navigate to="/login" />} />
        <Route path="/analytics/revenue" element={user ? <Layout><RevenueReports /></Layout> : <Navigate to="/login" />} />
        <Route path="/restock" element={user ? <Layout><QuickRestock /></Layout> : <Navigate to="/login" />} />
        <Route path="/settings" element={user ? <Layout><Settings /></Layout> : <Navigate to="/login" />} />
        
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
      {user && <Chatbot />}
    </Router>
  );
};

export default App;
