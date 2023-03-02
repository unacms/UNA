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
   
    const sClassName = 'w-full mt-16 relative overflow-hidden mb-24 sm:mb-0 flex-1 flex-row' + (oComments ? ' sm:mb-24' : '');
    return (
        <>
            <Head>
                <link rel="icon" href="/favicon.ico" />
                <meta name="description" content={siteTitle} />
                <meta name="og:title" content={siteTitle} />
               
            </Head>
            <View className="bg-screen dark:bg-screen-dark text-neo-900 dark:text-neo-50 h-full items-stretch flex-row">
                <Navbar />
                {(oBreadCrump == null ) && <Tabsbar />}
                {(oBreadCrump != null ) && <Breadcrumb content={oBreadCrump} />}
                <View className=" u-content3 mx-auto flex-1 flex-row -top-[1px]" > 
                <View className={sClassName}>
                    <View className=" flex-row u-content3 2xl:justify-center mx-auto" > 
                        <View className="w-72 flex-none hidden xl:flex bg-white 2xl:bg-transparent">
                            <View className="w-72 fixed max-h-screen overflow-auto u-sidebar pb-4">
                                <ElementMainMenu className="w-full flex-none hidden" />
                            </View>
                        </View>
                        {loading ? <View className="u-content4 mx-auto 2xl:m-0 py-2 sm:py-4">{skeleton}</View> : <Main className="u-content4 mx-auto 2xl:m-0 py-2 sm:py-4">{props.children}</Main>}
                    </View>
                </View>
                </View>
                <View className="fixed bottom-0 w-full"><Footer/></View>
            </View>
        </>
    );
}
