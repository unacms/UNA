import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { RemoveScroll } from 'react-remove-scroll';
import { View, Pressable } from 'app/design/view';
import { Text } from 'app/design/typography';
import { NeoButton } from 'app/design/controls/neo-button/neo-button';
import emitter from 'app/context/emitter';
import { useIsDesktop } from 'app/context/measure';
import { UNSAVED_FORM_CONFIRM_REQUEST } from 'app/lib/form/form-helpers';

const POPOVER_WIDTH = 320;
const POPOVER_GAP = 8;
const VIEWPORT_EDGE = 16;
const SURFACE = 'bg-popover/90 backdrop-blur shadow-lg shadow-card-outline dark:shadow-card-outline-deep';

/** Below the anchor, right edges aligned, kept inside the viewport. */
function getPopoverPosition(anchor) {
    const rect = anchor.getBoundingClientRect();
    if (!rect.width && !rect.height) return null;
    const maxLeft = window.innerWidth - POPOVER_WIDTH - VIEWPORT_EDGE;
    return {
        top: rect.bottom + POPOVER_GAP,
        left: Math.max(VIEWPORT_EDGE, Math.min(rect.right - POPOVER_WIDTH, maxLeft)),
    };
}

/**
 * Web "discard unsaved changes?" confirm. Desktop: a popover from the topmost
 * modal's close button (no second fog over the modal); centered when nothing
 * to anchor to. Mobile: a bottom action sheet. Escape / outside press keep editing.
 */
export function UnsavedFormConfirmHost() {
    const { t } = useTranslation();
    const isDesktop = useIsDesktop();
    const [request, setRequest] = useState(null);
    const [anchorPosition, setAnchorPosition] = useState(null);
    const [mounted, setMounted] = useState(false);
    const settleRef = useRef(null);
    const keepRef = useRef(null);

    useEffect(() => {
        setMounted(true);
        const subscription = emitter.addListener(UNSAVED_FORM_CONFIRM_REQUEST, (payload) => {
            settleRef.current = payload.settle;
            setRequest({ message: payload.message ?? '', anchor: payload.anchor ?? null });
        });
        return () => subscription.remove();
    }, []);

    const dismiss = useCallback((proceed) => {
        setRequest(null);
        const settle = settleRef.current;
        settleRef.current = null;
        settle?.(proceed);
    }, []);

    const anchor = isDesktop ? request?.anchor : null;
    // Derived, not reset from an effect: a no-op setState there can loop hydration.
    const position = anchor ? anchorPosition : null;

    useLayoutEffect(() => {
        if (!anchor) return undefined;
        const update = () => setAnchorPosition(getPopoverPosition(anchor));
        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, [anchor]);

    useEffect(() => {
        if (!request || Platform.OS !== 'web') return undefined;
        // Safe choice first: Enter / Space keep editing.
        keepRef.current?.focus?.();
        const onKeyDown = (event) => {
            if (event.key !== 'Escape') return;
            event.preventDefault();
            event.stopImmediatePropagation();
            // RN-web Modal closes on the Escape *keyup* — swallow it too, or the
            // modal asks again right after "keep editing".
            const swallowKeyUp = (upEvent) => {
                if (upEvent.key !== 'Escape') return;
                upEvent.stopImmediatePropagation();
                window.removeEventListener('keyup', swallowKeyUp, true);
            };
            window.addEventListener('keyup', swallowKeyUp, true);
            dismiss(false);
        };
        window.addEventListener('keydown', onKeyDown, true);
        return () => window.removeEventListener('keydown', onKeyDown, true);
    }, [request, dismiss]);

    if (Platform.OS !== 'web' || !mounted || !request) return null;

    const message = request.message || t('You have unsaved changes. Close without saving?');
    const discardButton = (
        <NeoButton
            role="destructive"
            style="bordered"
            controlSize="large"
            width="fill"
            label={t('Close without saving')}
            onPress={() => dismiss(true)}
        />
    );
    const keepButton = (
        <NeoButton
            forwardedRef={keepRef}
            style="bordered"
            controlSize="large"
            width="fill"
            label={t('Keep editing')}
            onPress={() => dismiss(false)}
        />
    );
    const messageText = (
        <Text className="text-center text-base font-semibold text-popover-foreground whitespace-pre-line">
            {message}
        </Text>
    );

    let content;
    if (!isDesktop) {
        // iOS-style action sheet: question + destructive action, cancel apart.
        content = (
            <Pressable
                className="fixed inset-0 z-[10050] justify-end bg-black/20"
                onPress={() => dismiss(false)}
            >
                <Pressable
                    role="alertdialog"
                    aria-modal
                    aria-label={message}
                    className="w-full gap-y-2 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
                    onPress={(event) => event.stopPropagation()}
                >
                    <View className={`gap-y-4 rounded-3xl p-4 ${SURFACE}`}>
                        {messageText}
                        {discardButton}
                    </View>
                    <View className={`rounded-3xl p-2 ${SURFACE}`}>{keepButton}</View>
                </Pressable>
            </Pressable>
        );
    } else {
        const popoverStyle = position
            ? { position: 'fixed', top: position.top, left: position.left, width: POPOVER_WIDTH }
            : { width: POPOVER_WIDTH };
        // No fog: the modal underneath stays as is; an outside press keeps editing.
        content = (
            <Pressable
                className={`fixed inset-0 z-[10050] web:cursor-default ${position ? '' : 'items-center justify-center bg-black/10'}`}
                onPress={() => dismiss(false)}
            >
                <Pressable
                    role="alertdialog"
                    aria-modal
                    aria-label={message}
                    style={popoverStyle}
                    className={`gap-y-4 rounded-2xl p-4 web:cursor-default ${SURFACE}`}
                    onPress={(event) => event.stopPropagation()}
                >
                    {messageText}
                    <View className="gap-y-2">
                        {discardButton}
                        {keepButton}
                    </View>
                </Pressable>
            </Pressable>
        );
    }

    // Inside the modal root: RN-web Modal traps focus and would pull it back
    // from a sibling portal (keyboard could not reach these buttons).
    const container = request.anchor?.closest?.('[aria-modal="true"]') ?? document.body;
    return createPortal(<RemoveScroll>{content}</RemoveScroll>, container);
}
