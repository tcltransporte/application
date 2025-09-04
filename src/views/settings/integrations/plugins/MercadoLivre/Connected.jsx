"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import axios from "axios"
import { MercadoLivreConnect } from "@/app/server/settings/integrations/mercado-livre/index.controller"
import Successfully from "./Successfully"

const ErrorComponent = ({ message }) => (
  <div style={{ color: 'red' }}>Ocorreu um erro: {message || "Erro desconhecido"}</div>
)

const LoadingComponent = () => <div>Conectando com o Mercado Livre...</div>

export const Connected = () => {
  const searchParams = useSearchParams()
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const connect = async () => {
      const code = searchParams?.get('code')
      if (!code) {
        setError("Código não encontrado na URL")
        setLoading(false)
        return
      }

      try {
        // Chamada ao endpoint server-side que troca o code pelo token
        await MercadoLivreConnect({refresh_token: code})
        setSuccess(true)
      } catch (err) {
        console.error(err)
        setError("Falha ao conectar com o Mercado Livre")
      } finally {
        setLoading(false)
      }
    }

    connect()

  }, [])

  if (loading) return <LoadingComponent />
  if (error) return <ErrorComponent message={error} />
  if (success) return <Successfully />

  return null
}
