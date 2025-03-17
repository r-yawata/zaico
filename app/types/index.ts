import { Decimal } from 'decimal.js';

export enum SampleStatus {
  STORED = 'STORED',             // 保管中
  OUTBOUND = 'OUTBOUND',         // 出庫中（試験中）
  USED = 'USED',                 // 使用済
  REINBOUND = 'REINBOUND',       // 再入庫済
  WAITING_FOR_JUDGMENT = 'WAITING_FOR_JUDGMENT', // 判定待
  WAITING_FOR_DISPOSAL = 'WAITING_FOR_DISPOSAL', // 廃棄待
  DISPOSED = 'DISPOSED'          // 廃棄済
}

// export interface Supplier {
//   id: number;
//   name: string;
//   contact?: string;
//   address?: string;
//   createdAt: Date;
//   updatedAt: Date;
// }

// export interface Manufacturer {
//   id: number;
//   name: string;
//   location?: string;
//   contact?: string;
//   createdAt: Date;
//   updatedAt: Date;
// }

// export interface Category {
//   id: number;
//   name: string;
//   description?: string;
//   createdAt: Date;
//   updatedAt: Date;
// }

// export interface Material {
//   id: number;
//   name: string;
//   specification?: string;
//   customAttributes?: Record<string, any>;
//   packageCount?: number;
//   unitWeight?: string;
//   supplierId: number;
//   // supplier?: Supplier;
//   manufacturerId: number;
//   // manufacturer?: Manufacturer;
//   categoryId: number;
//   // category: Category;
//   note?: string;
//   categoryName?: string;
//   manufacturerName?: string;
//   supplierName?: string;
//   createdAt: Date;
//   updatedAt: Date;
// }

// export interface Vessel {
//   id: number;
//   name: string;
//   weight: Decimal;
//   materialId?: number;
//   material?: Material;
//   createdAt: Date;
//   updatedAt: Date;
// }

export interface User {
  id: number;
  username: string;
  email: string;
  created_at: Date;
  updated_at: Date;
}

export interface Stock {
  id: number;
  product_name: string;
  lot: string;
  status: SampleStatus;
  registration_date: Date;
  update_date: Date;
  remarks?: string;
  expiration_date: Date;
  storage_date: Date;
  current_weight: Decimal;
  net_weight: Decimal;
  vessel_weight: Decimal;
  inbound_weight: Decimal;
  material_id: number;
  material: Material;
  vessel_id?: number;
  vessel?: Vessel;
  creator_id: number;
  creator: User;
  extra_config?: Record<string, any>;
  parent_stock_id?: number;
  parent_stock?: Stock;
  child_stocks?: Stock[];
  created_at: Date;
  updated_at: Date;
}

export interface StockHistory {
  id: number;
  stock_id: number;
  stock: Stock;
  action: string;
  weight_change: Decimal;
  performed_at: Date;
  remarks?: string;
  performed_by_id: number;
  performed_by: User;
}

export interface StockExtraConfig {
  id: number;
  field_name: string;
  field_type: string;
  select_options?: StockExtraConfigSelect[];
}

export interface StockExtraConfigSelect {
  id: number;
  name: string;
  value: string;
  extra_config_id: number;
  extra_config: StockExtraConfig;
}

export interface StockInfoRule {
  id: number;
  material_id: number;
  material: Material;
  allowed_error_percentage: Decimal;
}

export interface InventorySplitHistory {
  id: number;
  parent_stock_id: number;
  parent_stock: Stock;
  child_stock_ids: number[];
  split_date: Date;
  split_details: Record<string, any>;
  performed_by_id: number;
  performed_by: User;
}

export interface StockReservation {
  id: number;
  material_id: number;
  material: Material;
  lot: string;
  usage?: string;
  required_amount: Decimal;
  outbound_date: Date;
  return_date: Date;
  test_name?: string;
  remarks?: string;
  creator_id: number;
  creator: User;
  created_at: Date;
  updated_at: Date;
}

// 以下のインターフェースを追加して型エラーを解決
export interface Material {
  id: number;
  name: string;
  specification?: string;
  custom_attributes?: Record<string, any>;
  package_count?: number;
  unit_weight?: string;
  supplier_id: number;
  supplier?: Supplier;
  manufacturer_id: number;
  manufacturer?: Manufacturer;
  category_id: number;
  category?: Category;
  note?: string;
  category_name?: string;
  manufacturer_name?: string;
  supplier_name?: string;
  created_at: Date;
  updated_at: Date;
  stocks?: Stock[];
  info_rule?: StockInfoRule;
  vessel?: Vessel[];
  stock_reservations?: StockReservation[];
}

export interface Vessel {
  id: number;
  name: string;
  weight: Decimal;
  material_id?: number;
  material?: Material;
  created_at: Date;
  updated_at: Date;
  stocks?: Stock[];
}

export interface Supplier {
  id: number;
  name: string;
  contact?: string;
  address?: string;
  created_at: Date;
  updated_at: Date;
  materials?: Material[];
}

export interface Manufacturer {
  id: number;
  name: string;
  location?: string;
  contact?: string;
  created_at: Date;
  updated_at: Date;
  materials?: Material[];
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  created_at: Date;
  updated_at: Date;
  materials?: Material[];
} 