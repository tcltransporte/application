// Auth
import { getServerSession } from 'next-auth'
import { authOptions } from '@/libs/auth'

// Database
import { AppContext } from '@/database'

// Components / Views
import { ViewSettings } from '@/views/settings'
import _ from 'lodash'
import { Sequelize } from 'sequelize'

import { getCompany } from '@/views/settings/index.controller'
import { getIntegrations } from '@/views/settings/integrations/index.controller'


export const metadata = {
  title: `${process.env.TITLE} - Configurações`,
}

export default async function Settings() {

  const company = await getCompany()
  const integrations = await getIntegrations()

  return <ViewSettings
    company={company}
    integrations={integrations}
  />

}