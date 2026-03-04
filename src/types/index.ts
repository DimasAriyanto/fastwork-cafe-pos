export type Role = 'OWNER' | 'CASHIER';

export interface User {
  id: string;
  username: string;
  role: Role;
}

export interface AuthState {
  user: User | null;
  token: string | null;
}
