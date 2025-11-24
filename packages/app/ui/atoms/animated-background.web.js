import { useState, useEffect, useRef } from 'react';
import { View } from 'app/design/view';
import { ThemeName } from 'app/design/theme';
import { callFn } from 'app/lib/functions/call';
import { usePathname } from 'app/lib/hooks/router';
import { useCurrentUser } from 'app/context/user';

const backgrounds = callFn("getBackgrounds", []);   

function BackgroundComponent({ }) {
    const theme = ThemeName();
    const pathname = usePathname();
    const { currentUser } = useCurrentUser();
    const background = callFn("getBackground", [pathname, currentUser]);   

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
}

export default BackgroundComponent;