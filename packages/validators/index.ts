// Shared Zod schemas will be re-exported here for tRPC

export {};

export * from './departamento';
export * from './user';
export * from './signature';
export * from './projeto-documento';
export * from './assinatura-enums';
export * from './project';
export * from './projeto-table';

import { userRoleEnum } from '../../src/server/database/schema';
export const userRoles = userRoleEnum.enumValues;