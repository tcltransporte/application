// app/components/ClientLayoutWrapper.js
'use client'

import dynamic from 'next/dynamic'

const RouteProgressBar = dynamic(() => import('@/components/RouteProgressBar'), {
  ssr: false,
  loading: () => <div style={{ height: 4 }} />, // reserva espaço
})

export default function ClientLayoutWrapper({ children }) {
  return (
    <>
      <RouteProgressBar />
      {children}
    </>
  )
}
