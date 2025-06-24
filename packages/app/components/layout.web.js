import React, { useEffect, useCallback, lazy, useMemo, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import Footer from 'app/components/nav/footer';
import { Modal } from 'app/design/controls'
import Informer from 'app/components/elements/informer';
import Suggestions from 'app/ui/molecules/suggestions';
import AsyncWorker from 'app/ui/molecules/async_worker';
import { View, Row } from 'app/design/view';
import { useCurrentUser } from 'app/context/user'
import BottomSheet from 'app/ui/molecules/bottomsheet_content';
import { getHeaderSettings, getLayout, deepEqual } from 'app/lib/util';
import { appSetting, storageSet, storageClear, storageGet, decodeText, LAYOUT_BREAKPOINTS } from 'app/lib/util'
import { appStatic } from 'app/lib/app-static'
import { menuItemsByName } from 'app/lib/util'
import OneSignal from 'react-onesignal';
import { ThemeName } from 'app/design/theme';

const Navbar = lazy(() => import('app/components/nav/navbar'));
const TABLET_MODE_FROM = appSetting('layout', 'tablet_mode_from');

const NavbarMemo = React.memo(function NavbarMemo(props) {
    return (
        <Navbar {...props} />
    );
});

async function runOneSignal() {
    const ONESIGNAL_KEY = appSetting('config', 'api_keys', 'onesignal');
    const isLocalhost = window.location.hostname === 'localhost';
    if (!isLocalhost && ONESIGNAL_KEY && !appSetting('config', 'onesignal_web_disable')) {
        await OneSignal.init({ appId: ONESIGNAL_KEY, allowLocalhostAsSecureOrigin: true });
        OneSignal.Slidedown.promptPush();
    }
}


const MemoizedContent = React.memo(({ headerSettings, currentUser, pageLayoutName, layoutName, data, children, uri, blocks, width }) => {
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
        return (<Modal title="Sign in to see more" onVisible={isModal} outerClickClose={false} onClose={() => handleCloseModal()}>
            {appStatic('components_modal', p)}
        </Modal>);
    };

    const handleCloseModal = () => {
        storageSet('layout:modal', '', true, true);
        setIsModal(false)
    }


    if (data.page_status == 503 || currentUser?.page_status == 503) {
        return <>
            {appStatic('maintenance_mode')}
        </>
    }
    
    if (width < LAYOUT_BREAKPOINTS[TABLET_MODE_FROM]) {
        return (
            <>
                <Suggestions />
                <AsyncWorker />
                    <Content width={width} layoutName={layoutName} headerSettings={headerSettings} children={children} currentUser={currentUser} url={data?.url} />
                    {(headerSettings?.footer !== false || !currentUser) && <Footer />}
                <BottomSheet />
                <ModalPopup />
            </>
        );

    }

    if (pageLayoutName == 'hor') {
        return (
            <>
                <Suggestions />
                <AsyncWorker />
                <NavbarMemo pageLayoutName={pageLayoutName} headerSettings={headerSettings} context={data?.context} layoutName={layoutName} title={data?.name} menu={data?.menu} menu_add={data?.menu_add || false} uri={uri} url={data?.url} >
                    <Content width={width} layoutName={layoutName} headerSettings={headerSettings} children={children} currentUser={currentUser} url={data?.url} />
                </NavbarMemo>
                <BottomSheet />
                <ModalPopup />
            </>
        );
    }

    if (pageLayoutName == 'mixed') {

        return (
            <>
                <Suggestions />
                <AsyncWorker />
                <NavbarMemo pageLayoutName={pageLayoutName} headerSettings={headerSettings} layoutName={layoutName} title={data?.name} menu={data?.menu} menu_add={data?.menu_add || false} uri={uri} url={data?.url} >
                    <Content width={width} layoutName={layoutName} headerSettings={headerSettings} children={children} currentUser={currentUser} url={data?.url} />
                </NavbarMemo>
                <BottomSheet />
                <ModalPopup />
            </>
        );
    }

    if (pageLayoutName == 'ver') {

        const menuItems = menuItemsByName('main_menu', appSetting('menu_items', 'menu_sidebar'), currentUser);
        return (
            <>
                <View className={appSetting('layout', 'max_width') + ' w-full mx-auto'}>
                    <Row className='w-full flex-col lg:flex-row-reverse  lg:min-h-screen '>
                        <View className={(menuItems.length > 0 ? 'lg:w-[calc(100%-20rem)] border-x border-bdr dark:border-bdr-d' : '') + ' w-full '}>
                            <Content width={width} layoutName={layoutName} headerSettings={headerSettings} children={children} currentUser={currentUser} url={data?.url} />
                            <Suggestions />
                            <AsyncWorker />
                        </View>
                        {menuItems.length > 0 && <View className='w-full lg:w-[360px]'>
                            <NavbarMemo pageLayoutName={pageLayoutName} headerSettings={headerSettings} layoutName={layoutName} title={data.name} menu={data.menu} menu_add={data.menu_add || false} uri={uri} url={data?.url} />
                        </View>}
                    </Row>
                    <BottomSheet />
                    <ModalPopup />
                </View>
            </>
        );
    }
});

const metaAdder = (queryProperty, value) => {
    let element = document.querySelector(`meta[${queryProperty}]`);
    if (element) {
        element.setAttribute("content", value);
    } else {
        element = `<meta ${queryProperty} content="${value}" />`;
        document.head.insertAdjacentHTML("beforeend", element);
    }
};

export default function Layout(props) {

    const { currentUser, setCurrentUser } = useCurrentUser();
    const { layoutName } = props.layout;
    let data = props.data;
    let blocks = props.blocks;
    let uri = props.uri
    let children = props.children
    const { width } = useWindowDimensions();

    let theme = ThemeName();
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

        if (navigator.serviceWorker) {
            navigator.serviceWorker.register('/sw.js');
        }

        window.addEventListener('beforeunload', handlePageShow);
        return () => {
            window.removeEventListener('beforeunload', handlePageShow);
        };

    }, [handlePageShow]);

    useEffect(() => {
        const addLinkTag = (rel, href, crossOrigin) => {
            const exists = document.querySelector(`link[rel="${rel}"][href="${href}"]`);
            if (exists) return;

            const link = document.createElement('link');
            link.rel = rel;
            link.href = href;
            if (crossOrigin) link.crossOrigin = crossOrigin;
            document.head.appendChild(link);
        };

        addLinkTag('preconnect', 'https://onesignal.com', 'anonymous');
        addLinkTag('preconnect', 'https://cdn.onesignal.com', 'anonymous');
        addLinkTag('dns-prefetch', 'https://onesignal.com');

        runOneSignal();

    }, []);

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
                element.style.width = `${element.parentNode.offsetWidth}px`;

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

    const [headerSettings, setHeaderSettings] = useState(getHeaderSettings(uri, width, layoutName, data.config));
    const pageLayoutName = getLayout(currentUser, layoutName);
    useEffect(() => {
        let a = getHeaderSettings(uri, width, layoutName, data.config);
        if (pageLayoutName == 'ver') {
            if (width > LAYOUT_BREAKPOINTS[TABLET_MODE_FROM])
                a.offset = false;
        }

        // Disable offset for splash/auth screens
        const splashRoutes = ['login', 'create-account', 'home']; 
        if (splashRoutes.includes(uri) && !currentUser) { 
            a.offset = false;
        }

        if (!deepEqual(headerSettings, a)) {
            setHeaderSettings(a);
        }
    }, [uri, width, layoutName, data.config, currentUser, pageLayoutName, headerSettings]);

    useEffect(() => {
        if (data?.title) {
            if (appSetting('notifications', 'count_in_title')) {
                if (currentUser?.notifications > 0) {
                    document.title = decodeText('(' + currentUser?.notifications + ') ' + data?.title);
                }
                else {
                    document.title = decodeText(data?.title);
                }
            }
            else {
                document.title = decodeText(data?.title);
            }

        }
        metaAdder('property="og:title"', decodeText(data?.title))
        if (props.settings)
            remoteSettings.data = props.settings;

    }, [currentUser?.notifications]);

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
    return <MemoizedContent width={width} pageLayoutName={pageLayoutName} blocks={blocks} headerSettings={headerSettings} currentUser={currentUser} layoutName={layoutName} data={data} children={children} uri={uri} />
}

const Content = React.memo(({ children, headerSettings, stylesBgImage, currentUser, layoutName, url, width }) => {
    const isHideHeader = (appSetting('layout', 'hide_header_for_non_logged') && !currentUser) || appSetting('layout', 'hide_header_for_all');
    console.log("headerSettings.offset", headerSettings.offset)
    return (
        <View className="w-full items-stretch cnt-root" key={url}>
            <View className=" w-full mx-auto flex-row " >
                <View className={((layoutName != 'messenger' && layoutName != 'post' && !isHideHeader) ? 'pb-16 lg:pb-0' : '') + ' w-full mx-auto'}>{/*mb-16* TODO lg:pb-0*/}
                    <View className='w-full mx-auto '>
                        {(headerSettings.offset && !isHideHeader) && <View className='w-full h-16 ' />}{/*use this to offset the header globally*/}
                        <Informer />
                        {children}
                    </View>
                </View>
            </View>
        </View>
    );
});