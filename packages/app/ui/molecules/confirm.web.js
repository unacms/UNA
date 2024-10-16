import { Text} from 'app/design/typography'
import { View, Row } from 'app/design/view'
import { Button, Modal } from 'app/design/controls';

export default function ElementConfirm(props) {
    const handleCancel = async () => {
        props.handleCancel();
    }

    const handleOk = async () => {
        props.handleOk();
    }

    if (props.onVisible){
    return (
        <>
            <Modal
          
             onVisible={props.onVisible} 
             fullWidth={false}
             
             title={"aaaa"}

             outerClickClose = {false}
            
             transparent={true}
             headerBorder={true}
             >
                <View className='gap-y-4'>
                    <View className='text-center w-full'><Text className="text-center text-base text-neutral-600 dark:text-neutral-400">{props.title}</Text></View>
                    <Row className='gap-x-4 justify-center'>
                        <Button variant="primary" size="sm" rounded  title="OK"  onPress={() => handleOk()} />
                        <Button variant="default" size="sm" rounded  title="Cancel"  onPress={() => handleCancel()} />
                    </Row>
                </View>
            </Modal>
           
        </>
    );
    }

    return <></>
}
