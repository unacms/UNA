import React, { useEffect, useCallback, lazy, useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import Footer from './footer';
import Informer from 'app/components/elements/informer';
import { View } from 'app/design/view';
import { storageClear } from 'app/lib/util';
import { getHeaderSettings } from 'app/lib/util';

const Navbar = lazy(() => import('app/components/nav/navbar'));

const NavbarMemo = React.memo(function NavbarMemo({ title, menu_add, uri }) {
    return (
        <Navbar title={title} menu_add={menu_add} uri={uri} />
    );
  });

export default function Layout({ data, uri, children }) {
    const { width } = useWindowDimensions();

    const handlePageShow = useCallback((event) => {
        storageClear();
    }, []);

    useEffect(() => {
        if (navigator.serviceWorker) {
            navigator.serviceWorker.register('/sw.js');
        }

        window.addEventListener('beforeunload', handlePageShow);
        return () => {
            window.removeEventListener('beforeunload', handlePageShow);
        };
        
    }, [handlePageShow]);

    useEffect(() => {

        let element = document.querySelector('.animated-view');
        if(element){
            element.classList.remove('fade-out');
            element.classList.add('fade-in');
        }

        if (navigator.serviceWorker) {
            navigator.serviceWorker.register('/sw.js');
        }

      
        
    }, []);

    const headerSettings = useMemo(() => getHeaderSettings(uri, width), [uri, width]);

    if (data?.empty)
        return <>{children}</>

    return (
        <>
            <View className="bg-bgrbody dark:bg-bgrbody-d w-full items-stretch ">
                <View className=" w-full mx-auto flex-row -top-[1px] " >
                    <View className={'  w-full  relative overflow-hidden mb-16 sm:mb-0 mx-auto'}>
                        <View className='w-full mx-auto'>
                            {headerSettings.offset && <View className='w-full h-16' />}
                            <Informer />
                            {children}
                        </View>
                    </View>
                </View>
                {headerSettings?.footer !== false && <Footer /> }
            </View>
            <NavbarMemo title={data.title} menu_add={data.menu_add || false} uri={uri} />
        </>
    );
}