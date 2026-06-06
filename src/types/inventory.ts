export type StockMovementType = 'PURCHASE' | 'RETURN' | 'ADJUSTMENT' | 'SALE' | 'DAMAGE' | 'LOSS';

export interface StockMovement {
  _id: string;
  productId: string;
  quantity: number;
  type: StockMovementType;
  reason?: string;
  reference?: string;
  previousStock: number;
  newStock: number;
  createdAt: string;
  createdBy?: string;
}

export interface AddStockRequest {
  quantity: number;
  type: 'PURCHASE' | 'RETURN' | 'ADJUSTMENT';
  reason?: string;
  reference?: string;
}

export interface RemoveStockRequest {
  quantity: number;
  type: 'DAMAGE' | 'LOSS' | 'ADJUSTMENT';
  reason?: string;
  reference?: string;
}