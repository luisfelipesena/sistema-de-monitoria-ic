import { clsx, type ClassValue } from "clsx"
import type { ClientResponse } from "hono/client"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const TODO = <const T>(_: T & { __brand: "TODO" }) => {}

export type RpcType<T extends (...args: any[]) => any> = {
  input: Parameters<T>[0]
  output: Awaited<Awaited<ReturnType<T>>["json"]>
}
export const rpcReturn = async <T extends unknown>(clientResponse: ClientResponse<T, any, "json">) => {
  const data = await clientResponse.json()
  if (!clientResponse.ok) {
    throw new Error((data as { message: string })?.message || "Ops, algo deu errado")
  }
  return data
}
