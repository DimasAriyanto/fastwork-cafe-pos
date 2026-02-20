export interface CreateToppingRepoInput {
  name: string;
  price: string;
  outletId: number;
  isAvailable?: boolean;
}

export interface UpdateToppingRequest {
  name?: string;
  price?: string;
  isAvailable?: boolean;
}