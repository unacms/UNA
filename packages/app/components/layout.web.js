import { useEffect } from 'react';
import Head from 'next/head';
import Navbar from './navbar';
import Tabsbar from './tabsbar';
import Main from './main';
import Breadcrumb from './breadcrumb';
import Footer from './footer';
import utilStyles from '../styles/utils.module.css';
import useSkeleton from '../lib/hooks/skeleton';
import {useRouter} from "next/router";

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
            <Navbar />
            {(oBreadCrump == null ) && <Tabsbar />}
            {(oBreadCrump != null ) && <Breadcrumb content ={oBreadCrump} />}
            <div className={sClassName}>
                {loading ? skeleton : <Main className=""> {props.children} </Main>}
            </div>
            {(oComments == null ) && <Footer />}
        </>
    );
}
