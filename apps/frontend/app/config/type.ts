export type Dry<T> = T extends Date
  ? string
  : T extends Array<infer U>
    ? Dry<U>[]
    : T extends object
      ? { [K in keyof T]: Dry<T[K]> }
      : T
