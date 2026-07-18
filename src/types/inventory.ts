export type InventoryItem = {
  id: string;
  item_name: string;
  sku: string;
  barcode: string;
  category: string;
  category_id: string;
  unit_of_measure: string;
  purchase_uom: string;
  sale_uom: string;
  opening_stock: number;
  current_stock: number;
  unit_cost: number;
  reorder_level: number;
  custom_fields: Record<string, any>;
  created_at: string;
};

export type Category = {
  id: string;
  name: string;
  parent_id: string | null;
};

export type Transaction = {
  id: string;
  item_id: string;
  transaction_type: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  reference_type: string;
  reference_id: string;
  transaction_date: string;
  notes: string;
  created_at: string;
  item_name: string;
  sku: string;
};

export type InventoryItemBrief = {
  id: string;
  item_name: string;
  sku: string;
  current_stock: number;
  unit_of_measure: string;
};

export const TRANSACTION_TYPES = ['PURCHASE', 'SALE', 'RETURN', 'ADJUSTMENT'] as const;
export type TransactionType = typeof TRANSACTION_TYPES[number];
