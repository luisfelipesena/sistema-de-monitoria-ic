"use client"

import * as React from "react"

interface ToastProps {
  id: string
  message: string
  type?: "success" | "error" | "warning" | "info"
  duration?: number
}

interface ToasterProps {
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left"
}

const ToastContext = React.createContext<{
  addToast: (toast: Omit<ToastProps, "id">) => void
  removeToast: (id: string) => void
}>({
  addToast: () => {},
  removeToast: () => {},
})

export const useToast = () => React.useContext(ToastContext)

const Toaster = ({ position = "bottom-right" }: ToasterProps) => {
  const [toasts, setToasts] = React.useState<ToastProps[]>([])

  const addToast = React.useCallback((toast: Omit<ToastProps, "id">) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast = { ...toast, id }
    setToasts((prev) => [...prev, newToast])

    const duration = toast.duration || 3000
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, duration)
  }, [])

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const positionClasses = {
    "top-right": "top-4 right-4",
    "top-left": "top-4 left-4",
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4",
  }

  const typeStyles = {
    success: "bg-green-500 text-white",
    error: "bg-red-500 text-white",
    warning: "bg-yellow-500 text-white",
    info: "bg-blue-500 text-white",
  }

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      <div className={`fixed z-50 flex flex-col gap-2 ${positionClasses[position]}`}>
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-4 py-2 rounded-md shadow-lg transition-all duration-300 ${
              toast.type ? typeStyles[toast.type] : "bg-gray-800 text-white"
            }`}
            onClick={() => removeToast(toast.id)}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

// Export toast function for compatibility
export const toast = {
  success: (message: string) => {},
  error: (message: string) => {},
  warning: (message: string) => {},
  info: (message: string) => {},
}

export { Toaster }
