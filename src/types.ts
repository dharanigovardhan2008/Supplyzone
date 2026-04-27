export interface Product {
  id: string;
  name: string;
  category: string;
  sku: string;
  selling_price: number;
  cost_price: number;
  current_stock: number;
  reorder_point: number;
  max_stock: number;
  supplier_name: string;
  supplier_contact: string;
  lead_time_days: number;
  unit: string;
  image_url?: string;
  created_at: any;
  updated_at: any;
}

export interface BillItem {
  product_id: string;
  product_name: string;
  category: string;
  quantity: number;
  unit_price: number;
  cost_price: number;
  total_price: number;
  profit: number;
  image_url?: string;
}

export interface Bill {
  id: string;
  bill_number: string;
  date: any;
  day_of_week: string;
  hour_of_day: number;
  items: BillItem[];
  subtotal: number;
  discount: number;
  tax_rate: number;
  tax_amount: number;
  grand_total: number;
  payment_method: string;
  customer_name: string;
  staff_id: string;
  created_at: any;
}

export interface InventoryAlert {
  id: string;
  product_id: string;
  product_name: string;
  alert_type: 'LOW_STOCK' | 'CRITICAL_STOCK';
  message: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  is_read: boolean;
  created_at: any;
}

export interface PurchaseOrder {
  id: string;
  po_number: string;
  product_id: string;
  product_name: string;
  supplier_name: string;
  quantity_ordered: number;
  unit_cost: number;
  total_cost: number;
  status: 'Pending' | 'Ordered' | 'Received' | 'Cancelled';
  expected_delivery: any;
  created_at: any;
}

export interface AIInsight {
  id: string;
  insight_type: 'REORDER' | 'DEAD_STOCK' | 'TREND' | 'PEAK_TIME' | 'REVENUE';
  title: string;
  message: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  product?: string;
  action: string;
  action_taken: boolean;
  created_at: any;
}
