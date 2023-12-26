'use client'
import React, { lazy } from 'react'
import IconDef from 'app/icons-web';
import { Theme } from 'app/design/theme';
import dynamic from 'next/dynamic'
import {useMemo,  } from 'react';
//const IconDef = lazy(() => import('app/icons-web'));
/*
const FormFieldFtf = dynamic(() => import('app/icons-web'));
*/
/*export const Icon = React.memo(function Icon(props) {
  //  const { colors } = Theme();
   // let { color, ...rest } = props;
   // return <FormFieldFtf color={color === '' ? colors.default : color} {...rest}/>
});
*/
export function Icon(props) {
    const { colors } = Theme();
    let { color, icon, ...rest } = props;
    console.log("icon", icon)
    const computedData = useMemo(() => {
        return <IconDef color={color === '' ? colors.default : color} {...rest} icon={icon}/>
    }, [icon]); 
    return computedData;


  /*  const { colors } = Theme();
    let { color, ...rest } = props;
    return <IconDef color={color === '' ? colors.default : color} {...rest}/>*/
}
