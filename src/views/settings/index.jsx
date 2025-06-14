'use client'

import dynamic from 'next/dynamic'

// React Imports
import { useEffect, useState } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid'
import Tab from '@mui/material/Tab'
import TabContext from '@mui/lab/TabContext'
import TabPanel from '@mui/lab/TabPanel'

// Component Imports
import CustomTabList from '@core/components/mui/TabList'

import { Company } from './company'

import { Users } from './users'
import BillingPlans from './signature'
import Security from './security'
import Integrations from '@/views/settings/integrations'
import { useTitle } from '@/contexts/TitleProvider'

//const NotificationsTab = dynamic(() => import('@views/pages/account-settings/notifications'))

export const ViewSettings = ({ company, integrations }) => {

  const { setTitle } = useTitle()

  useEffect(() => {
    setTitle(['Configurações'])
  }, [])
    
  // Vars
  const tabContentList = {
    'company': <Company company={company} />,
    'users': <Users />,
    'security': <Security />,
    'billing-plans': <BillingPlans />,
    //'notifications': <NotificationsTab />,
    'connections': <Integrations integrations={integrations} />
  }

  const [activeTab, setActiveTab] = useState('company')

  return (
    <TabContext value={activeTab}>
      <Grid container spacing={6}>
        <Grid size={{ xs: 12 }}>
          <CustomTabList onChange={(event, value) => setActiveTab(value)} variant='scrollable'>
            <Tab label='Empresa' icon={<i className='ri-group-line' />} iconPosition='start' value='company' />
            <Tab label='Usuários' icon={<i className='ri-lock-2-line' />} iconPosition='start' value='users' />
            <Tab label='Certificado' icon={<i className='ri-shield-check-line' />} iconPosition='start' value='security' />
            <Tab label='Assinatura' icon={<i className='ri-bookmark-line' />} iconPosition='start' value='billing-plans' />
            <Tab label='Notifications' icon={<i className='ri-notification-4-line' />} iconPosition='start' value='notifications' />
            <Tab label='Integrações' icon={<i className='ri-link-m' />} iconPosition='start' value='connections' />
          </CustomTabList>
        </Grid>
        <Grid size={{ xs: 12 }}>
          <TabPanel value={activeTab} className='p-0'>
            {tabContentList[activeTab]}
          </TabPanel>
        </Grid>
      </Grid>
    </TabContext>
  )
}