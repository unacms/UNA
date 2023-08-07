import Head from 'next/head';
import React, { useEffect, useCallback, useMemo } from 'react'
import { useWindowDimensions } from 'react-native'
//import Navbar from 'app/components/nav/navbar';
import Footer from './footer';
import { View } from 'app/design/view'
//import useSkeleton from '../lib/hooks/skeleton';
import { storageClear } from 'app/lib/util'
import { getHeaderSettings } from 'app/lib/util'
import { useColorScheme } from 'react-native';
import dynamic from 'next/dynamic'

export const siteTitle = 'NEO';

function NavbarMemo({ title, menu_add, uri }) {
    const computedData = useMemo(() => {
        const Navbar = React.memo(
            dynamic(() => import('app/components/nav/navbar'))
        )
        return <Navbar title={title} menu_add={menu_add} uri = {uri} />
    }, [title, menu_add, uri])
    return computedData
}

export default function Layout(props) {  

    let { width } = useWindowDimensions();
    //const [loading, skeleton] = useSkeleton(width);

    useEffect(() => {
        document.title = props?.data?.title;
    }, [props.data.title]);

    const handleScroll = useCallback(() => {
        let lastScrollTop = 0;
        let scrollTop = window.scrollY;
        if ((lastScrollTop <= scrollTop && lastScrollTop > 0) && window.innerWidth < 1024)
            scroll.value = 0;
        else
            scroll.value = 1;
        lastScrollTop = scrollTop;
    }, []);

    useEffect(() => {
        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, [handleScroll]);

    const handlePageShow = useCallback((event) => {
        document.cookie = `pg=${JSON.stringify([])}`;
        storageClear();
    }, []);

    useEffect(() => {
        if (navigator.serviceWorker) {
            navigator.serviceWorker.register('/sw.js').then(function(registration) {
                // Service worker registration was successful.
            }).catch(function(error) {
                // Service worker registration failed.
            });
        }

        window.addEventListener('beforeunload', handlePageShow);
        return () => {
            window.removeEventListener('beforeunload', handlePageShow);
        };
    }, [handlePageShow]);

    
    let headerSettings = getHeaderSettings(props.uri, width);

    const scheme = useColorScheme();
    let bg = scheme === 'dark' ? 'rgba(17,24,39,0.8)' : 'rgba(255,255,255,0.8)';
    
    return (
        <>
            <Head>
                <link rel="icon" href="/favicon.ico" />
                <meta name="description" content={siteTitle} />
                <meta http-equiv="expires" content="Fri, 18 Jul 2025 1:00:00 GMT" />
                <meta name="og:title" content={props.data.title} />
                <meta name="theme-color"  content={bg} />
                <link rel="manifest" href="/manifest.json" />
                <meta name="apple-mobile-web-app-capable" content="yes"></meta>
                <meta name="viewport" content="initial-scale=1, viewport-fit=cover, width=device-width"></meta>
                <meta http-equiv="cache-control" content="max-age=36000" />
                <title>{props.data.title}</title>

            </Head>
            <View className="bg-backgroundbody dark:bg-backgroundbody-dark w-full items-stretch ">
                <View className=" w-full mx-auto flex-row -top-[1px] " > 
                    <View  className={'  w-full  relative overflow-hidden mb-16 sm:mb-0 mx-auto'}>
                    {/*
                        (loading) ? (props?.data?.cached? <></>: <>{ (headerSettings.offset) && <View className='w-full h-16'/> }{skeleton}</>) : ()*/
                    }
                    <View className='w-full mx-auto'>
                            { (headerSettings.offset) && <View className='w-full h-16' /> }
                            { props.children }
                        </View>
                    </View> 
                </View>
                <Footer/>
            </View>
            <NavbarMemo title={props.data.title} menu_add={!!props.data.menu_add ? props.data.menu_add : false} uri = {props.uri} />
        </>
    );
}
