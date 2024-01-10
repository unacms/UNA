'use client'

import React, { useEffect, useState } from 'react';
import { storageGet, storageSet } from 'app/lib/util'

export const Icon = React.memo(function Icon(props) {
    let {  icon, className, width, height,size,  ...rest } = props
    const key = icon + '-' + (width ? width : '') + '-' + (height ? height : '') + '-' + (size ? size : '');
    const [currentIcon, setCurrentIcon] = useState(storageGet('icon-'+key, '', true));

    useEffect(() => {
        
        const fetchIcon = async () => {
            let url = '/api/api.icon?icon='+icon;
            if (width)
                url += '&width='+width;
            if (height)
                url += '&height='+height;   
            if (size)
                url += '&size='+size;   
            const response = await fetch(url);
            const data = await response.json();
            setCurrentIcon(data.icon)
            storageSet('icon-'+key, '', data.icon, true);
            
        };
        let nIcon = storageGet('icon-'+key, '', true)
        if (icon){
            if (!nIcon)
                fetchIcon();
            else
                setCurrentIcon(nIcon)
        }
    }, [key]); 
    if (!currentIcon)
        return <></>
    return <div className={className} {...rest} dangerouslySetInnerHTML={{ __html: currentIcon }} />;
});

/*
OLD CODE
'use client'
import React, { lazy } from 'react'
import IconDef from 'app/icons-web';


export function Icon(props) {
    return <IconDef {...props}/>
}
*/

/*
OLD CODE WITH HOOK
'use client'
import dynamic from 'next/dynamic'
import React, { useEffect, useState, useMemo, useCallback } from 'react';
//const IconDef = lazy(() => import('app/icons-web'));

const IconWeb = dynamic(() => import('app/icons-web'));

export const Icon = React.memo(function Icon(props) {
    return <IconWeb {...props}/>*/