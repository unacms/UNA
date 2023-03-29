
import Head from 'next/head';
import Navbar from './navbar';
import Tabsbar from './tabsbar';
import Breadcrumb from './breadcrumb';
import Footer from './footer';

import { ScrollView, SafeAreaView } from 'app/design/view'
import { useRouter } from "next/router";
import { View } from 'app/design/view'
import { NavigationContainer } from '@react-navigation/native';
import { NavMaterialTabs } from 'app/components/nav/materialtabsweb'
import Page from 'app/components/page'
export const siteTitle = 'NEO';

export default function Layout(props) {  
    var oBreadCrump = null;
    var oComments = null;

    
   
    const sClassName = 'w-full mt-16 relative overflow-hidden mb-24 sm:mb-0 flex-1 flex-row' + (oComments ? ' sm:mb-24' : '');

    const linking = {
        prefixes: [
          /* your linking prefixes */
        ],
        config: {
          /* configuration for matching screens with paths */
        },
    };
    
    let bTabsPresent = false;
    if (props.data.menu.items && props.data.menu.items.length > 0 && props.uri != 'home'){
        props.data.menu.items.forEach(function (k) { 
            if (k.link == props.uri)
                bTabsPresent = true;
        });
    }

   

    return (
        <>
            <Head>
                <link rel="icon" href="/favicon.ico" />
                <meta name="description" content={siteTitle} />
                <meta name="og:title" content={siteTitle} />
               
            </Head>
            <NavigationContainer linking={linking}>
            <View className="bg-screen dark:bg-screen-dark text-neogray-900 dark:text-neogray-50 h-full items-stretch flex-row">
                {(props.data && props.data.menu_top) &&  <Navbar menu_top={props.data.menu_top} uri = {props.uri} />} 
                {(oBreadCrump == null ) && <Tabsbar />}
                {(oBreadCrump != null ) && <Breadcrumb content={oBreadCrump} />}
                <View className=" u-content3 mx-auto flex-1 flex-row -top-[1px]" > 
                <View className={sClassName}>
                    {(bTabsPresent) && <NavMaterialTabs data = {props.data.menu.items} />}
                    {(!bTabsPresent) && <Page data={props.data}/>}
                </View>
                </View>
                <View className="fixed bottom-0 w-full lg:hidden"><Footer/></View>
            </View>
            </NavigationContainer>
        </>
    );
}
