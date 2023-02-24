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
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

export const siteTitle = 'G-Med';
/*
function HomeScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>Home!</Text></View>
  );
}

function SettingsScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>Home!</Text></View>
  );
}
*/
const Tab = createBottomTabNavigator();

export default function Layout(props) {

    var oBreadCrump = null;
    var oComments = null;
    
    const [loading, skeleton] = useSkeleton();
    const sClassName = 'relative overflow-hidden mb-24 sm:mb-0' + (oComments ? ' sm:mb-24' : '');
    /*
    <Tab.Navigator>
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>*/
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
            <View className="fixed">
      

                </View>
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
