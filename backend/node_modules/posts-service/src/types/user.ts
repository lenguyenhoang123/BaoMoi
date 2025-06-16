export type UserRole = 'admin' | 'editor' | 'author' | 'user';

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  avatar?: string;
  created_at: Date;
  updated_at: Date;
}
