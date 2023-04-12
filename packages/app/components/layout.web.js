import Head from 'next/head';
import Navbar from 'app/components/nav/navbar';
import Footer from './footer';
import { View } from 'app/design/view'
import { NavigationContainer } from '@react-navigation/native';
import { NavMaterialTabs } from 'app/components/nav/materialtabs'
import Page from 'app/components/page'
import Cover from 'app/components/elements/cover';
import useSkeleton from '../lib/hooks/skeleton';
import { appSetting } from 'app/lib/util'
import { Theme } from 'app/design/theme';

export const siteTitle = 'NEO';

export default function Layout(props) {  
    var oBreadCrump = null;
    const [loading, skeleton] = useSkeleton();
    const { colors } = Theme();
    
    const linking = {
        prefixes: [
          /* your linking prefixes */
        ],
        config: {
          /* configuration for matching screens with paths */
        },
    };
    
    let bTabsPresent = false;
    if (props?.data?.menu?.items?.length > 0 && props?.uri != 'home'){
        props.data.menu.items.forEach(function (k) { 
            if (k.link == props.uri)
                bTabsPresent = true;
        });
    }
    let bCoverPresent = false;
    if (props?.data?.cover_block?.profile){
        bCoverPresent = true;
    }

    let cnt =
        (<View className="bg-screen dark:bg-screen-dark text-neogray-900 dark:text-neogray-50 h-full items-stretch flex-row">
            {(props.data && props.data.menu_top) &&  <Navbar menu_top={props.data.menu_top} uri = {props.uri} />} 
            <View className=" w-full mx-auto flex-row -top-[1px]" > 
                <View className='w-full mt-16 relative overflow-hidden mb-24 sm:mb-0 mx-auto'>

                  {loading ? skeleton :<View className='w-full mx-auto'>
                        {(bCoverPresent) && <Cover data={props.data.cover_block}/>}
                        {(bTabsPresent) && <View className='w-full'><View className='absolute h-12 w-full top-0 left-0 pb-px' style={{backgroundColor:colors.barsBackground}}></View><View className={appSetting('layout', 'max_width') + ' mx-auto w-full'}><NavMaterialTabs data = {props.data.menu.items} /></View></View>}
                        {(!bTabsPresent) && <Page data={props.data}/>}
                    </View>}
                </View>
            </View>
            <View className="fixed bottom-0 z-30 w-full lg:hidden"><Footer/></View>
        </View>);

    return (
        <>
            <Head>
                <link rel="icon" href="/favicon.ico" />
                <meta name="description" content={siteTitle} />
                <meta name="og:title" content={siteTitle} />
                <meta name="theme-color" content="#FFFFFF" media="(prefers-color-scheme: light)" />
                <meta name="theme-color" content="#0f172a" media="(prefers-color-scheme: dark)" />
                <title>{props.data.title}</title>
            </Head>
            {(bTabsPresent) && <NavigationContainer linking={linking}>{cnt}</NavigationContainer>}
            {(!bTabsPresent) && cnt}
           
        </>
    );
}
