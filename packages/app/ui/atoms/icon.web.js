'use client'
import dynamic from 'next/dynamic'
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { appSetting, storageKey, storageGet, getDataFromCache,storageSet } from 'app/lib/util'
//const IconDef = lazy(() => import('app/icons-web'));

//const IconWeb = dynamic(() => import('app/icons-web'));

export const Icon = React.memo(function Icon({ icon, className, id, style }) {
    const iconHTML = useRef({});
    const [currentIcon, setCurrentIcon] = useState(null);
    let iconOr = storageGet('icon'+icon, '', true);
    useEffect(() => {
        const fetchIcon = async () => {
            const response = await fetch('/api/api.icon?icon='+icon);
            const data = await response.json();
            iconHTML.current = { ...iconHTML.current, [icon]: data.icon };
            storageSet('icon'+icon, '', data.icon, true);
            //setCurrentIcon(data.icon);
            
        };
        if (!iconOr)
            fetchIcon();
    }, [icon]); 

    return <div className={className} id={id} style={style} dangerouslySetInnerHTML={{ __html: iconOr }} />;
});