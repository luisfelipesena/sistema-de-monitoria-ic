import { useState, useCallback } from 'react'

interface DialogState<T = unknown> {
  isOpen: boolean
  data: T | null
}

export function useDialogState<T = unknown>(initialState = false) {
  const [state, setState] = useState<DialogState<T>>({
    isOpen: initialState,
    data: null,
  })

  const open = useCallback((data?: T) => {
    setState({ isOpen: true, data: data ?? null })
  }, [])

  const close = useCallback(() => {
    setState({ isOpen: false, data: null })
  }, [])

  const toggle = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: !prev.isOpen }))
  }, [])

  return {
    isOpen: state.isOpen,
    data: state.data,
    open,
    close,
    toggle,
  }
}
