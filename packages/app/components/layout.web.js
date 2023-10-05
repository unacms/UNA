import React, { useEffect, useCallback, lazy, useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import Footer from './footer';
import Informer from 'app/components/elements/informer';
import { View, Row } from 'app/design/view';
import { storageClear } from 'app/lib/util';
import { getHeaderSettings } from 'app/lib/util';
//import Navbar from 'app/components/nav/navbar'
import { useColorScheme } from 'react-native';
import { appSetting } from 'app/lib/util'
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
            element.classList.remove('page-fade-out');
            // disbled: header not sticky issue
            //element.classList.add('page-fade-in');
        }

        if (navigator.serviceWorker) {
            navigator.serviceWorker.register('/sw.js');
        }

      
        
    }, [data.url]);
    const headerSettings = useMemo(() => getHeaderSettings(uri, width), [uri, width]);

    if (data?.empty)
        return <>{children}</>

    const scheme = useColorScheme();
    let stylesBgImage={ minHeight: '100vh', backgroundAttachment:'fixed', backgroundImage: appSetting('layout', 'background_image')}
    let stylesBg={ backgroundColor: appSetting('layout', 'background_color')}
    if(scheme === 'dark'){
        stylesBgImage={ minHeight: '100vh', backgroundAttachment:'fixed', backgroundImage: appSetting('layout', 'background_image_dark')}
        stylesBg={ backgroundColor: appSetting('layout', 'background_color_dark')}
    }

    const Content = React.memo(({ children, headerSettings }) => {
        return (
            <View className="w-full items-stretch " style={stylesBgImage}>
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
        );
    });

    if(appSetting('layout', 'theme') == 'facebook'){
        return (
            <>
                <Content headerSettings={headerSettings} children={children} />
                { <NavbarMemo title={data.title} menu_add={data.menu_add || false} uri={uri} /> }
            </>
        );
    }

    if(appSetting('layout', 'theme') == 'twitter'){
        if (width > 1024)
            headerSettings.offset = false;
        return (
            <Row className='w-full flex-col lg:flex-row-reverse '>
                <View className='w-full lg:w-4/5'>
                    <Content headerSettings={headerSettings} children={children} />
                </View>
                <View className='w-full lg:w-1/5'>
                    { <NavbarMemo title={data.title} menu_add={data.menu_add || false} uri={uri} /> }
                </View>
            </Row>
        );
    }
}