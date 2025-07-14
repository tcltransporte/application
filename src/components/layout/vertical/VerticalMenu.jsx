'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useTheme } from '@mui/material/styles'
import PerfectScrollbar from 'react-perfect-scrollbar'

import { Menu, SubMenu, MenuItem } from '@menu/vertical-menu'
import useVerticalNav from '@menu/hooks/useVerticalNav'
import StyledVerticalNavExpandIcon from '@menu/styles/vertical/StyledVerticalNavExpandIcon'
import menuItemStyles from '@core/styles/vertical/menuItemStyles'
import menuSectionStyles from '@core/styles/vertical/menuSectionStyles'

// 🔁 Recursivamente converte JSON do siteMapNode em itens do menu
const convertJsonToMenuItem = (node) => {
  const title = node?.$?.title
  const url = node?.$?.url?.replace('~', '')?.replace(/\\/g, '/')
  const icon = node?.$?.icon ? node.$.icon : undefined
  const children = node?.siteMapNode?.map(convertJsonToMenuItem) || []

  return children.length > 0
    ? {
        type: 'subMenu',
        label: title,
        icon: icon ? <i className={icon} /> : undefined,
        children,
      }
    : {
        type: 'menuItem',
        label: title,
        href: url,
        icon: icon ? <i className={icon} /> : undefined,
      }
}

const RenderExpandIcon = ({ open, transitionDuration }) => (
  <StyledVerticalNavExpandIcon open={open} transitionDuration={transitionDuration}>
    <i className='ri-arrow-right-s-line' />
  </StyledVerticalNavExpandIcon>
)

const VerticalMenu = ({ dictionary, scrollMenu, siteMap }) => {
  const theme = useTheme()
  const verticalNavOptions = useVerticalNav()
  const { isBreakpointReached, transitionDuration } = verticalNavOptions
  const ScrollWrapper = isBreakpointReached ? 'div' : PerfectScrollbar

  const params = useParams()

  const [menuItemsData, setMenuItemsData] = useState([])

  useEffect(() => {
    if (!siteMap) return

    const root = siteMap?.siteMap?.siteMapNode?.[0] // raiz principal
    if (!root?.siteMapNode) return

    const items = root.siteMapNode.map(convertJsonToMenuItem)
    setMenuItemsData(items)
  }, [siteMap])

  const renderMenuItems = (items) =>
    items.map((item, index) =>
      item.type === 'subMenu' ? (
        <SubMenu
          key={item.label || index}
          label={item.label}
          icon={item.icon}
          sx={{
            '& *': {
              letterSpacing: '-0.5px !important',
            },
          }}
        >
          {renderMenuItems(item.children)}
        </SubMenu>
      ) : (
        <MenuItem
          key={item.label || index}
          href={item.href}
          icon={item.icon}
          sx={{
            '& *': {
              letterSpacing: '-0.5px !important',
            },
          }}
        >
          {item.label}
        </MenuItem>
      )
    )


  return (
    <ScrollWrapper
      {...(isBreakpointReached
        ? {
            className: 'bs-full overflow-y-auto overflow-x-hidden',
            onScroll: container => scrollMenu(container, false),
          }
        : {
            options: { wheelPropagation: false, suppressScrollX: true },
            onScrollY: container => scrollMenu(container, true),
          })}
    >
      <Menu
        popoutMenuOffset={{ mainAxis: 17 }}
        menuItemStyles={menuItemStyles(verticalNavOptions, theme)}
        renderExpandIcon={({ open }) => (
          <RenderExpandIcon open={open} transitionDuration={transitionDuration} />
        )}
        renderExpandedMenuItemIcon={{ icon: <i className='ri-circle-fill' /> }}
        menuSectionStyles={menuSectionStyles(verticalNavOptions, theme)}
      >

        {renderMenuItems(menuItemsData)}

        <MenuItem href={`/settings`} icon={<i className='ri-settings-3-line' />}>
          {dictionary?.navigation?.settings || 'Settings'}
        </MenuItem>
      </Menu>
    </ScrollWrapper>
  )
}

export default VerticalMenu