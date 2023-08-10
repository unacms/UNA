import React, { useEffect, useCallback, lazy } from 'react'
import { useWindowDimensions } from 'react-native'
import NavbarMemo from 'app/components/nav/navbar';
import Footer from './footer';
import { View } from 'app/design/view'
//import useSkeleton from '../lib/hooks/skeleton';
import { storageClear } from 'app/lib/util'
import { getHeaderSettings } from 'app/lib/util'
/*
const Navbar = lazy(() => import('app/components/nav/navbar'));

function NavbarMemo({ title, menu_add, uri }) {
  return (
      <Navbar title={title} menu_add={menu_add} uri={uri} />
  );
}
*/
export default function Layout(props) {  

    let { width } = useWindowDimensions();
   
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
        console.log('event',event);
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

    useEffect(() =>
    {        
        document.body.classList.add("bg-backgroundbody");
    });

    
    let headerSettings = getHeaderSettings(props.uri, width);
    
    return (
        <>
            <View className="bg-backgroundbody dark:bg-backgroundbody-dark w-full items-stretch ">
                <View className=" w-full mx-auto flex-row -top-[1px] " > 
                    <View  className={'  w-full  relative overflow-hidden mb-16 sm:mb-0 mx-auto'}>
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
