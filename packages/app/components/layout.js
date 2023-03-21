import { useEffect } from 'react';
import Navbar from './navbar';
import Tabsbar from './tabsbar';
import Main from './main';
import Breadcrumb from './breadcrumb';
import Footer from './footer';
import useSkeleton from '../lib/hooks/skeleton';
import { View, ScrollView } from 'app/design/view'
import BottomSheet from 'app/components/bottomSheet';
import LayoutDataContext from 'app/context/layout';

export const siteTitle = 'NEO';

export default function Layout(props) {

    var oBreadCrump = null;
    var oComments = null;

    // TODO IMPROVE
    if (props.uri && props.uri.includes('view-post')){
        oComments = true;
    }

    const [loading, skeleton] = useSkeleton();
    const sClassName = 'relative overflow-hidden ' + (oComments ? ' ' : '');

    return (
        <LayoutDataContext>
            <View className="h-full">
            <ScrollView className="bg-screen dark:bg-screen-dark text-gray-900 dark:text-gray-50">
                <Navbar />
                {(oBreadCrump == null ) && <Tabsbar />}
                {(oBreadCrump != null ) && <Breadcrumb content ={oBreadCrump} />}
                <View className = {sClassName}>
                    {props.children}
                </View>

                
            </ScrollView>
            {/* (oComments != null ) &&   <BottomSheet/>*/}
            </View>
        </LayoutDataContext>
    );

}
