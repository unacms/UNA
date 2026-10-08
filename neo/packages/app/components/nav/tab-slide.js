'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useIsFocused, getWindowSafeAreaInsets } from 'app/lib/hooks/router';
import { isNativeTabsEnabled } from 'app/lib/util';
import { nativeDriver } from 'app/lib/platform/animation';
import { TabChromeProvider } from 'app/context/tab-chrome';
import { TabRouteOverrideContext } from 'app/context/tab-route-override';
import { usePathname } from 'expo-router';
import { useCurrentUser } from 'app/context/user';
import { getNativeTabBarHeight } from 'app/components/nav/tabs/tab-menu';

const SLIDE_MS = 320;
const SLIDE_EASING = Easing.bezier(0.32, 0.72, 0, 1);

const slots = new Map();
const translateByKey = new Map();
const hostListeners = new Set();
let activeTabKey = '/tab0';
let lastTabKey = null;
let coveredTabKey = null;
let holdTabKey = null;
let slideAnim = null;

function tabIndexFromKey(tabKey) {
    const match = String(tabKey || '').match(/tab(\d+)/);
    return match ? Number(match[1]) : 0;
}

function getTranslate(tabKey, width = 0) {
    let value = translateByKey.get(tabKey);
    if (!value) {
        const parked = tabKey !== activeTabKey && tabKey !== coveredTabKey;
        value = new Animated.Value(parked && width ? width : 0);
        translateByKey.set(tabKey, value);
    }
    return value;
}

function notifyHost() {
    hostListeners.forEach((fn) => fn());
}

function useHostSlots() {
    const [, bump] = useState(0);
    useLayoutEffect(() => {
        const onChange = () => bump((n) => n + 1);
        hostListeners.add(onChange);
        return () => hostListeners.delete(onChange);
    }, []);
    return Array.from(slots.values());
}

function publishSlot(tabKey, node, chromeKey = tabKey, pushed = false) {
    const prev = slots.get(tabKey);
    if (!node && prev?.node) {
        return;
    }
    if (prev?.node === node && prev?.chromeKey === chromeKey) {
        return;
    }
    slots.set(tabKey, { tabKey, node, chromeKey, pushed });
    notifyHost();
}

export function resetTabSlideSlots() {
    slideAnim?.stop();
    slideAnim = null;
    slots.clear();
    translateByKey.clear();
    lastTabKey = null;
    coveredTabKey = null;
    holdTabKey = null;
    activeTabKey = '/tab0';
    notifyHost();
}

function beginHoldPrevious(nextKey) {
    if (!lastTabKey || lastTabKey === nextKey) return;
    holdTabKey = lastTabKey;
    notifyHost();
}

function runTabSlideTransition(toKey, width) {
    const fromKey = lastTabKey;
    lastTabKey = toKey;
    activeTabKey = toKey;
    holdTabKey = null;
    if (fromKey === null || fromKey === toKey) {
        coveredTabKey = null;
        getTranslate(toKey).setValue(0);
        notifyHost();
        return;
    }

    const dir = tabIndexFromKey(toKey) >= tabIndexFromKey(fromKey) ? 1 : -1;
    const fromX = getTranslate(fromKey);
    const toX = getTranslate(toKey);
    slideAnim?.stop();
    fromX.setValue(0);
    toX.setValue(dir * width);
    coveredTabKey = fromKey;
    notifyHost();
    slideAnim = Animated.timing(toX, {
        toValue: 0,
        duration: SLIDE_MS,
        easing: SLIDE_EASING,
        useNativeDriver: nativeDriver,
    });
    slideAnim.start(({ finished }) => {
        if (!finished || fromKey === activeTabKey) return;
        fromX.setValue(dir * width);
        if (coveredTabKey === fromKey) {
            coveredTabKey = null;
            notifyHost();
        }
    });
}

function rankScreen(tabKey) {
    if (tabKey === activeTabKey) return 2;
    if (tabKey === coveredTabKey || tabKey === holdTabKey) return 1;
    return 0;
}

function isOverlayActive() {
    return !!(coveredTabKey || holdTabKey);
}

/**
 * Lives above NativeTabs so the real pages are visible. The bottom strip is
 * left empty so the system tab bar still receives taps.
 */
export function TabSlideHost({ sessionKey, backgroundColor }) {
    const screens = useHostSlots();
    const { width } = useWindowDimensions();
    const realPathname = usePathname();
    const sessionRef = useRef(sessionKey);
    const { currentUser } = useCurrentUser();
    // Leave the tab bar's strip free (taller on Android with labels).
    const bottomReserve = getNativeTabBarHeight(currentUser) + (getWindowSafeAreaInsets().bottom || 0);

    useLayoutEffect(() => {
        if (sessionRef.current === sessionKey) return;
        sessionRef.current = sessionKey;
        resetTabSlideSlots();
    }, [sessionKey]);

    if (!isNativeTabsEnabled() || !isOverlayActive()) {
        return null;
    }

    const overlayKeys = new Set([activeTabKey, coveredTabKey, holdTabKey].filter(Boolean));
    const ordered = screens
        .filter((screen) => screen.node && overlayKeys.has(screen.tabKey))
        .sort((a, b) => rankScreen(a.tabKey) - rankScreen(b.tabKey));

    return (
        <View pointerEvents="box-none" style={styles.host}>
            <View
                pointerEvents="box-none"
                style={[styles.pageLayer, { bottom: bottomReserve, backgroundColor }]}
            >
                {ordered.map(({ tabKey, node, chromeKey, pushed }) => {
                    const focused = tabKey === activeTabKey;
                    return (
                        <Animated.View
                            key={tabKey}
                            collapsable={false}
                            pointerEvents={focused ? 'auto' : 'none'}
                            style={[
                                styles.screen,
                                backgroundColor ? { backgroundColor } : null,
                                { transform: [{ translateX: getTranslate(tabKey, width) }] },
                            ]}
                        >
                            <TabChromeProvider tabKey={chromeKey || tabKey} pushed={!!pushed}>
                                <TabRouteOverrideContext.Provider
                                    value={{
                                        pathname: focused ? realPathname : tabKey,
                                        isFocused: focused,
                                    }}
                                >
                                    {node}
                                </TabRouteOverrideContext.Provider>
                            </TabChromeProvider>
                        </Animated.View>
                    );
                })}
            </View>
        </View>
    );
}

/**
 * Pages render in the NativeTabs screen. The host only overlays the previous
 * page while the next one covers it. A tab's slot holds the page on top of its
 * stack: only the focused screen publishes, so a page below a pushed one (or
 * one just popped) never takes it over.
 */
export function TabSlide({ tabKey, chromeKey = tabKey, pushed = false, ready = true, children }) {
    const isFocused = useIsFocused();
    const { width } = useWindowDimensions();
    const wasActiveRef = useRef(false);
    const nativeTabs = isNativeTabsEnabled();
    const lastNodeRef = useRef(null);
    if (ready && children) {
        lastNodeRef.current = children;
    }
    const node = (ready ? children : null) || lastNodeRef.current;

    useLayoutEffect(() => {
        if (!nativeTabs || !tabKey || !isFocused) return undefined;
        publishSlot(tabKey, node, chromeKey, pushed);
        return undefined;
    }, [nativeTabs, node, tabKey, chromeKey, pushed, isFocused]);

    useLayoutEffect(() => {
        if (!nativeTabs) return;
        if (isFocused && !wasActiveRef.current) {
            wasActiveRef.current = true;
            beginHoldPrevious(tabKey);
        } else if (!isFocused && wasActiveRef.current) {
            wasActiveRef.current = false;
        }
        if (isFocused && ready) {
            runTabSlideTransition(tabKey, width);
        }
    }, [isFocused, nativeTabs, ready, tabKey, width]);

    return children;
}

const styles = StyleSheet.create({
    host: {
        ...StyleSheet.absoluteFillObject,
    },
    pageLayer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        overflow: 'hidden',
    },
    screen: {
        ...StyleSheet.absoluteFillObject,
    },
});
