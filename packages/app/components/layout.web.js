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


export const siteTitle = 'G-Med';

export default function Layout(props) {  
    var oBreadCrump = null;
    var oComments = null;
/*
        props.children[1].forEach(element => {
            element.props.blocks.forEach(block => {
            if (block.content && block.content.type == 'breadcrumb'){
                oBreadCrump = block.content.data;
            }
            
            if (block.content && block.content[0] && block.content[0].type == 'comments'){
                oComments = true;
            }
        });
    });
*/
    const [loading, skeleton] = useSkeleton();
   
    const sClassName = 'relative overflow-hidden mb-24 sm:mb-0' + (oComments ? ' sm:mb-24' : '');
    return (
        <>
            <Head>
                <link rel="icon" href="/favicon.ico" />
                <meta name="description" content={siteTitle} />
                <meta name="og:title" content={siteTitle} />
               
            </Head>
            <View className="bg-screen dark:bg-screen-dark text-gray-900 dark:text-gray-50 h-full">
                <Navbar />
                {(oBreadCrump == null ) && <Tabsbar />}
                {(oBreadCrump != null ) && <Breadcrumb content ={oBreadCrump} />}
                <ScrollView className={sClassName}>
                    {loading ? skeleton : <Main>{props.children}</Main>}
                </ScrollView>
                <View className="fixed bottom-0 w-full"><Footer/></View>
            </View>
        </>
    );
}
