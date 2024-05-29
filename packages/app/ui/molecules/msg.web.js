import { Text} from 'app/design/typography'
import { View, Row } from 'app/design/view'
import { Button, Input, InputRounded, Modal } from 'app/design/controls';

import { useState } from 'react';


export default function ElementMsg(props) {

    const handleOk = async () => {
        props.handleOk();
    }

    return (
        <>
            <Modal id={'file-preview'} onVisible={props.onVisible} >
                <View className='gap-y-4'>
                    <View className='text-center w-full'><Text className="text-center text-base text-neutral-600 dark:text-neutral-400">{props.title}</Text></View>
                    <Row className='gap-x-4 justify-center'>
                        <Button variant="primary" size="sm" rounded  title="OK"  onPress={() => handleOk()} />
                    </Row>
                </View>
            </Modal>
           
        </>
    );
}
