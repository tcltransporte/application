// Components / Views
import { ViewSettings } from '@/views/settings'

import { getCompany } from '@/app/server/settings/index.controller'
import { getIntegrations } from '@/app/server/settings/integrations/index.controller'

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