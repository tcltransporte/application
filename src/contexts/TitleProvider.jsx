'use client'

import { createContext, useContext, useState } from 'react'

const TitleContext = createContext()

export const TitleProvider = ({ children }) => {

  const [titles, setTitle] = useState([])

  return (
    <TitleContext.Provider value={{ titles, setTitle }}>
      {children}
    </TitleContext.Provider>
  )
}

export const useTitle = () => useContext(TitleContext)