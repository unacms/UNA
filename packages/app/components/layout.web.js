import { useEffect } from 'react';
import Head from 'next/head';
import Navbar from './navbar';
import Tabsbar from './tabsbar';
import Main from './main';
import Breadcrumb from './breadcrumb';
import Footer from './footer';
import useSkeleton from '../lib/hooks/skeleton';
import { ScrollView, SafeAreaView } from 'app/design/view'
import { useRouter } from "next/router";
import { View } from 'app/design/view'
import ElementMainMenu from 'app/components/elements/mainmenu'


export const siteTitle = 'G-Med';

export default function Layout(props) {  
    var oBreadCrump = null;
    var oComments = null;

    const [loading, skeleton] = useSkeleton();
   
    const sClassName = 'mt-16 relative overflow-hidden mb-24 sm:mb-0' + (oComments ? ' sm:mb-24' : '');
    return (
        <>
            <Head>
                <link rel="icon" href="/favicon.ico" />
                <meta name="description" content={siteTitle} />
                <meta name="og:title" content={siteTitle} />
               
            </Head>
            <View className="bg-screen dark:bg-screen-dark text-neo-900 dark:text-neo-50 h-full">
                <Navbar />
                {(oBreadCrump == null ) && <Tabsbar />}
                {(oBreadCrump != null ) && <Breadcrumb content={oBreadCrump} />}
                <ScrollView className={sClassName}>
                    <View className=" flex-row flex-1 max-w-screen-2xl min-w-full 2xl:justify-center" > 
                        <View className="w-72 flex-none hidden xl:flex "><ElementMainMenu className="w-full flex-none hidden" /></View>
                        {loading ? <View className="w-full mx-auto 2xl:m-0 xl:w-2/3 py-4">{skeleton}</View> : <Main className="w-full mx-auto 2xl:m-0 xl:w-2/3 py-4">{props.children}</Main>}
                    </View>
                </ScrollView>
                <View className="fixed bottom-0 w-full"><Footer/></View>
            </View>
        </>
    );
}
