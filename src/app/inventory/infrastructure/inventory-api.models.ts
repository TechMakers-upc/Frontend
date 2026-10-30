export interface SparePartApiResource {
  readonly id: number;
  readonly plantId: number;
  readonly sku: string;
  readonly name: string;
  readonly category: string;
  readonly unit: string;
  readonly stock: number;
  readonly minStock: number;
  readonly location: string;
  readonly level: string;
}

export interface SaveSparePartRequest {
  readonly plantId: number;
  readonly sku: string;
  readonly name: string;
  readonly category: string;
  readonly unit: string;
  readonly minStock: number;
  readonly location: string;
  readonly initialStock: number | null;
}

export interface StockMovementApiResource {
  readonly id: number;
  readonly plantId: number;
  readonly partId: number;
  readonly type: string;
  readonly quantity: number;
  readonly stockAfter: number;
  readonly reason: string;
  readonly at: string;
  readonly userId: number;
  readonly workOrderId: number | null;
}

export interface ReceiveStockRequest {
  readonly quantity: number;
  readonly reason: string;
}

export interface AdjustStockRequest {
  readonly countedStock: number;
  readonly reason: string;
}

export interface ConsumeStockRequest {
  readonly quantity: number;
  readonly workOrderId: number | null;
  readonly reason: string;
}
