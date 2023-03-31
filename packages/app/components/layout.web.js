import Head from 'next/head';
import Navbar from 'app/components/nav/navbar';
import Footer from './footer';
import { View } from 'app/design/view'
import { NavigationContainer } from '@react-navigation/native';
import { NavMaterialTabs } from 'app/components/nav/materialtabs'
import Page from 'app/components/page'
import Cover from 'app/components/elements/cover';

export const siteTitle = 'NEO';

export default function Layout(props) {  
    var oBreadCrump = null;

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
    let bCoverPresent = false;
    if (props.data.cover_block && props.data.cover_block.profile){
        bCoverPresent = true;
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
                <View className=" w-full mx-auto flex-row -top-[1px]" > 
                    <View className='w-full mt-16 relative overflow-hidden mb-24 sm:mb-0 mx-auto'>
                        {/* Modify this View's className to make it take full width */}
                        <View className='w-full mx-auto'>
                            {(bCoverPresent) && <Cover data={props.data.cover_block}/>}
                            {(bTabsPresent) && <NavMaterialTabs data = {props.data.menu.items} />}
                            {(!bTabsPresent) && <Page data={props.data}/>}
                        </View>
                    </View>
                </View>
                <View className="fixed bottom-0 w-full lg:hidden"><Footer/></View>
            </View>
            </NavigationContainer>
        </>
    );
}
