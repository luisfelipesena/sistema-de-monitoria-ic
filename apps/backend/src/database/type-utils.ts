import type { db } from '@/database';
import type {
  BuildQueryResult,
  DBQueryConfig,
  ExtractTablesWithRelations,
} from 'drizzle-orm';
import * as schema from './schema';

type Schema = typeof schema;

export type Database = typeof db;
type TSchema = ExtractTablesWithRelations<Schema>;

// https://github.com/drizzle-team/drizzle-orm/issues/695#issuecomment-1881454650
export type IncludeRelation<TableName extends keyof TSchema> = DBQueryConfig<
  'one' | 'many',
  boolean,
  TSchema,
  TSchema[TableName]
>['with'];

export type InferResultType<
  TableName extends keyof TSchema,
  With extends IncludeRelation<TableName> | undefined = undefined,
> = BuildQueryResult<
  TSchema,
  TSchema[TableName],
  {
    with: With;
  }
>;

type Value =
  | 'byte'
  | 'password'
  | 'regex'
  | 'uuid'
  | 'email'
  | 'hostname'
  | 'idn-email'
  | 'idn-hostname'
  | 'iri'
  | 'iri-reference'
  | 'ipv4'
  | 'ipv6'
  | 'uri'
  | 'uri-reference'
  | 'uri-template'
  | 'url'
  | 'date-time'
  | 'date'
  | 'time'
  | 'duration'
  | 'json-pointer'
  | 'relative-json-pointer';
export type Format<T extends Value> = string;
type IsExactlyDate<T> = [T] extends [Date]
  ? [Date] extends [T]
  ? true
  : false
  : false;

// TODO remove once no longer needed (script executions need them for now)
export type TransformDates<T> = T extends unknown
  ? IsExactlyDate<NonNullable<T>> extends true
  ? [T] extends [null]
  ? (string & Format<'date-time'>) | null
  : string & Format<'date-time'>
  : T extends (infer U)[]
  ? TransformDates<U>[]
  : T extends object
  ? { [K in keyof T]: TransformDates<T[K]> }
  : T
  : never;

/**
 * A stricter version of TypeScript's Omit utility type that ensures the omitted keys cannot be present.
 * While Omit simply removes properties from the type, HardOmit makes them 'never' to prevent accidental usage.
 *
 * @template T - The source type to omit properties from
 * @template K - Union of property keys to be omitted
 *
 * @example
 * interface User {
 *   id: number;
 *   name: string;
 *   email: string;
 * }
 *
 * // This type will have 'name' and 'email', and 'id' will be 'never'
 * type UserWithoutId = HardOmit<User, 'id'>;
 */
export type HardOmit<T, K extends keyof T> = Omit<T, K> & {
  [P in K]?: never;
};