import { Text } from 'app/design/typography'
import { View, Row } from 'app/design/view'
import { Button, Modal } from 'app/design/controls';

export default function ElementConfirm({ handleOk, handleCancel, onVisible, title, titleOk = "OK", titleCancel = "Cancel", maxWidth='max-w-3xl', autoHeight=false }) {
    const _handleCancel = async () => {
        handleCancel();
    }

    const _handleOk = async () => {
        handleOk();
    }

    if (onVisible) {
        return (
            <Modal id={'file-preview'} onVisible={onVisible} fullWidth={false} maxWidth={maxWidth} autoHeight={autoHeight}>
                <View className='gap-y-4'>
                    <View className='text-center w-full'><Text className="text-center text-base text-neutral-600 dark:text-neutral-400 whitespace-pre-line">{title}</Text></View>
                    <Row className='gap-x-4 justify-center'>
                        <Button variant="primary" size="base" title={titleOk} onPress={() => _handleOk()} />
                        <Button variant="default" size="base" title={titleCancel} onPress={() => _handleCancel()} />
                    </Row>
                </View>
            </Modal>
        );
    }

    return <></>
}
