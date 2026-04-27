import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Filter, 
  MoreVertical,
  ArrowUpRight,
  TrendingUp,
  Package
} from 'lucide-react';
import { useRealTimeData } from '../hooks/useRealTimeData';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';

const Products = () => {
  const { products } = useRealTimeData();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'Electronics',
    sku: '',
    selling_price: 0,
    cost_price: 0,
    current_stock: 0,
    reorder_point: 10,
    supplier_name: '',
    lead_time_days: 7,
    unit: 'pieces',
    image_url: ''
  });

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      await deleteDoc(doc(db, 'products', id));
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    await addDoc(collection(db, 'products'), {
      ...newProduct,
      max_stock: newProduct.current_stock * 2,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    });
    setShowAddModal(false);
    setNewProduct({
      name: '', category: 'Electronics', sku: '', selling_price: 0, cost_price: 0, 
      current_stock: 0, reorder_point: 10, supplier_name: '', lead_time_days: 7, unit: 'pieces',
      image_url: ''
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 mb-2">Product Catalog</h1>
          <p className="text-slate-500 font-medium">Manage your inventory, prices, and supplier details.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-3 px-8 py-4 bg-indigo-600 rounded-full font-bold text-white hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95"
        >
          <Plus className="w-6 h-6" />
          Add New Product
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-[32px] border border-slate-100">
          <p className="text-slate-400 text-sm font-bold mb-1 uppercase tracking-wider">Total SKUs</p>
          <p className="text-3xl font-black text-slate-900">{products.length}</p>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-slate-100">
          <p className="text-slate-400 text-sm font-bold mb-1 uppercase tracking-wider">Total Value</p>
          <p className="text-3xl font-black text-indigo-600">₹{(products.reduce((acc, p) => acc + (p.current_stock * p.selling_price), 0) / 100000).toFixed(1)}L</p>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-slate-100">
          <p className="text-slate-400 text-sm font-bold mb-1 uppercase tracking-wider">Out of Stock</p>
          <p className="text-3xl font-black text-rose-500">{products.filter(p => p.current_stock === 0).length}</p>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-slate-100">
          <p className="text-slate-400 text-sm font-bold mb-1 uppercase tracking-wider">Categories</p>
          <p className="text-3xl font-black text-amber-500">{new Set(products.map(p => p.category)).size}</p>
        </div>
      </div>

      <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-slate-50 border-transparent focus:bg-white focus:ring-4 focus:ring-indigo-100 rounded-[50px] outline-none font-medium transition-all"
            />
          </div>
          <button className="flex items-center gap-2 px-6 py-4 bg-slate-50 rounded-full font-bold text-slate-600 hover:bg-slate-100 transition-colors">
            <Filter className="w-5 h-5" />
            More Filters
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Product</th>
                <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Category</th>
                <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Price</th>
                <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Stock Status</th>
                <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Supplier</th>
                <th className="px-8 py-5 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map((product) => (
                <tr key={product.id} className="hover:bg-slate-50/30 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl overflow-hidden shrink-0 border border-slate-100 group-hover:scale-110 transition-transform">
                        <img src={product.image_url || 'https://images.unsplash.com/photo-1586769852836-bc069f19e1b6?w=200'} className="w-full h-full object-cover" alt="" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{product.name}</p>
                        <p className="text-slate-400 text-xs font-bold">{product.sku}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-8 py-6 font-black text-slate-900">₹{product.selling_price.toLocaleString()}</td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${
                          product.current_stock <= product.reorder_point ? 'bg-rose-500' : 'bg-emerald-500'
                        }`} />
                        <span className="text-sm font-bold text-slate-700">{product.current_stock} {product.unit}</span>
                      </div>
                      <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${product.current_stock <= product.reorder_point ? 'bg-rose-500' : 'bg-emerald-500'}`}
                          style={{ width: `${Math.min(100, (product.current_stock / product.max_stock) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-sm font-medium text-slate-600">{product.supplier_name}</td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2 text-slate-300 hover:text-indigo-600 transition-colors">
                        <Edit3 className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleDelete(product.id)} className="p-2 text-slate-300 hover:text-rose-600 transition-colors">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] p-10 max-w-2xl w-full shadow-2xl animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
            <h3 className="text-3xl font-black text-slate-900 mb-8">Add New Product</h3>
            <form onSubmit={handleAddProduct} className="grid grid-cols-2 gap-6">
              <div className="col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-4">Product Name</label>
                <input 
                  type="text" required
                  className="w-full px-6 py-4 bg-slate-50 rounded-[50px] outline-none focus:ring-4 focus:ring-indigo-100 transition-all font-medium"
                  value={newProduct.name}
                  onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-4">Category</label>
                <select 
                  className="w-full px-6 py-4 bg-slate-50 rounded-[50px] outline-none focus:ring-4 focus:ring-indigo-100 transition-all font-medium appearance-none"
                  value={newProduct.category}
                  onChange={e => setNewProduct({...newProduct, category: e.target.value})}
                >
                  <option>Electronics</option>
                  <option>Fashion</option>
                  <option>Food</option>
                  <option>Industrial</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-4">SKU Code</label>
                <input 
                  type="text" required
                  className="w-full px-6 py-4 bg-slate-50 rounded-[50px] outline-none focus:ring-4 focus:ring-indigo-100 transition-all font-medium"
                  value={newProduct.sku}
                  onChange={e => setNewProduct({...newProduct, sku: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-4">Selling Price (₹)</label>
                <input 
                  type="number" required
                  className="w-full px-6 py-4 bg-slate-50 rounded-[50px] outline-none focus:ring-4 focus:ring-indigo-100 transition-all font-medium"
                  value={newProduct.selling_price}
                  onChange={e => setNewProduct({...newProduct, selling_price: Number(e.target.value)})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-4">Cost Price (₹)</label>
                <input 
                  type="number" required
                  className="w-full px-6 py-4 bg-slate-50 rounded-[50px] outline-none focus:ring-4 focus:ring-indigo-100 transition-all font-medium"
                  value={newProduct.cost_price}
                  onChange={e => setNewProduct({...newProduct, cost_price: Number(e.target.value)})}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-4">Product Image URL</label>
                <input 
                  type="text"
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-6 py-4 bg-slate-50 rounded-[50px] outline-none focus:ring-4 focus:ring-indigo-100 transition-all font-medium"
                  value={newProduct.image_url}
                  onChange={e => setNewProduct({...newProduct, image_url: e.target.value})}
                />
              </div>
              <div className="col-span-2 flex gap-4 mt-4">
                <button 
                  type="submit"
                  className="flex-1 py-4 bg-indigo-600 text-white rounded-[50px] font-black hover:bg-indigo-700 transition-colors"
                >
                  Save Product
                </button>
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-[50px] font-black hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
