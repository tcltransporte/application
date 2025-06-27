// Next Imports
import { redirect } from 'next/navigation'

// Third-party Imports
import { getServerSession } from 'next-auth'

// Config Imports
import themeConfig from '@configs/themeConfig'

// Util Imports
import { getLocalizedUrl } from '@/utils/i18n'

const GuestOnlyRoute = async ({ children }) => {
  const session = await getServerSession()

  if (session) {
    redirect(themeConfig.homePageUrl)
  }

  return children
}

export default GuestOnlyRoute
