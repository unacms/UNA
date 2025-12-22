import { useState, useEffect, useRef } from 'react';
import { View } from 'app/design/view';
import { ThemeName } from 'app/design/theme';
import { usePathname } from 'app/lib/hooks/router';
import { useCurrentUser } from 'app/context/user';

//const backgrounds = getBackgrounds();   

function BackgroundComponent({ }) {
    return <></>
   /* const theme = ThemeName();
    const pathname = usePathname();
    const { currentUser } = useCurrentUser();
    const background = getBackground(pathname, currentUser);   

    const currentBg = backgrounds[background]?.[theme] || backgrounds.default[theme];

    return (
        <>
            {currentBg && (
                <View 
                    className="animate-in fade-in duration-1000"
                    style={{ position: 'fixed', width: '100vw', height: '100vh', top: 0, left: 0, zIndex: -1 }}
                >
                    {currentBg}
                </View>
            )}
        </>
    );
    export function getBackground(pathname, currentUser) {
    if (currentUser === false) {
        if (pathname === '/' || pathname === '/home')
            return 'splash';

        if (pathname === '/login')
            return 'login';

        if (pathname === '/create-account')
            return 'create-account';
    }
    return 'default';
}

import {
    SvgBackgroundSplash,
    SvgBackgroundSplashDark,
    SvgBackgroundCreateAccount,
    SvgBackgroundCreateAccountDark,
    SvgBackgroundLogin,
    SvgBackgroundLoginDark,
} from 'app/ui/atoms/backgrounds';
    
    */
}

export default BackgroundComponent;