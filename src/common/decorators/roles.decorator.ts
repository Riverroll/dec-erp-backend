import { SetMetadata } from '@nestjs/common';

export enum Role {
  SUPER_USER = 'SUPER_USER',
  SUPER_ADMIN = 'SUPER_ADMIN',
  SALES = 'SALES',
  FINANCE = 'FINANCE',
}

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
