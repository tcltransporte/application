'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'

import { Box, CircularProgress, Typography } from '@mui/material'

function LoadingSpinner() {
  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'background.default',
        color: 'text.primary',
        px: 2,
      }}
    >
      <CircularProgress size={60} thickness={5} />
      <Typography
        variant="h6"
        sx={{ mt: 2, fontWeight: 'medium', letterSpacing: 1.2, textTransform: 'uppercase' }}
      >
        Carregando...
      </Typography>
    </Box>
  )
}

export default function AuthGuard({ children, locale }) {

  const { data: session, status } = useSession()
  const router = useRouter()
  const hasRedirected = useRef(false)

  useEffect(() => {
    if (hasRedirected.current) return

    // Usuário autenticado, mas inativo
    if (status === 'authenticated' && session?.isActive === false) {
      hasRedirected.current = true

      // Primeiro faz signOut, depois redireciona
      signOut({ redirect: false }).then(() => {
        router.replace(`/${locale}/login`)
      })

      return
    }

    // Usuário não autenticado
    if (status === 'unauthenticated') {
      hasRedirected.current = true
      router.replace(`/${locale}/login`)
    }

  }, [session, status, locale, router])

  if (status === 'loading') return <LoadingSpinner />

  if (!session) return null

  return <>{children}</>

}
