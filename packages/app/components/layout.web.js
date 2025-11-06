import React, { useEffect, useCallback, lazy, useState } from 'react';
import Footer from 'app/components/nav/footer';
import { Modal } from 'app/design/controls'
import Informer from 'app/components/elements/informer';
import Suggestions from 'app/ui/molecules/suggestions';
import AsyncWorker from 'app/ui/molecules/async_worker';
import { View, Row } from 'app/design/view';
import { useCurrentUser } from 'app/context/user'
import BottomSheet from 'app/ui/molecules/bottomsheet_content';
import { getHeaderSettings, deepEqual } from 'app/lib/util';
import { appSetting, storageSet, storageClear, storageGet, decodeText } from 'app/lib/util'
import { appStatic } from 'app/lib/app-static'
import OneSignal from 'react-onesignal';
import { ThemeName } from 'app/design/theme';
import { useTranslation } from 'react-i18next'
import { useLayoutSettings } from 'app/context/layout-settings';
import { useIsDesktop } from 'app/context/measure';

const Navbar = lazy(() => import('app/components/nav/navbar'));

const NavbarMemo = React.memo(function NavbarMemo(props) {
    return (
        <Navbar {...props} />
    );
});

async function runOneSignal() {
    const ONESIGNAL_KEY = appSetting('config', 'api_keys', 'onesignal');
    const isLocalhost = window.location.hostname === 'localhost';
    if (!isLocalhost && ONESIGNAL_KEY && !appSetting('config', 'onesignal_web_disable')) {
        console.log('OneSignal: Initializing', window.OneSignal, window.OneSignal.isInitialized);
        if (!window.OneSignal || !window.OneSignal.isInitialized) {
            await OneSignal.init({ appId: ONESIGNAL_KEY, allowLocalhostAsSecureOrigin: true });
            OneSignal.Slidedown.promptPush();
        }
    }
}


const MemoizedContent = React.memo(({ headerSettings, currentUser, pageLayoutName, layoutName, data, children, uri, blocks }) => {
    const [isModal, setIsModal] = useState(false);
    const { t } = useTranslation()

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
        return (<Modal title={t('login_modal_title')} onVisible={isModal} onClose={() => handleCloseModal()}>
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
    return (
        <>
            <Suggestions />
            <AsyncWorker />
            <NavbarMemo pageLayoutName={pageLayoutName} headerSettings={headerSettings} context={data?.context} layoutName={layoutName} title={data?.name} menu={data?.menu} menu_add={data?.menu_add || false} uri={uri} url={data?.url} >
                <Content layoutName={layoutName} headerSettings={headerSettings} children={children} currentUser={currentUser} url={data?.url} />
            </NavbarMemo>
            {headerSettings.footer !== false && !appSetting('layout', 'footer', 'hide_for_layouts').includes(layoutName) && <Footer />}
            <BottomSheet />
            <ModalPopup />
        </>
    );

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

    const { currentUser } = useCurrentUser();
    const { layout, data, blocks, uri, children } = props;
    const { layoutName } = layout;
    const isDesktop = useIsDesktop();
    const theme = ThemeName();
    const root = window.document.documentElement;
    root.setAttribute('theme', theme)
    root.setAttribute('data-theme', theme);


    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    darkModeMediaQuery.addListener((e) => {
        const newColorScheme = e.matches ? "dark" : "light";
        root.setAttribute('theme', newColorScheme)
        root.setAttribute('data-theme', newColorScheme);
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


    function getTopOffset() {
        const fixedEls = document.querySelectorAll('.header-fixed');

        let sum = 0;
        fixedEls.forEach(el => {
            const rect = el.getBoundingClientRect();
            const style = getComputedStyle(el);
            const height = rect.height
                + parseFloat(style.marginTop || 0)
                + parseFloat(style.marginBottom || 0);

            sum += height;
        });

        return sum;
    }

    function handleScroll() {
        const TOP_OFFSET = getTopOffset();
        const HYST = 8;
        const avail = Math.max(0, window.innerHeight - TOP_OFFSET);

        document.querySelectorAll('.fixed-process').forEach(el => {
            const parent = el.parentElement;
            const container = parent?.parentElement;
            if (!parent || !container) return;


            const elH = el.offsetHeight;
            const containerTopDoc = window.scrollY + container.getBoundingClientRect().top;
            const containerBottomDoc = containerTopDoc + container.scrollHeight;

            const stickyStart = containerTopDoc - TOP_OFFSET;
            const stickyEnd = containerBottomDoc - elH - TOP_OFFSET;
            const y = window.scrollY;

            // сброс по умолчанию
            el.classList.remove('is-fixed');
            el.style.position = '';
            el.style.top = '';
            el.style.bottom = '';
            if (container.scrollHeight <= elH || y < stickyStart ) return;//|| stickyStart == 0

            if (y > stickyEnd + HYST) {
                // прижимаем к низу
                el.style.position = 'absolute';
                el.style.bottom = '0';
                return;
            }

            // фиксируем
            el.classList.add('is-fixed');
            el.style.position = 'fixed';
            if (parent.offsetWidth > 0) el.style.width = `${parent.offsetWidth}px`;
            
            if (elH <= avail) {
                // помещается во viewport
                el.style.top = `${TOP_OFFSET}px`;
            } else {
                // прокручиваем внутри viewport
                const overflow = elH - avail;
                const progress = Math.min(Math.max(y - stickyStart, 0), overflow);
                el.style.top = `${TOP_OFFSET - progress}px`;
            }
        });
    }

    useEffect(() => {
        window.addEventListener('scroll', handleScroll);
        window.addEventListener('resize_panel', handleScroll);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize_panel', handleScroll);

        };

    }, []);
    const { layoutName: pageLayoutName } = useLayoutSettings();
    const [headerSettings, setHeaderSettings] = useState(getHeaderSettings(uri, isDesktop, layoutName, data.config));

    useEffect(() => {
        let a = getHeaderSettings(uri, isDesktop, layoutName, data.config);
        if (pageLayoutName == 'ver') {
            if (isDesktop)
                a.offset = false;
        }

        // Disable offset for navigator layout with adjustable panels
        /* if (layoutName === 'navigator') {
             const cellsCustomConfig = appSetting('layouts', 'navigator') || appSetting('layouts', 'cols-l-c');
             if (cellsCustomConfig?.adjustable) {
                 a.offset = false;
             }
         }
 */
        if (!deepEqual(headerSettings, a)) {
            setHeaderSettings(a);
        }
    }, [uri, isDesktop, layoutName, data.config, currentUser, pageLayoutName, headerSettings]);

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
    return <MemoizedContent pageLayoutName={pageLayoutName} blocks={blocks} headerSettings={headerSettings} currentUser={currentUser} layoutName={layoutName} data={data} children={children} uri={uri} />
}

const Content = React.memo(({ children, headerSettings, currentUser, layoutName, url }) => {
    const isHideHeader = (appSetting('layout', 'hide_header_for_non_logged') && !currentUser) || appSetting('layout', 'hide_header_for_all');
    return (
        <View className="w-full items-stretch cnt-root mx-auto flex-row " key={url}>
            <View className={((layoutName != 'messenger' && layoutName != 'post' && !isHideHeader) ? ' pb-16 web:lg:pb-0 lg:pb-0 ' : '') + ' w-full mx-auto'}>{/*mb-16* TODO lg:pb-0*/}
                {(headerSettings.offset && !isHideHeader) && <View className={` ${appSetting('layout', 'header', 'offset')}`} />}{/*use this to offset the header globally*/}
                <Informer />
                {children}
            </View>
        </View>
    );
});