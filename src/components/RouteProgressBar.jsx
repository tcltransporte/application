'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'

// Configuração do NProgress (igual à sua)
NProgress.configure({
  showSpinner: false,
  speed: 400,
  trickleSpeed: 150,
  minimum: 0.08,
})

export default function RouteProgressBar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isLoadingRef = useRef(false)

  // Armazena a URL completa (path + search) para detectar *todas* as mudanças
  const fullPath = `${pathname}?${searchParams}`
  const prevFullPathRef = useRef(fullPath)

  // Efeito 1: Iniciar instantaneamente em cliques de link
  // Este efeito só precisa rodar uma vez para adicionar o listener global.
  useEffect(() => {
    const handleClick = (e) => {
      const link = e.target.closest('a')
      if (!link) return

      const href = link.getAttribute('href')
      const isInternal = href && href.startsWith('/') && !href.startsWith('//')
      
      // Pega o caminho *atual* da ref
      const currentFullPath = prevFullPathRef.current

      // Só inicia se for interno, não estiver carregando, e for uma ROTA DIFERENTE
      if (isInternal && !isLoadingRef.current && href !== currentFullPath) {
        NProgress.start()
        isLoadingRef.current = true
      }
    }

    document.addEventListener('click', handleClick)

    // Limpa o listener quando o componente (layout) for desmontado
    return () => {
      document.removeEventListener('click', handleClick)
    }
  }, []) // Dependência vazia: roda apenas no mount

  // Efeito 2: Finalizar a barra (e iniciar, se necessário) em TODAS as mudanças de rota
  useEffect(() => {
    const newFullPath = `${pathname}?${searchParams}`
    const oldFullPath = prevFullPathRef.current

    // Verifica se a rota *realmente* mudou
    if (newFullPath !== oldFullPath) {
      // Atualiza a ref com o novo caminho
      prevFullPathRef.current = newFullPath

      // Se o 'isLoadingRef' for falso, significa que a navegação
      // *não* foi iniciada pelo clique (ex: router.push, back/fwd).
      // Nesse caso, iniciamos a barra agora.
      if (!isLoadingRef.current) {
        NProgress.start()
      }

      // Finaliza a barra de progresso.
      // Usamos um pequeno delay para garantir que a barra seja visível
      // caso ela tenha acabado de ser iniciada (no 'if' acima).
      const timer = setTimeout(() => {
        NProgress.done()
        isLoadingRef.current = false // Reseta o estado
      }, 100) // Um delay curto para suavidade

      return () => {
        clearTimeout(timer)
      }
    }
  }, [pathname, searchParams]) // Roda sempre que o pathname OU searchParams mudarem

  return null // Este componente não renderiza nada
}