import Head from 'next/head';
import { useEffect } from 'react'
import Navbar from 'app/components/nav/navbar';
import Footer from './footer';
import { View } from 'app/design/view'
import useSkeleton from '../lib/hooks/skeleton';
import { storageClear } from 'app/lib/util'

export const siteTitle = 'NEO';

export default function Layout(props) {  

    const [loading, skeleton] = useSkeleton();
    
    setTimeout(() => {
        document.title = props.data.title;
    }, 100);

    useEffect(() => {
        let lastScrollTop = 0;
        
        const handleScroll = () => {
            let scrollTop = window.scrollY;
            if ((lastScrollTop <= scrollTop && lastScrollTop > 0) && window.innerWidth < 1024)
                scroll.value = 0;
            else
                scroll.value = 1;
            lastScrollTop = scrollTop;
        };
    
        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
      }, []); 

      useEffect(() => {
        const handlePageShow = (event) => {
            document.cookie = `pg=${JSON.stringify([])}`;
            storageClear();
        };
    
        window.addEventListener('beforeunload', handlePageShow);
            return () => {
                window.removeEventListener('beforeunload', handlePageShow);
            };
    }, []);  
    console.log(']]]]]]]]]]]', props.data.cache, props.data)
    return (
        <>
            <Head>
                <link rel="icon" href="/favicon.ico" />
                <meta name="description" content={siteTitle} />
                <meta http-equiv="expires" content="Fri, 18 Jul 2025 1:00:00 GMT" />
                <meta name="og:title" content={props.data.title} />
                <meta name="theme-color" content="#FFFFFF" media="(prefers-color-scheme: light)" />
                <meta name="theme-color" content="#030712" media="(prefers-color-scheme: dark)" />
                <link rel="manifest" href="/manifest.json" />
                <meta http-equiv="cache-control" content="max-age=36000" />
                <title>{props.data.title}</title>
            </Head>
            <Navbar title={props.data.title} menu_add={!!props.data.menu_add ? props.data.menu_add : false} uri = {props.uri} />
            <View className="bg-backgroundbody dark:bg-backgroundbody-dark  h-full items-stretch flex-row">
                
                <View className=" w-full mx-auto flex-row -top-[1px] " > 
                    <View  className={(true ? ' mt-16 lg:mt-16 ': '') +' w-full  relative overflow-hidden mb-16 sm:mb-0 mx-auto'}>
                    {
                        (loading) ? skeleton : (<View className='w-full mx-auto'>
                            {props.children}
                        </View>)
                    }
                    </View>
                </View>
                <View className="fixed bottom-0 z-30 w-full lg:hidden"><Footer/></View>
            </View>

  
        </>
    );
}
