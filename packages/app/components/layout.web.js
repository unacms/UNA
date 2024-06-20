import React, { useEffect, useCallback, lazy, useMemo, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import Footer from 'app/components/nav/footer';
import { Modal } from 'app/design/controls'
import Informer from 'app/components/elements/informer';
import Suggestions from 'app/ui/molecules/suggestions';
import AsyncWorker from 'app/ui/molecules/async_worker';
import { View, Row } from 'app/design/view';
import { getLayoutName } from 'app/components/page-layout';
import { useCurrentUser } from 'app/context/user'
import BottomSheet from 'app/ui/molecules/bottomsheet_content';
import { getHeaderSettings, getLayout, deepEqual } from 'app/lib/util';
import { useColorScheme } from 'react-native';
import { appSetting } from 'app/lib/util'
import BottomSheetDataContext from 'app/context/bottomsheet';
import { appStatic } from 'app/lib/app-static'
import { storageSet, storageClear, storageGet } from 'app/lib/util'
import { menuItemsByName } from 'app/lib/util'
import OneSignal from 'react-onesignal';

const Navbar = lazy(() => import('app/components/nav/navbar'));

const NavbarMemo = React.memo(function NavbarMemo(props) {
    return (
        <Navbar {...props} />
    );
});

async function runOneSignal() {
    const ONESIGNAL_KEY = appSetting('config', 'api_keys', 'onesignal');
    if (ONESIGNAL_KEY) {
        await OneSignal.init({ appId: ONESIGNAL_KEY, allowLocalhostAsSecureOrigin: true });
        OneSignal.Slidedown.promptPush();
    }
}


const MemoizedContent = React.memo(({ headerSettings, currentUser, layoutName, data, children, uri, blocks }) => {
    const [isModal, setIsModal] = useState(false);
   
    useEffect(() => {
        if (currentUser === false && !storageGet('layout:modal', '', true) && appSetting('layout', 'show_login_modal') > 0 && !['create-account', 'home', 'login', 'forgot-password', 'confirm-email'].includes(uri)) {
            setTimeout(() => {
                setIsModal(true)
            }, appSetting('layout', 'show_login_modal'));
        }
    }, []);

    const ModalPopup = ({ }) => {
        let p = {
            blocks: blocks,
            data: data,
        }
        if (!isModal)
            return <></>
        return (<Modal title=" " onVisible={isModal} outerClickClose={false} onClose={() => handleCloseModal()}>
            {appStatic('components_modal', p)}
        </Modal>);
    };

    const handleCloseModal = () => {
        storageSet('layout:modal', '', true, true);
        setIsModal(false)
    }


    if (data.page_status == 503) {
        return <>
            {appStatic('maintenance_mode')}
        </>
    }

    if (getLayout(currentUser, layoutName) == 'hor') {
        return (
            <BottomSheetDataContext>
                <Content layoutName={layoutName} headerSettings={headerSettings} children={children} currentUser={currentUser} />

                <Suggestions />
                <AsyncWorker />
                <NavbarMemo headerSettings={headerSettings} layoutName={layoutName} title={data.name} menu={data.menu} menu_add={data.menu_add || false} uri={uri} />
                <BottomSheet />
                <ModalPopup />
            </BottomSheetDataContext>
        );
    }

    if (getLayout(currentUser, layoutName) == 'mixed') {

        return (
            <BottomSheetDataContext>

                <Suggestions />
                <AsyncWorker />
                <NavbarMemo headerSettings={headerSettings} layoutName={layoutName} title={data?.name} menu={data?.menu} menu_add={data?.menu_add || false} uri={uri} >
                    <Content layoutName={layoutName} headerSettings={headerSettings} children={children} currentUser={currentUser} />
                </NavbarMemo>
                <BottomSheet />
                <ModalPopup />

            </BottomSheetDataContext>

        );
    }

    if (getLayout(currentUser, layoutName) == 'ver') {

        const menuItems = menuItemsByName('main_menu', appSetting('menu_items', 'menu_sidebar'), currentUser);
        return (
            <BottomSheetDataContext>
                <View className={appSetting('layout', 'max_width') + ' w-full mx-auto'}>
                    <Row className='w-full flex-col lg:flex-row-reverse  lg:min-h-screen '>
                        <View className={(menuItems.length > 0 ? 'lg:w-[calc(100%-20rem)] border-x border-bdr dark:border-bdr-d' : '') + ' w-full '}>
                            <Content layoutName={layoutName} headerSettings={headerSettings} children={children} currentUser={currentUser} />
                            <Suggestions />
                            <AsyncWorker />
                        </View>
                        {menuItems.length > 0 && <View className='w-full lg:w-80 '>
                            <NavbarMemo headerSettings={headerSettings} layoutName={layoutName} title={data.name} menu={data.menu} menu_add={data.menu_add || false} uri={uri} />
                        </View>}
                    </Row>
                    <BottomSheet />
                    <ModalPopup />
                </View>
            </BottomSheetDataContext>
        );
    }
});

export default function (props) {

    const { currentUser, setCurrentUser } = useCurrentUser();
    let data = props.data;
    let blocks = props.blocks;
    let uri = props.uri
    let children = props.children
    const { width } = useWindowDimensions();

    let theme = storageGet('layout:theme', '', true);
    const scheme = useColorScheme();
    if (theme == '') {
        theme = scheme;
    }
    const root = window.document.documentElement;
    root.setAttribute('theme', theme);

    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    darkModeMediaQuery.addListener((e) => {
        const newColorScheme = e.matches ? "dark" : "light";
        root.setAttribute('theme', newColorScheme);
    });

    const handlePageShow = useCallback((event) => {
        storageClear();
    }, []);

    useEffect(() => {

        runOneSignal();

        if (navigator.serviceWorker) {
            navigator.serviceWorker.register('/sw.js');
        }

        window.addEventListener('beforeunload', handlePageShow);
        return () => {
            window.removeEventListener('beforeunload', handlePageShow);
        };

    }, [handlePageShow]);

    useEffect(() => {

        let element = document.querySelector('.animated-view');
        if (element) {
            element.classList.remove('page-fade-out');
        }

        if (navigator.serviceWorker) {
            navigator.serviceWorker.register('/sw.js');
        }
    }, [data?.url]);

    function getFullOffsetTop(element) {
        let offsetTop = 0;
        while (element) {
            offsetTop += element.offsetTop;
            element = element.offsetParent;
        }
        return offsetTop;
    }

    // Sticky columns
    useEffect(() => {
        const handleScroll = () => {
            const elements = Array.from(document.getElementsByClassName("fixed-process"));
            const scrollY = window.scrollY;
            const innerHeight = window.innerHeight;

            elements.forEach(element => {
                const offset = getFullOffsetTop(element.parentNode);
                const offset1 = 24;
                const h = scrollY - offset;
                const style = window.getComputedStyle(element);
                const marginTop = parseInt(style.marginTop, 10);
                const marginBottom = parseInt(style.marginBottom, 10);
                const elementHeight = element.offsetHeight;
                const elementHeightParent = element.parentNode.parentNode.offsetHeight;

                if (elementHeightParent > elementHeight) {
                    element.classList.add('fixed');
                    const height = elementHeight + marginTop + marginBottom - innerHeight + offset1;
                    element.style.top = `${offset}px`;

                    if (innerHeight - offset < elementHeight + marginTop + marginBottom + offset1) {
                        const topValue = height > h ? -h : -height;
                        element.style.top = `${topValue}px`;

                        if (height > h) {
                            element.setAttribute('a', `${topValue}px`);
                        }
                    }
                } else {
                    element.classList.remove('fixed');
                }
            });
        };


        window.addEventListener('scroll', handleScroll);
        //handleScroll(); disabled, reason: on profile page on load right block is on top

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const { layoutName } = getLayoutName(data, uri, true);
    const [headerSettings, setHeaderSettings] = useState(getHeaderSettings(uri, width, layoutName));

    useEffect(() => {
        let a = getHeaderSettings(uri, width, layoutName);
        if (getLayout(currentUser, layoutName) == 'ver') {
            if (width > 1024)
                a.offset = false;
        }
        if (!deepEqual(headerSettings, a)) {
            setHeaderSettings(a);
        }
    }, [uri, width, layoutName]);


    if (data?.empty)
        return <>{children}</>

    const themeSuffix = theme === 'dark' ? '_dark' : '';
    const stylesBgImage = {
        backgroundAttachment: 'fixed',
        backgroundImage: appSetting('layout', `background_image${themeSuffix}`)
    };
    const stylesBg = {
        backgroundColor: appSetting('layout', `background_color${themeSuffix}`)
    };

    useEffect(() => {
        const applyStyles = styles => {
            for (const style in styles) {
                document.body.style[style] = styles[style];
            }
        };

        applyStyles(stylesBgImage);
        applyStyles(stylesBg);
    }, [stylesBgImage, stylesBg]);
    console.log('Content1')
    return <MemoizedContent blocks={blocks} headerSettings={headerSettings} currentUser={currentUser} layoutName={layoutName} data={data} children={children} uri={uri} />
}

const Content = React.memo(({ children, headerSettings, stylesBgImage, currentUser, layoutName }) => {
    return (
        <>

            <View className="w-full items-stretch" >
                <View className=" w-full mx-auto flex-row " >
                    <View className={(layoutName != 'messenger' ? 'pb-16 lg:pb-0' : '') + '  w-full  relative overflow-hidden    mx-auto'}>{/*mb-16* TODO lg:pb-0*/}
                        <View className='w-full mx-auto min-h-screen'>
                            {headerSettings.offset && <View className='w-full h-16' />}
                            <Informer />
                            {children}
                        </View>

                    </View>
                </View>
                {/*layoutName == 'default' && appStatic('components_fullfooter', '')*/}
                {(headerSettings?.footer !== false || !currentUser) && <Footer />}
            </View>
        </>
    );
});
