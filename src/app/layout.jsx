// Next Imports
import { headers } from 'next/headers'

// MUI Imports
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript'

// Third-party Imports
import 'react-perfect-scrollbar/dist/css/styles.css'

// Component Imports
import ClientLayoutWrapper from '@/components/ClientLayoutWrapper' // 1. IMPORTE O NOVO WRAPPER

// HOC Imports
import TranslationWrapper from '@/hocs/TranslationWrapper'

// Config Imports
import { i18n } from '@configs/i18n'

// Util Imports
import { getSystemMode } from '@core/utils/serverHelpers'

// Style Imports
import '@/app/globals.css'

// Generated Icon CSS Imports
import '@assets/iconify-icons/generated-icons.css'
// import RouteProgressBar from '@/components/RouteProgressBar' // <-- 2. REMOVA ESTE IMPORT

export const metadata = {
  title: 'Sistema',
  description: 'Gestão empresarial'
}

const RootLayout = async ({ children }) => {
  // Vars
  const headersList = await headers()
  const systemMode = await getSystemMode()
  const direction = i18n.langDirection[i18n.defaultLocale]

  return (
    <TranslationWrapper headersList={headersList} lang={i18n.defaultLocale}>
      <html id='__next' lang={i18n.defaultLocale} dir={direction} suppressHydrationWarning>
        <body className='flex is-full min-bs-full flex-auto flex-col'>
          <InitColorSchemeScript attribute='data' defaultMode={systemMode} />
          {/* <RouteProgressBar /> */} {/* <-- 3. REMOVIDO DAQUI */}

          {/* 4. USE O WRAPPER AQUI */}
          <ClientLayoutWrapper>
            {children}
          </ClientLayoutWrapper>
        </body>
      </html>
    </TranslationWrapper>
  )
}

export default RootLayout