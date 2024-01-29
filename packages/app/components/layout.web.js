import React, { useEffect, useCallback, lazy, useMemo, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import Footer from './footer';
import { Modal } from 'app/design/controls'
import Informer from 'app/components/elements/informer';
import Suggestions from 'app/ui/molecules/suggestions';
import AsyncWorker from 'app/ui/molecules/async_worker';
import { View, Row } from 'app/design/view';
import { getLayoutName } from 'app/components/page-layout';
import { useCurrentUser } from 'app/context/user'
import BottomSheet from 'app/ui/molecules/bottomsheet_content';
import { getHeaderSettings } from 'app/lib/util';
import { useColorScheme } from 'react-native';
import { appSetting } from 'app/lib/util'
import BottomSheetDataContext from 'app/context/bottomsheet';
import { appStatic } from 'app/lib/app-static'
import { storageSet, storageClear, storageGet } from 'app/lib/util'

const Navbar = lazy(() => import('app/components/nav/navbar'));

const NavbarMemo = React.memo(function NavbarMemo(props) {
    return (
        <Navbar {...props} />
    );
});

export default function Layout(props) {
    const [isModal, setIsModal] = useState(false);
    const { currentUser, setCurrentUser } = useCurrentUser();
    let data = props.data;
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
            // disbled: header not sticky issue
            //element.classList.add('page-fade-in');
        }

        if (navigator.serviceWorker) {
            navigator.serviceWorker.register('/sw.js');
        }
    }, [data.url]);

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
            let elements = document.getElementsByClassName("fixed-process");
            for (let i = 0; i < elements.length; i++) {
                const offset = getFullOffsetTop(elements[i].parentNode);
                const offset1 = 24;
                const scrollY = window.scrollY;
                const innerHeight = window.innerHeight;
                let h = scrollY - offset;
                let style = window.getComputedStyle(elements[i]);
                let marginTop = parseInt(style.marginTop, 10);
                let marginBottom = parseInt(style.marginBottom, 10);
                let elementHeight = elements[i].offsetHeight;

                let elementHeightParent = elements[i].parentNode.parentNode.offsetHeight;
                if (elementHeightParent > elementHeight) {
                    elements[i].classList.add('fixed');
                    let height = elementHeight + marginTop + marginBottom - innerHeight + offset1;
                    elements[i].style.top = offset + 'px';
                    if (innerHeight - offset < elementHeight + marginTop + marginBottom + offset1) {
                        let topValue = height > h ? -h : -height;
                        elements[i].style.top = `${topValue}px`;
                        if (height > h) {
                            elements[i].setAttribute('a', `${topValue}px`);
                        }
                    }
                }
                else {
                    elements[i].classList.remove('fixed');
                }
            }
        };

        // Add the event listener when the component mounts
        window.addEventListener('scroll', handleScroll);

        // Clean up the event listener when the component unmounts
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };

    }, []);

    const { layoutName } = getLayoutName(data, uri, true);
    const headerSettings = useMemo(() => getHeaderSettings(uri, width, layoutName), [uri, width]);

    if (data?.empty)
        return <>{children}</>

    let stylesBgImage = { backgroundAttachment: 'fixed', backgroundImage: appSetting('layout', 'background_image') }
    let stylesBg = { backgroundColor: appSetting('layout', 'background_color') }
    if (theme === 'dark') {
        stylesBgImage = { backgroundAttachment: 'fixed', backgroundImage: appSetting('layout', 'background_image_dark') }
        stylesBg = { backgroundColor: appSetting('layout', 'background_color_dark') }
    }

    if (layoutName === 'messenger')
        stylesBgImage = Object.assign(stylesBgImage, { minHeight: 'auto', bottom: 0, position: 'fixed' });

    useEffect(() => {
        for (let style in stylesBgImage) {
            document.body.style[style] = stylesBgImage[style];
        }
        for (let style in stylesBg) {
            document.body.style[style] = stylesBg[style];
        }

    }, []);

    useEffect(() => {
        console.log(props);
        if (!currentUser && !storageGet('layout:modal', '', true) && appSetting('layout', 'show_modal') > 0 && !['create-account', 'home', 'login'].includes(props.uri)) {
            setTimeout(() => {
                setIsModal(true)
            }, appSetting('layout', 'show_modal'));
        }
    }, []);

    const ModalPopup =  ({ }) => {
        let p = {
            blocks: props.blocks,
            data: props.data,
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

    if (appSetting('layout', 'format') == 'hor') {
        return (
            <BottomSheetDataContext>
                <Content headerSettings={headerSettings} children={children} currentUser={currentUser} />
                <Suggestions />
                <AsyncWorker />
                <NavbarMemo layoutName={layoutName} title={data.name} menu={data.menu} menu_add={data.menu_add || false} uri={uri} />
                <BottomSheet />
                <ModalPopup/>
            </BottomSheetDataContext>
        );
    }

    if (appSetting('layout', 'format') == 'ver') {
        if (width > 1024)
            headerSettings.offset = false;
        return (
            <BottomSheetDataContext>
                <View className={appSetting('layout', 'max_width') + ' w-full mx-auto'}>
                    <Row className='w-full flex-col lg:flex-row-reverse lg:border-l lg:border-r border-dashed border-bdr dark:border-bdr-d'>
                        <View className='w-full lg:w-[calc(100%-20rem)]'>
                            <Content headerSettings={headerSettings} children={children} currentUser={currentUser} />
                            <Suggestions />
                            <AsyncWorker />
                        </View>
                        <View className='w-full lg:w-80'>
                            <NavbarMemo layoutName={layoutName} title={data.name} menu={data.menu} menu_add={data.menu_add || false} uri={uri} />
                        </View>
                    </Row>
                    <BottomSheet />
                    <ModalPopup/>
                </View>
            </BottomSheetDataContext>
        );
    }
}

const Content = React.memo(({ children, headerSettings, stylesBgImage, currentUser }) => {
    return (
        <>
            
            <View className="w-full items-stretch" >
                <View className=" w-full mx-auto flex-row -top-[1px] " >
                    <View className={'  w-full  relative overflow-hidden mb-16 sm:mb-0 mx-auto'}>
                        <View className='w-full mx-auto'>
                            {headerSettings.offset && <View className='w-full h-16' />}
                            <Informer />
                            {children}
                        </View>
                    </View>
                </View>
                {(headerSettings?.footer !== false || !currentUser) && <Footer />}
            </View>
        </>
    );
});