'use client'
import React, { lazy } from 'react'
//import IconDef from 'app/icons-web';

const IconDef = lazy(() => import('app/icons-web'));

export function Icon(props) {
    return <IconDef {...props}/>
}
