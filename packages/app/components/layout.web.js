import Head from 'next/head';
import Navbar from 'app/components/nav/navbar';
import Footer from './footer';
import { View } from 'app/design/view'
import { NavigationContainer } from '@react-navigation/native';
import { NavMaterialTabs } from 'app/components/nav/materialtabs'
import Cover from 'app/components/elements/cover';
import useSkeleton from '../lib/hooks/skeleton';
import { appSetting } from 'app/lib/util'
import { Theme } from 'app/design/theme';



export const siteTitle = 'NEO';

export default function Layout(props) {  
    var oBreadCrump = null;
    const [loading, skeleton] = useSkeleton();
    
    const linking = {
        prefixes: [
          /* your linking prefixes */
        ],
        config: {
          /* configuration for matching screens with paths */
        },
    };

    return (
        <>
            <Head>
                <link rel="icon" href="/favicon.ico" />
                <meta name="description" content={siteTitle} />
                <meta name="og:title" content={siteTitle} />
                <meta name="theme-color" content="#FFFFFF" media="(prefers-color-scheme: light)" />
                <meta name="theme-color" content="#030712" media="(prefers-color-scheme: dark)" />
                <title>{props.data.title}</title>
            </Head>
            <NavigationContainer linking={linking}>
            <View className="bg-backgroundbody dark:bg-backgroundbody-dark text-gray-900 dark:text-gray-50 h-full items-stretch flex-row">
                {(props.data && props.data.menu_top) && <Navbar menu_top={props.data.menu_top} uri = {props.uri} />} 
                <View className=" w-full mx-auto flex-row -top-[1px] " > 
                    <View  className=' w-full mt-16 relative overflow-hidden mb-16 sm:mb-0 mx-auto'>
                    {loading ? skeleton :<View className='w-full mx-auto'>
                        {props.children}
                        </View>}
                    </View>
                </View>
                <View className="fixed bottom-0 z-30 w-full lg:hidden"><Footer/></View>
            </View>
            </NavigationContainer>
  
        </>
    );
}
