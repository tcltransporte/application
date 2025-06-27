// Component Imports
import Providers from '@components/Providers'
import BlankLayout from '@layouts/BlankLayout'

// Config Imports
import { i18n } from '@configs/i18n'

// Util Imports
import { getSystemMode } from '@core/utils/serverHelpers'
import RouteProgressBar from '@/components/RouteProgressBar'

const Layout = async ({ children }) => {

  // Vars
  const direction = i18n.langDirection[i18n.defaultLocale]
  const systemMode = await getSystemMode()

  return (
    <Providers direction={direction}>
      <RouteProgressBar />
      <BlankLayout systemMode={systemMode}>{children}</BlankLayout>
    </Providers>
  )
}

export default Layout
