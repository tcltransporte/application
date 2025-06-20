'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Smile } from 'lucide-react'
import { useTitle } from '@/contexts/TitleProvider'

export default function WelcomeCard() {

    const {setTitle} = useTitle()

    useEffect(() => {

        setTitle(['Home'])

    }, [])

  const [saudacao, setSaudacao] = useState('')

  useEffect(() => {
    const hora = new Date().getHours()

    if (hora >= 5 && hora < 12) {
      setSaudacao('Bom dia')
    } else if (hora >= 12 && hora < 18) {
      setSaudacao('Boa tarde')
    } else {
      setSaudacao('Boa noite')
    }
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-white dark:bg-zinc-900 shadow-xl rounded-2xl p-6 max-w-xl mt-10"
    >
      <div className="flex items-center gap-4">
        <div className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded-full">
          <Smile className="text-yellow-500 w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">
            {saudacao}, seja bem-vindo(a)!
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
            Esperamos que você tenha um dia produtivo.
          </p>
        </div>
      </div>
    </motion.div>
  )
}
