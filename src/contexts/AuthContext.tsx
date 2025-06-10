"use client"

import { UserRole } from "@/types/enums"
import { api } from "@/utils/api"
import { createContext, ReactNode, useContext, useEffect, useState } from "react"

// Define the user type
type User = {
  id: number
  username: string
  email: string
  role: UserRole
  assinaturaDefault?: string | null
}

// Define the auth context type
type AuthContextType = {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  logout: () => Promise<void>
}

// Create the context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  logout: async () => {},
})

// Auth provider props
interface AuthProviderProps {
  children: ReactNode
}

// Custom hook to use auth context
export const useAuth = () => useContext(AuthContext)

// Auth provider component
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // tRPC hooks
  const utils = api.useUtils()
  const { mutateAsync: logoutMutation } = api.auth.logout.useMutation()
  const { data: userData, isLoading: isLoadingUser } = api.auth.me.useQuery(undefined, {
    refetchOnWindowFocus: false,
  })

  // Update user state when data is fetched
  useEffect(() => {
    if (!isLoadingUser) {
      setUser(userData || null)
      setIsLoading(false)
    }
  }, [userData, isLoadingUser])

  // Logout function
  const logout = async () => {
    try {
      await logoutMutation()

      await utils.invalidate()

      setUser(null)

      document.cookie = "auth-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;"

      window.location.href = "/auth/login"
    } catch (error) {
      console.error("Logout error:", error)

      await utils.invalidate()
      setUser(null)
      document.cookie = "auth-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;"

      window.location.href = "/auth/login"
    }
  }

  // Context value
  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
