import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import Confirm from 'app/ui/molecules/confirm';
import emitter from 'app/context/emitter';
import { UNSAVED_FORM_CONFIRM_REQUEST } from 'app/lib/form-helpers';

export function UnsavedFormConfirmHost() {
    const { t } = useTranslation();
    const [visible, setVisible] = useState(false);
    const [message, setMessage] = useState('');
    const settleRef = useRef(null);

    useEffect(() => {
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

    if (Platform.OS !== 'web') return null;

    return (
        <Confirm
            onVisible={visible}
            title={message || t('You have unsaved changes. Close without saving?')}
            titleOk={t('Close without saving')}
            titleCancel={t('Keep editing')}
            maxWidth="max-w-md"
            autoHeight
            handleOk={() => dismiss(true)}
            handleCancel={() => dismiss(false)}
        />
    );
}
