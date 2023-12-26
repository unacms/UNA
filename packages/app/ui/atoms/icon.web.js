'use client'
import React, { lazy } from 'react'
import IconDef from 'app/icons-web';
import { Theme } from 'app/design/theme';

//const IconDef = lazy(() => import('app/icons-web'));

export function Icon(props) {
    const { colors } = Theme();
    let { color, ...rest } = props;
    return <IconDef color={color === '' ? colors.default : color} {...rest}/>
}
