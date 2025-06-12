import { useEffect, useState } from 'react'

export function useLocalStorage<T>(key: string, initialValue: T) {
  if (typeof window === 'undefined') {
    return [initialValue, () => {}] as const
  }

  const [storedValue, setStoredValue] = useState<T>(() => {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : initialValue
  })

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(storedValue))
  }, [storedValue, key])

  return [storedValue, setStoredValue] as const
}
