import React, { useEffect, useCallback, useState } from 'react';
import Footer from 'app/customization/nav/footer';
import { Modal } from 'app/design/controls'
import Informer from 'app/components/elements/informer';
import Suggestions from 'app/ui/molecules/misc/suggestions';
import AsyncWorker from 'app/ui/molecules/system/async-worker';
import { View } from 'app/design/view';
import { useCurrentUser } from 'app/context/user'
import BottomSheet from 'app/ui/molecules/dialogs/bottomsheet-content';
import { appSetting, storageClear, decodeText, isChatLayout } from 'app/lib/util'
import { appStatic } from 'app/lib/app-static'
import { scheduleOneSignalSubscription } from 'app/lib/platform/one-signal';
import { useThemeName, useThemeValue } from 'app/design/theme';
import { useTranslation } from 'react-i18next'
import { useLayoutSettings } from 'app/context/layout-settings';
import PopupModal from 'app/ui/molecules/dialogs/popup-modal'
import { PageHeader } from 'app/ui/molecules/header/page-header';
import { HeaderOptionsProvider } from 'app/ui/molecules/header/options';
import { useFooter } from 'app/context/jotai/layout';
import Script from 'next/script';

const MemoizedContent = React.memo(({ currentUser, pageLayoutName, layoutName, data, children, blocks }) => {
    const [isModal, setIsModal] = useState(false);
    const { t } = useTranslation()
    useEffect(() => {
        if (currentUser === false && appSetting('layout', 'show_login_modal') > 0 && !['create-account', 'login','home',  'forgot-password', 'confirm-email'].includes(data.uri)) {
            const timeoutId = setTimeout(() => {
                setIsModal(true)
            }, appSetting('layout', 'show_login_modal'));
            return () => clearTimeout(timeoutId);
        }
    }, [currentUser]);

    const handleCloseModal = () => {
        setIsModal(false)
    }


    if (data.page_status == 503 || currentUser?.page_status == 503) {
        return <>
            {appStatic('maintenance_mode')}
        </>
    }

    return (
        <View className="w-full flex-1 bg-background">
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[10000] focus:h-auto focus:w-auto focus:overflow-visible focus:whitespace-normal focus:rounded-lg focus:border focus:border-border focus:bg-card focus:px-4 focus:py-2.5 focus:text-sm focus:font-medium focus:text-card-foreground focus:shadow-md focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-ring"
            >
                Skip to content
            </a>
            <Suggestions />
            <AsyncWorker />
            <HeaderOptionsProvider>
                <PageHeader layoutName={layoutName} pageLayoutName={pageLayoutName} pageData={data} />
                <Content layoutName={layoutName} children={children} currentUser={currentUser} url={data?.url} />
            </HeaderOptionsProvider>
            <Footer />
            <BottomSheet />
            {isModal && (
                <Modal title={t('login_modal_title')} onVisible={isModal} onClose={() => handleCloseModal()}>
                    <PopupModal />
                </Modal>
            )}
        </View>
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
    const { layout, data, blocks, children } = props;
    const uri = data.uri;
    const { layoutName } = layout;
    const theme = useThemeName();

    // Set theme attributes - must be in useEffect for SSR compatibility
    useEffect(() => {
        const root = document.documentElement;
        root.setAttribute('theme', theme);
        root.setAttribute('data-theme', theme);
    }, [theme]);

    const handlePageShow = useCallback((event) => {
        storageClear();
    }, []);

    useEffect(() => {
        window.addEventListener('beforeunload', handlePageShow);
        return () => {
            window.removeEventListener('beforeunload', handlePageShow);
        };

    }, [handlePageShow]);

    useEffect(() => {
        if (!currentUser?.id) {
            return;
        }

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

        return scheduleOneSignalSubscription(currentUser, {
            askPermission: appSetting('notifications', 'onesignal_request_on_load') ?? appSetting('native', 'onesignal_request_on_load'),
        });
    }, [currentUser?.id]);


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

    function clearFixedProcess(el) {
        el.classList.remove('is-fixed');
        el.style.position = '';
        el.style.top = '';
        el.style.bottom = '';
        el.style.width = '';
        el.style.left = '';
    }

    const { layoutName: pageLayoutName } = useLayoutSettings();

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

    }, [currentUser?.notifications]);

    const themeSuffix = useThemeValue('', '_dark');
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

    if (data?.empty)
        return <>{children}</>

    return <MemoizedContent pageLayoutName={pageLayoutName} blocks={blocks} currentUser={currentUser} layoutName={layoutName} data={data} children={children} uri={uri} />
}

const Content = React.memo(({ children, currentUser, layoutName, url }) => {
    const externalScripts = appSetting('layout', 'external_scripts') || [];
    const footer = useFooter();

    const isHideHeader = (appSetting('layout', 'hide_header_for_non_logged') && !currentUser) || appSetting('layout', 'hide_header_for_all');
    // Only reserve bottom space when the tab bar is actually rendered.
    // The tab bar renders for logged-in users (or when show_tabbar_on_mobile_non_logged is set)
    // and only when the footer atom is truthy. Avoids phantom scroll on auth/guest pages.
    const showBottomTabBar = footer && (currentUser || appSetting('layout', 'show_tabbar_on_mobile_non_logged'));
    const mainClassName = `${(!isChatLayout(layoutName) &&layoutName != 'post' && layoutName != 'task' && !isHideHeader && showBottomTabBar) ? ' pb-16 web:lg:pb-0 lg:pb-0 ' : ''} ns--main-content-- w-full mx-auto ne--`;
    const contentKey = (layoutName === 'layout_1_column_wiki' || layoutName === 'wiki')
        ? 'wiki'
        : url;

    return (
        <View className="ns--main-wrapper-- w-full mx-auto items-stretch cnt-root ne--" key={contentKey}>
            <main id="main-content" tabIndex={-1} className={`${mainClassName} outline-none scroll-mt-24`}>
                <Informer />
                {children}
            </main>
            {externalScripts.map((script) => {
                if (!script?.src) return null;
                const { src, strategy, ...attrs } = script;
                return (
                    <Script
                        key={src}
                        src={src}
                        strategy={strategy || "afterInteractive"}
                        {...attrs}
                    />
                );
            })}
        </View>
    );
});