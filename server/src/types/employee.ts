export interface Employee {
  id: number;
  name: string;
  position: string;
  imagePath: string | null;
  outletId: number;
  isActive: boolean; // 👈 Tambah ini
}

export interface CreateEmployeeRepoInput {
  userId: number; // 👈 Tambah ini
  name: string;
  position: string;
  imagePath: string | null;
  outletId: number;
  isActive: boolean;
}

export interface UpdateEmployeeInput extends Partial<CreateEmployeeRepoInput> {
  name?: string;
  position?: string;
  imagePath?: string | null;
  outletId?: number;
  isActive?: boolean; // 👈 Tambah ini
}