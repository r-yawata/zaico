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
  createdAt: Date;
  updatedAt: Date;
}

export interface Stock {
  id: number;
  productName: string;
  lot: string;
  status: SampleStatus;
  registrationDate: Date;
  updateDate: Date;
  remarks?: string;
  expirationDate: Date;
  storageDate: Date;
  currentWeight: Decimal;
  netWeight: Decimal;
  vesselWeight: Decimal;
  inboundWeight: Decimal;
  materialId: number;
  material?: Material;
  materialName?: string;
  materialSpecification?: string;
  materialCategoryId?: number;
  materialCategoryName?: string;
  vesselId: number;
  vessel?: Vessel;
  vesselName?: string;
  creatorId: number;
  creator?: User;
  creatorUsername?: string;
  creatorEmail?: string;
  extraConfig?: Record<string, any>;
  parentStockId?: number;
  parentStock?: Stock;
  childStocks?: Stock[];
  createdAt: Date;
  updatedAt: Date;
}

export interface StockHistory {
  id: number;
  stockId: number;
  stock: Stock;
  action: string;
  weightChange: Decimal;
  performedAt: Date;
  remarks?: string;
  performedById: number;
  performedBy: User;
}

export interface StockExtraConfig {
  id: number;
  fieldName: string;
  fieldType: string;
  selectOptions?: StockExtraConfigSelect[];
}

export interface StockExtraConfigSelect {
  id: number;
  name: string;
  value: string;
  extraConfigId: number;
  extraConfig: StockExtraConfig;
}

export interface StockInfoRule {
  id: number;
  materialId: number;
  material: Material;
  allowedErrorPercentage: Decimal;
}

export interface InventorySplitHistory {
  id: number;
  parentStockId: number;
  parentStock: Stock;
  childStockIds: number[];
  splitDate: Date;
  splitDetails: Record<string, any>;
  performedById: number;
  performedBy: User;
}

export interface StockReservation {
  id: number;
  materialId: number;
  material: Material;
  lot: string;
  usage?: string;
  requiredAmount: Decimal;
  outboundDate: Date;
  returnDate: Date;
  testName?: string;
  remarks?: string;
  creatorId: number;
  creator: User;
  createdAt: Date;
  updatedAt: Date;
}

// // スネークケース形式の互換性インターフェース (データベース連携用)
// export interface Material_SnakeCase {
//   id: number;
//   name: string;
//   specification?: string;
//   custom_attributes?: Record<string, any>;
//   package_count?: number;
//   unit_weight?: string;
//   supplier_id: number;
//   supplier?: Supplier_SnakeCase;
//   manufacturer_id: number;
//   manufacturer?: Manufacturer_SnakeCase;
//   category_id: number;
//   category?: Category_SnakeCase;
//   note?: string;
//   category_name?: string;
//   manufacturer_name?: string;
//   supplier_name?: string;
//   created_at: Date;
//   updated_at: Date;
//   stocks?: Stock_SnakeCase[];
//   info_rule?: StockInfoRule_SnakeCase;
//   vessel?: Vessel_SnakeCase[];
//   stock_reservations?: StockReservation_SnakeCase[];
// }

// export interface Vessel_SnakeCase {
//   id: number;
//   name: string;
//   weight: Decimal;
//   material_id?: number;
//   material?: Material_SnakeCase;
//   created_at: Date;
//   updated_at: Date;
//   stocks?: Stock_SnakeCase[];
// }

// export interface Supplier_SnakeCase {
//   id: number;
//   name: string;
//   contact?: string;
//   address?: string;
//   created_at: Date;
//   updated_at: Date;
//   materials?: Material_SnakeCase[];
// }

// export interface Manufacturer_SnakeCase {
//   id: number;
//   name: string;
//   location?: string;
//   contact?: string;
//   created_at: Date;
//   updated_at: Date;
//   materials?: Material_SnakeCase[];
// }

// export interface Category_SnakeCase {
//   id: number;
//   name: string;
//   description?: string;
//   created_at: Date;
//   updated_at: Date;
//   materials?: Material_SnakeCase[];
// }

// export interface Stock_SnakeCase {
//   id: number;
//   product_name: string;
//   lot: string;
//   status: SampleStatus;
//   registration_date: Date;
//   update_date: Date;
//   remarks?: string;
//   expiration_date: Date;
//   storage_date: Date;
//   current_weight: Decimal;
//   net_weight: Decimal;
//   vessel_weight: Decimal;
//   inbound_weight: Decimal;
//   material_id: number;
//   material: Material_SnakeCase;
//   vessel_id?: number;
//   vessel?: Vessel_SnakeCase;
//   creator_id: number;
//   creator: User;
//   extra_config?: Record<string, any>;
//   parent_stock_id?: number;
//   parent_stock?: Stock_SnakeCase;
//   child_stocks?: Stock_SnakeCase[];
//   created_at: Date;
//   updated_at: Date;
// }

// export interface StockInfoRule_SnakeCase {
//   id: number;
//   material_id: number;
//   material: Material_SnakeCase;
//   allowed_error_percentage: Decimal;
// }

// export interface StockReservation_SnakeCase {
//   id: number;
//   material_id: number;
//   material: Material_SnakeCase;
//   lot: string;
//   usage?: string;
//   required_amount: Decimal;
//   outbound_date: Date;
//   return_date: Date;
//   test_name?: string;
//   remarks?: string;
//   creator_id: number;
//   creator: User;
//   created_at: Date;
//   updated_at: Date;
// }

// 以下のインターフェースを追加して型エラーを解決
export interface Material {
  id: number;
  name: string;
  specification?: string;
  customAttributes?: Record<string, any>;
  packageCount?: number;
  unitWeight?: string;
  supplierId: number;
  supplier?: Supplier;
  manufacturerId: number;
  manufacturer?: Manufacturer;
  categoryId: number;
  category?: Category;
  note?: string;
  categoryName?: string;
  manufacturerName?: string;
  supplierName?: string;
  createdAt: Date;
  updatedAt: Date;
  stocks?: Stock[];
  infoRule?: StockInfoRule;
  vessel?: Vessel[];
  stockReservations?: StockReservation[];
}

export interface Vessel {
  id: number;
  name: string;
  weight: Decimal;
  materialId?: number;
  material?: Material;
  createdAt: Date;
  updatedAt: Date;
  stocks?: Stock[];
}

export interface Supplier {
  id: number;
  name: string;
  contact?: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
  materials?: Material[];
}

export interface Manufacturer {
  id: number;
  name: string;
  location?: string;
  contact?: string;
  createdAt: Date;
  updatedAt: Date;
  materials?: Material[];
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  materials?: Material[];
} 