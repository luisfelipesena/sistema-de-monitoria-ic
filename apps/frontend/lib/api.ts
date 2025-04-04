import { type AppType } from "@sistema-de-monitoria-ic/backend"
import axios from "axios"
import { hc } from "hono/client"

// TODO: Replace with your actual backend URL in production/staging
const getBaseUrl = () => {
  if (typeof window === "undefined") {
    // Server-side rendering or build process
    return process.env.INTERNAL_BACKEND_URL || "http://localhost:3000"
  }
  // Client-side
  return process.env.NEXT_PUBLIC_BACKEND_URL || "/"
}

// Standard Axios instance (useful for direct calls if needed)
export const axiosInstance = axios.create({
  baseURL: `${getBaseUrl()}/api`,
  withCredentials: true, // Send cookies with requests
  headers: {
    "Content-Type": "application/json",
  },
})

// Hono RPC client - Provides type safety based on backend routes
export const apiClient = hc<AppType>(getBaseUrl())

// You can use either axiosInstance for traditional REST calls
// or apiClient for type-safe RPC-style calls with Hono.
// For auth, apiClient offers great type safety for request/response shapes. 