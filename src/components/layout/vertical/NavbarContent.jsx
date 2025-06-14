'use client'

import classnames from 'classnames'
import NavToggle from './NavToggle'
import UserDropdown from '@components/layout/shared/UserDropdown'
import CompanySwitcherDropdown from '@components/layout/shared/CompanySwitcherDropdown'
import { verticalLayoutClasses } from '@layouts/utils/layoutClasses'
import { Breadcrumbs, Typography } from '@mui/material'
import { useTitle } from '@/contexts/TitleProvider'

const NavbarContent = () => {

  const { titles } = useTitle()

  return (
    <div
      className={classnames(
        verticalLayoutClasses.navbarContent,
        'flex items-center justify-between gap-4 is-full'
      )}
    >
      <div className='flex items-center gap-[7px]'>
        <NavToggle />
        <Breadcrumbs aria-label="breadcrumb" separator=">">
          {titles.map((page, index) => {
            const isLast = index === titles.length - 1
            return (
              <Typography
                key={page}
                variant="h5"
                fontWeight={isLast ? 600 : undefined}
                color={isLast ? undefined : 'text.secondary'}
              >
                {page}
              </Typography>
            )
          })}
        </Breadcrumbs>
      </div>

      <div className='flex items-center'>
        <CompanySwitcherDropdown />
        <UserDropdown />
      </div>
    </div>
  )
}

export default NavbarContent