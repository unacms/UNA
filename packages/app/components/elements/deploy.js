import { BlockWrapper } from 'app/components/block-wrapper'
import { Button, Modal } from 'app/design/controls'
import { fetcher } from 'app/lib/fetcher';
import Form from 'app/components/elements/form';
import { useState, useEffect } from 'react';
import { Row } from 'app/design/view';
import { Text } from 'app/design/typography';
import Confirm from 'app/ui/molecules/confirm';
import emitter from 'app/context/emitter';

export default function ElementDeploy({ data, blockWrapperProps, url }) {
    const [blockData, setBlockData] = useState(data);
    const [pageData, setPageData] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const handleOpenDeployForm = async (item) => {

        if (item.form_url) {
            const sResponse = await fetcher(`/api.php?r=${item.form_url}`);
            setPageData(sResponse.data);
        }

        if (item.request_url) {
            setShowConfirm(`/api.php?r=${item.request_url}`)
        }

    };

    useEffect(() => {
        const subscription = emitter.addListener(`form_bx_projects`, (data) => {
            console.log("data", data);
            
            if (data.action == 'received' && data.data.reload) {
                handleCloseDeployForm();
            }
        })

        return () => {
            subscription.remove()
        }
    }, [])

    const handleCloseDeployForm = async () => {

        const sResponse = await fetcher(`/api.php?r=${blockData.data_url}`);

        setBlockData(sResponse?.data[0]?.data);
        setPageData(false);
    };


    return (
        <BlockWrapper {...blockWrapperProps}>
            <Row className="gap-x-2 items-center">
                {blockData.text && <Text className="text-sm text-destructive">{blockData.text}</Text>}
                {blockData?.buttons.map((item, index) => {
                    return <Button title={item.title} variant={index == 0 ? 'primary' : 'default'} onPress={() => handleOpenDeployForm(item)} />
                })}
            </Row>
            {!!pageData && <Modal scrollable={true} title={"Deployment settings"} onVisible={!!pageData} onClose={handleCloseDeployForm}>
                <Form {...pageData[0]}></Form>
            </Modal>}
            <Confirm onVisible={showConfirm} title="Server will be removed with all data! Are you sure to proceed ?" handleCancel={() => setShowConfirm(false)} handleOk={async () => { await fetcher(showConfirm); setShowConfirm(false);handleCloseDeployForm() }} />
        </BlockWrapper>
    );
}
