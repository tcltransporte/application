// components/RouteProgressBar.tsx
'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { LinearProgress } from '@mui/material'

let timeout

const RouteProgressBar = () => {
  const pathname = usePathname()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Começa o carregamento
    setLoading(true)

    // Timeout falso só para mostrar o carregamento (ajuste conforme necessário)
    clearTimeout(timeout)
    timeout = setTimeout(() => {
      setLoading(false)
    }, 400) // tempo de exibição

    return () => clearTimeout(timeout)
  }, [pathname])

  return loading ? (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 1301 }}>
      <LinearProgress color="primary" />
    </div>
  ) : null
}

export default RouteProgressBar