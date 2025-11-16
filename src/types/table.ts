import type { ColumnDef } from '@tanstack/react-table'

/**
 * Strictly typed column definition
 */
export type StrictColumnDef<TData> = ColumnDef<TData, unknown>

/**
 * Helper to create type-safe column definitions
 */
export function createColumns<TData>(columns: StrictColumnDef<TData>[]): StrictColumnDef<TData>[] {
  return columns
}

/**
 * Type-safe accessor key builder
 * Simplified to avoid excessive type instantiation depth
 */
export type AccessorKey<T> = keyof T | string

/**
 * Create column with strict accessor typing
 */
export function createAccessorColumn<TData, TKey extends AccessorKey<TData>>(
  key: TKey,
  config: Omit<StrictColumnDef<TData>, 'accessorKey'> & { accessorKey?: never }
): StrictColumnDef<TData> {
  return {
    ...config,
    accessorKey: key,
  } as StrictColumnDef<TData>
}
