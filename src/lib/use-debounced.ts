"use client"

import { useEffect, useState } from "react"

// Valor que só muda depois de um intervalo sem alterações (busca enquanto digita, sem uma consulta por tecla)
export function useDebounced<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}
