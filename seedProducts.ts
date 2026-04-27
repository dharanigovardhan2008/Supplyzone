import { db } from './src/firebase';
import {
  collection,
  doc,
  setDoc,
  getDocs,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';

const IMAGE_FIXES: Record<string, string> = {
  'Industrial Motor': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
  'Laptop':           'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&q=80',
  'T-Shirt':          'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80',
  'Coffee Pack':      'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=600&q=80',
  'Smartphone':       'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80',
};

const NEW_PRODUCTS = [
  // ── Electronics ──────────────────────────────────────────────────────────
  {
    name: 'Wireless Earbuds',     category: 'Electronics', sku: 'ELEC-002',
    selling_price: 3499,  cost_price: 2000,  current_stock: 80,  reorder_point: 15,
    image_url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&q=80',
  },
  {
    name: 'Mechanical Keyboard',  category: 'Electronics', sku: 'ELEC-003',
    selling_price: 7999,  cost_price: 4500,  current_stock: 45,  reorder_point: 10,
    image_url: 'https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=600&q=80',
  },
  {
    name: 'Smart Watch',          category: 'Electronics', sku: 'ELEC-004',
    selling_price: 12999, cost_price: 8000,  current_stock: 60,  reorder_point: 12,
    image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80',
  },
  {
    name: 'Wireless Mouse',       category: 'Electronics', sku: 'ELEC-005',
    selling_price: 1899,  cost_price: 950,   current_stock: 120, reorder_point: 20,
    image_url: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&q=80',
  },
  {
    name: 'USB-C Hub',            category: 'Electronics', sku: 'ELEC-006',
    selling_price: 2499,  cost_price: 1200,  current_stock: 75,  reorder_point: 15,
    image_url: 'https://images.unsplash.com/photo-1625895197185-efcec01cffe0?w=600&q=80',
  },
  {
    name: 'Portable Speaker',     category: 'Electronics', sku: 'ELEC-007',
    selling_price: 4999,  cost_price: 2800,  current_stock: 55,  reorder_point: 10,
    image_url: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&q=80',
  },
  {
    name: 'Tablet',               category: 'Electronics', sku: 'ELEC-008',
    selling_price: 28999, cost_price: 20000, current_stock: 30,  reorder_point: 8,
    image_url: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&q=80',
  },
  {
    name: 'Webcam HD',            category: 'Electronics', sku: 'ELEC-009',
    selling_price: 3299,  cost_price: 1800,  current_stock: 65,  reorder_point: 12,
    image_url: 'https://images.unsplash.com/photo-1587826080692-f439cd0b70da?w=600&q=80',
  },

  // ── Fashion ───────────────────────────────────────────────────────────────
  {
    name: 'Denim Jacket',         category: 'Fashion', sku: 'FASH-002',
    selling_price: 2499,  cost_price: 1200,  current_stock: 90,  reorder_point: 20,
    image_url: 'https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?w=600&q=80',
  },
  {
    name: 'Running Shoes',        category: 'Fashion', sku: 'FASH-003',
    selling_price: 3999,  cost_price: 2000,  current_stock: 110, reorder_point: 25,
    image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80',
  },
  {
    name: 'Leather Wallet',       category: 'Fashion', sku: 'FASH-004',
    selling_price: 1299,  cost_price: 600,   current_stock: 150, reorder_point: 30,
    image_url: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=600&q=80',
  },
  {
    name: 'Sunglasses',           category: 'Fashion', sku: 'FASH-005',
    selling_price: 1799,  cost_price: 800,   current_stock: 85,  reorder_point: 15,
    image_url: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&q=80',
  },
  {
    name: 'Baseball Cap',         category: 'Fashion', sku: 'FASH-006',
    selling_price: 699,   cost_price: 300,   current_stock: 200, reorder_point: 40,
    image_url: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600&q=80',
  },
  {
    name: 'Wrist Watch',          category: 'Fashion', sku: 'FASH-007',
    selling_price: 5999,  cost_price: 3200,  current_stock: 40,  reorder_point: 10,
    image_url: 'https://images.unsplash.com/photo-1533139502658-0198f920d8e8?w=600&q=80',
  },
  {
    name: 'Hoodie',               category: 'Fashion', sku: 'FASH-008',
    selling_price: 1999,  cost_price: 900,   current_stock: 130, reorder_point: 25,
    image_url: 'https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=600&q=80',
  },
  {
    name: 'Backpack',             category: 'Fashion', sku: 'FASH-009',
    selling_price: 2999,  cost_price: 1400,  current_stock: 75,  reorder_point: 15,
    image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80',
  },

  // ── Food ──────────────────────────────────────────────────────────────────
  {
    name: 'Green Tea Box',        category: 'Food', sku: 'FOOD-002',
    selling_price: 349,   cost_price: 180,   current_stock: 200, reorder_point: 40,
    image_url: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&q=80',
  },
  {
    name: 'Protein Bar Pack',     category: 'Food', sku: 'FOOD-003',
    selling_price: 799,   cost_price: 450,   current_stock: 180, reorder_point: 35,
    image_url: 'https://images.unsplash.com/photo-1622484212850-eb596d769edc?w=600&q=80',
  },
  {
    name: 'Olive Oil 1L',         category: 'Food', sku: 'FOOD-004',
    selling_price: 699,   cost_price: 400,   current_stock: 120, reorder_point: 25,
    image_url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&q=80',
  },
  {
    name: 'Mixed Nuts 500g',      category: 'Food', sku: 'FOOD-005',
    selling_price: 599,   cost_price: 320,   current_stock: 160, reorder_point: 30,
    image_url: 'https://images.unsplash.com/photo-1563412580953-81a4f3f853f9?w=600&q=80',
  },
  {
    name: 'Dark Chocolate',       category: 'Food', sku: 'FOOD-006',
    selling_price: 249,   cost_price: 120,   current_stock: 250, reorder_point: 50,
    image_url: 'https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=600&q=80',
  },
  {
    name: 'Honey Jar 500g',       category: 'Food', sku: 'FOOD-007',
    selling_price: 449,   cost_price: 240,   current_stock: 140, reorder_point: 28,
    image_url: 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=600&q=80',
  },
  {
    name: 'Instant Noodles Pack', category: 'Food', sku: 'FOOD-008',
    selling_price: 199,   cost_price: 90,    current_stock: 300, reorder_point: 60,
    image_url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&q=80',
  },

  // ── Industrial ────────────────────────────────────────────────────────────
  {
    name: 'Power Drill',          category: 'Industrial', sku: 'INDU-002',
    selling_price: 4999,  cost_price: 2800,  current_stock: 50,  reorder_point: 10,
    image_url: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&q=80',
  },
  {
    name: 'Safety Helmet',        category: 'Industrial', sku: 'INDU-003',
    selling_price: 1299,  cost_price: 650,   current_stock: 100, reorder_point: 20,
    image_url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&q=80',
  },
  {
    name: 'Work Gloves',          category: 'Industrial', sku: 'INDU-004',
    selling_price: 499,   cost_price: 220,   current_stock: 200, reorder_point: 40,
    image_url: 'https://images.unsplash.com/photo-1617347454431-f49d7ff5c3b1?w=600&q=80',
  },
  {
    name: 'Steel Wrench Set',     category: 'Industrial', sku: 'INDU-005',
    selling_price: 2199,  cost_price: 1100,  current_stock: 70,  reorder_point: 15,
    image_url: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=600&q=80',
  },
  {
    name: 'Extension Cord 10m',   category: 'Industrial', sku: 'INDU-006',
    selling_price: 899,   cost_price: 450,   current_stock: 90,  reorder_point: 18,
    image_url: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=600&q=80',
  },
  {
    name: 'Angle Grinder',        category: 'Industrial', sku: 'INDU-007',
    selling_price: 3499,  cost_price: 1900,  current_stock: 40,  reorder_point: 8,
    image_url: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=600&q=80',
  },
];

// ─── Run ──────────────────────────────────────────────────────────────────────

async function seed() {
  const productsCol = collection(db, 'products');

  // 1. Fix images on existing products
  console.log('🔧  Fixing images on existing products…');
  const snapshot = await getDocs(productsCol);
  const existingSkus = new Set<string>();

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    existingSkus.add(data.sku);
    const fixedUrl = IMAGE_FIXES[data.name as string];
    if (fixedUrl) {
      await updateDoc(doc(db, 'products', docSnap.id), {
        image_url: fixedUrl,
        updated_at: serverTimestamp(),
      });
      console.log(`  ✅  Fixed: "${data.name}"`);
    }
  }

  // 2. Add new products — skip if SKU already exists
  console.log('\n➕  Adding new products…');
  for (const product of NEW_PRODUCTS) {
    if (existingSkus.has(product.sku)) {
      console.log(`  ⏭   Skipped "${product.name}" — already exists`);
      continue;
    }
    await setDoc(doc(productsCol), {
      ...product,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
    console.log(`  ✅  Added: "${product.name}"`);
  }

  console.log('\n🎉  Done! All products seeded.');
}

seed().catch(err => {
  console.error('❌  Seed failed:', err);
  process.exit(1);
});
