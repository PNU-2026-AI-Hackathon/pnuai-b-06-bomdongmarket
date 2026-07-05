import type { UserRole } from '../../types/api';

export interface LoginFormState {
  email: string;
  password: string;
  role: UserRole;
}
