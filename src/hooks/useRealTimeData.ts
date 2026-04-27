import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  onSnapshot, 
  orderBy, 
  limit, 
  Timestamp,
  where
} from 'firebase/firestore';
import { db } from '../firebase';
import { Product, Bill, InventoryAlert, AIInsight } from '../types';

export const useRealTimeData = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [recentBills, setRecentBills] = useState<Bill[]>([]);
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const qProducts = query(collection(db, 'products'));
    const qBills = query(collection(db, 'bills'), orderBy('created_at', 'desc'), limit(50));
    const qAlerts = query(collection(db, 'inventory_alerts'), orderBy('created_at', 'desc'), limit(20));
    const qInsights = query(collection(db, 'ai_insights'), orderBy('created_at', 'desc'), limit(10));

    const unsubProducts = onSnapshot(qProducts, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    });

    const unsubBills = onSnapshot(qBills, (snapshot) => {
      setRecentBills(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Bill)));
    });

    const unsubAlerts = onSnapshot(qAlerts, (snapshot) => {
      setAlerts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryAlert)));
    });

    const unsubInsights = onSnapshot(qInsights, (snapshot) => {
      setInsights(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AIInsight)));
      setLoading(false);
    });

    return () => {
      unsubProducts();
      unsubBills();
      unsubAlerts();
      unsubInsights();
    };
  }, []);

  return { products, recentBills, alerts, insights, loading };
};
