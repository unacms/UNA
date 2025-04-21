import { Text } from 'app/design/typography'
import { View, Row } from 'app/design/view'
import { Button, Modal } from 'app/design/controls';

export default function ElementConfirm({ handleOk, handleCancel, onVisible, title, titleOk = "Ok", titleCancel = "Cancel" }) {
    const _handleCancel = async () => {
        handleCancel();
    }

    const _handleOk = async () => {
        handleOk();
    }

    if (onVisible) {
        return (
            <Modal id={'file-preview'} onVisible={onVisible} fullWidth={false}>
                <View className='gap-y-4'>
                    <View className='text-center w-full'><Text className="text-center text-base text-neutral-600 dark:text-neutral-400">{title}</Text></View>
                    <Row className='gap-x-4 justify-center'>
                        <Button variant="primary" size="sm" rounded title={titleOk} onPress={() => _handleOk()} />
                        <Button variant="default" size="sm" rounded title={titleCancel} onPress={() => _handleCancel()} />
                    </Row>
                </View>
            </Modal>
        );
    }

    return <></>
}
