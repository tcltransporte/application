'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { LinearProgress, Box } from '@mui/material'

export default function RouteProgressBar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)

  const isLoadingRef = useRef(false)
  const prevFullPathRef = useRef(`${pathname}?${searchParams}`)

  // Efeito 1: Iniciar instantaneamente em cliques de link (Handler)
  useEffect(() => {
    const handleClick = (e) => {
      const link = e.target.closest('a')
      if (!link) return

      // 🚫 (1) Ignora links marcados explicitamente
      if (link.dataset.ignoreProgress === 'true') return

      // 🚫 (2) Ignora cliques programáticos (não do usuário)
      if (!e.isTrusted) return

      // 🚫 (3) Ignora links que disparam downloads (ex: Blob ou Base64)
      const href = link.getAttribute('href')
      if (!href || href.startsWith('#') || href.startsWith('blob:') || href.startsWith('data:')) return

      const linkUrl = new URL(link.href)
      const currentUrl = new URL(window.location.href)

      const isInternal = linkUrl.origin === currentUrl.origin
      const isNewRoute =
        linkUrl.pathname !== currentUrl.pathname ||
        linkUrl.search !== currentUrl.search

      if (isInternal && isNewRoute && !isLoadingRef.current) {
        setProgress(10)
        setIsLoading(true)
        isLoadingRef.current = true
      }
    }

    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  // Efeito 2: Efeito "Trickle" (avanço gradual)
  useEffect(() => {
    let timer = null
    if (isLoading) {
      timer = setInterval(() => {
        setProgress((prevProgress) => {
          if (prevProgress >= 90) {
            clearInterval(timer)
            return 90
          }
          const diff = Math.random() * 10
          return Math.min(prevProgress + diff, 90)
        })
      }, 800)
    }

    return () => {
      if (timer) {
        clearInterval(timer)
      }
    }
  }, [isLoading])

  // Efeito 3: Finalizar a barra na mudança de rota
  useEffect(() => {
    const newFullPath = `${pathname}?${searchParams}`
    const oldFullPath = prevFullPathRef.current

    if (newFullPath !== oldFullPath) {
      prevFullPathRef.current = newFullPath

      if (!isLoadingRef.current) {
        setProgress(10)
        setIsLoading(true)
        isLoadingRef.current = true
      }

      // --- Finaliza a barra ---
      
      // 1. Força a barra a 100%
      setProgress(100)

      // 2. Espera a animação do MUI (300ms) + um buffer e então esconde
      const hideTimer = setTimeout(() => {
        setIsLoading(false)
        isLoadingRef.current = false
      }, 400) 

      // 3. Reseta o valor do progresso para a próxima navegação
      const resetTimer = setTimeout(() => {
        setProgress(0)
      }, 700) 

      return () => {
        clearTimeout(hideTimer)
        clearTimeout(resetTimer)
      }
    }
  }, [pathname, searchParams]) 

  // Renderiza o componente MUI
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        zIndex: 9999,
        height: isLoading ? '4px' : '0px',
        transition: 'height 0.3s ease-out',
      }}
    >
      {isLoading && (
        <LinearProgress
          variant="determinate"
          value={progress}
        />
      )}
    </Box>
  )
}