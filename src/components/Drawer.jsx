'use client'

import DrawerMUI from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import _ from 'lodash'

export const Drawer = ({ open, width, title, onClose, children }) => {

  return (
    <DrawerMUI open={open} anchor='right' variant='temporary' sx={{ '& .MuiDrawer-paper': { width } }} onClose={() => onClose()} style={{ zIndex: 1300 }}>
        
        <div className='flex items-center justify-between pli-5 plb-4' style={{ padding: '12px' }}>
            <Typography variant='h5'>{title}</Typography>
            <IconButton size='small' onClick={onClose}>
                <i className='ri-close-line text-2xl' />
            </IconButton>
        </div>

        <Divider />

        <div className='p-5' style={{ padding: '12px' }}>
            {children}
        </div>

    </DrawerMUI>
  )
}