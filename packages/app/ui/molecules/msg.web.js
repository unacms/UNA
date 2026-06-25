import { Text } from 'app/design/typography'
import { View, Row } from 'app/design/view'
import { Button, Modal } from 'app/design/controls';
import { Icon } from 'app/ui/atoms/icon';

import { useState } from 'react';


export default function ElementMsg(props) {

    const handleOk = async () => {
        props.handleOk();
    }

    return (
        <Modal id={'file-preview'} onVisible={props.onVisible} >
            <View className='gap-4'>

                <Row className='gap-4 min-h-24 justify-center items-center w-full bg-muted/50 rounded-lg p-4 text-card-foreground'>
                    <Icon icon="Info" size={24} />
                    <Text className=" text-base text-card-foreground">{props.title}</Text>
                </Row>
                <Row className='justify-center items-center min-w-[100px] mx-auto'><Button variant="primary" fullWidth size="base" title="OK" onPress={() => handleOk()} /></Row>
            </View>
        </Modal>

    );
}
