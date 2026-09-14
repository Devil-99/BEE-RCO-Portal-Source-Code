import React from 'react'
import deloitte_theme from '../theme'


function CircularIcon({bg="black", p=8, children}) {
  return (
    <span className='rounded-full h-fit w-fit' style={{
        padding: p,
        backgroundColor: bg
    }}>
        {children}
    </span>
  )
}

export default CircularIcon