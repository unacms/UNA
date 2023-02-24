import { useEffect } from 'react';
import Navbar from './navbar';
import Tabsbar from './tabsbar';
import Main from './main';
import Breadcrumb from './breadcrumb';
import Footer from './footer';
import useSkeleton from '../lib/hooks/skeleton';
import { ScrollView, SafeAreaView } from 'app/design/view'
import { StyleSheet, View } from "react-native";
import { Text } from 'app/design/typography'

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
        <View className="bg-gray-300 dark:bg-red-100 text-gray-900 dark:text-gray-50 h-full">
            <Navbar />
            <ScrollView className="bg-gray-300 dark:bg-gray-1000 text-gray-900 dark:text-gray-50">
                {(oBreadCrump == null ) && <Tabsbar />}
                {(oBreadCrump != null ) && <Breadcrumb content ={oBreadCrump} />}
                <View className = {sClassName}>
                    {props.children}
                </View>
            </ScrollView>
            <View className="fixed"><Footer/></View>
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
