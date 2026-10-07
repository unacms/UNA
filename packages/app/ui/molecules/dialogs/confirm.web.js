import { Text } from 'app/design/typography'
import { View, Row } from 'app/design/view'
import { Modal, NeoButton } from 'app/design/controls';
import { useTranslation } from 'react-i18next';

export default function ElementConfirm({ handleOk, handleCancel, onVisible, title, titleOk, titleCancel, maxWidth='max-w-3xl', autoHeight=false }) {
    const { t } = useTranslation();
    const _handleCancel = async () => {
        handleCancel();
    }

    const _handleOk = async () => {
        handleOk();
    }

    if (onVisible) {
        return (
            <Modal
                id={'file-preview'}
                onVisible={onVisible}
                fullWidth={false}
                maxWidth={maxWidth}
                autoHeight={autoHeight}
                skipUnsavedGuard
                outerClickClose
                onClose={_handleCancel}
            >
                <View className='gap-y-4'>
                    <View className='text-center w-full'><Text className="text-center text-base text-muted-foreground  whitespace-pre-line">{title}</Text></View>
                    <Row className='gap-x-4 justify-center'>
                        <NeoButton style="borderedProminent" label={titleOk ?? t('OK')} onPress={() => _handleOk()} />
                        <NeoButton label={titleCancel ?? t('Cancel')} onPress={() => _handleCancel()} />
                    </Row>
                </View>
            </Modal>
        );
    }

    return <></>
}
