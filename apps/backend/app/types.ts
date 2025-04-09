import type { Session, User } from 'lucia';
import { db } from './database';

type DatabaseInstance = typeof db;

export interface AppVariables {
  db: DatabaseInstance;
  user: User | null;
  session: Session | null;
}

export type AppEnv = {
  Variables: AppVariables;
};
