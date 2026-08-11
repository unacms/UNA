import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { RemoveScroll } from 'react-remove-scroll';
import { View, Row, Pressable } from 'app/design/view';
import { Text } from 'app/design/typography';
import { Button } from 'app/design/controls';
import emitter from 'app/context/emitter';
import { appSetting } from 'app/lib/util';
import { UNSAVED_FORM_CONFIRM_REQUEST } from 'app/lib/form-helpers';

const modalSettings = appSetting('theme', 'modal');

export function UnsavedFormConfirmHost() {
    const { t } = useTranslation();
    const [visible, setVisible] = useState(false);
    const [message, setMessage] = useState('');
    const [mounted, setMounted] = useState(false);
    const settleRef = useRef(null);

    useEffect(() => {
        setMounted(true);
        const subscription = emitter.addListener(UNSAVED_FORM_CONFIRM_REQUEST, (payload) => {
            settleRef.current = payload.settle;
            setMessage(payload.message ?? '');
            setVisible(true);
        });
        return () => subscription.remove();
    }, []);

    const dismiss = (proceed) => {
        setVisible(false);
        const settle = settleRef.current;
        settleRef.current = null;
        settle?.(proceed);
    };

    useEffect(() => {
        if (!visible || Platform.OS !== 'web') return;
        const onKeyUp = (event) => {
            if (event.key === 'Escape') dismiss(false);
        };
        window.addEventListener('keyup', onKeyUp);
        return () => window.removeEventListener('keyup', onKeyUp);
    }, [visible]);

    if (Platform.OS !== 'web' || !mounted || !visible) return null;

    return createPortal(
        <RemoveScroll>
            <Pressable
                className={`fixed inset-0 z-[10050] flex items-center justify-center ${modalSettings.fog}`}
                onPress={() => dismiss(false)}
            >
                <Pressable
                    className={`mx-4 w-full max-w-md ${modalSettings.container}`}
                    onPress={(event) => event.stopPropagation()}
                >
                    <View className="gap-y-4 p-4">
                        <Text className="text-center text-base text-muted-foreground whitespace-pre-line">
                            {message || t('You have unsaved changes. Close without saving?')}
                        </Text>
                        <Row className="gap-x-4 justify-center">
                            <Button
                                variant="primary"
                                size="base"
                                title={t('Close without saving')}
                                onPress={() => dismiss(true)}
                            />
                            <Button
                                variant="default"
                                size="base"
                                title={t('Keep editing')}
                                onPress={() => dismiss(false)}
                            />
                        </Row>
                    </View>
                </Pressable>
            </Pressable>
        </RemoveScroll>,
        document.body
    );
}
