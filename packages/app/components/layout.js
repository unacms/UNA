import { useEffect } from 'react';
import Navbar from './navbar';
import Tabsbar from './tabsbar';
import Main from './main';
import Breadcrumb from './breadcrumb';
import Footer from './footer';
//import styles from './layout.module.css';
//import utilStyles from '../styles/utils.module.css';
import useSkeleton from '../lib/hooks/skeleton';
import { View, ScrollView } from 'app/design/view'

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
        <View>
            <Navbar />
            {(oBreadCrump == null ) && <Tabsbar />}
            {(oBreadCrump != null ) && <Breadcrumb content ={oBreadCrump} />}
            <ScrollView className = {sClassName}>
                {props.children}
            </ScrollView>
            {(oComments == null ) && <Footer />}
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
