import { useEffect, useState } from 'react'

export function useLocalStorage<T>(key: string, initialValue: T) {
  if (typeof window === 'undefined') {
    return [initialValue, () => undefined] as const
  }

  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (e) {
      console.warn(`Error reading localStorage key "${key}":`, e)
      return initialValue
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(storedValue))
    } catch (e) {
      console.warn(`Error setting localStorage key "${key}":`, e)
    }
  }, [storedValue, key])

  return [storedValue, setStoredValue] as const
}
