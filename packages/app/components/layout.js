import { useEffect } from 'react';
import Navbar from './navbar';
import Tabsbar from './tabsbar';
import Main from './main';
import Breadcrumb from './breadcrumb';
import Footer from './footer';
import useSkeleton from '../lib/hooks/skeleton';
import { View, ScrollView } from 'app/design/view'
import CommentForm from 'app/components/elements/commentForm';

export const siteTitle = 'NEO';

export default function Layout(props) {


    var oBreadCrump = null;
    var oComments = null;

    // TODO IMPROVE
    if (props.uri && props.uri.includes('view-post')){
        oComments = true;
    }

    const [loading, skeleton] = useSkeleton();
    const sClassName = 'relative overflow-hidden mb-24 sm:mb-0' + (oComments ? ' sm:mb-24' : '');

    return (
        <View className="">
        <ScrollView className="bg-screen dark:bg-screen-dark text-gray-900 dark:text-gray-50">
            <Navbar />
            {(oBreadCrump == null ) && <Tabsbar />}
            {(oBreadCrump != null ) && <Breadcrumb content ={oBreadCrump} />}
            <View className = {sClassName}>
                {props.children}
            </View>
            {(oComments == null ) && <Footer />}
            
        </ScrollView>
        { (oComments != null ) &&   <CommentForm/>}
        </View>
    );
/*
    return (
        <View>
            <Navbar />
            {(oBreadCrump == null ) && <Tabsbar />}
            {(oBreadCrump != null ) && <Breadcrumb content ={oBreadCrump} />}
            <View className = {sClassName}>
                {loading ? skeleton : <Main> {props.children} </Main>}
            </View>
            {(oComments == null ) && <Footer />}
        </View>
    );
*/
}
