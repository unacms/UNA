import { BlockWrapper } from 'app/components/block-wrapper'
import { BlockByDataInt as BlockByData } from 'app/components/block';
import { Button, Modal } from 'app/design/controls'
import { fetcher } from 'app/lib/fetcher';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Row, View } from 'app/design/view';
import { Text } from 'app/design/typography';
import Confirm from 'app/ui/molecules/confirm';
import emitter from 'app/context/emitter';
import Link from 'app/ui/atoms/link';

function getFormNamesFromBlock(block) {
    const content = Array.isArray(block?.content) ? block.content : [];

    return content
        .filter((item) => item?.type === 'form')
        .map((item) => item?.data?.params?.display || item?.name)
        .filter((name) => name && !name.includes('_delete'));
}

function formHasInputErrors(formItem) {
    const inputs = formItem?.data?.inputs;
    if (!inputs || typeof inputs !== 'object') return false;

    return Object.values(inputs).some((input) => input?.error);
}

function shouldCloseAfterFormResponse(responseData) {
    if (!Array.isArray(responseData) || responseData.length === 0) return true;
    if (responseData.some((item) => item?.reload)) return true;

    const formItems = responseData.filter((item) => item?.type === 'form');
    if (!formItems.length) return true;

    return !formItems.some(formHasInputErrors);
}

export default function ElementDeploy({ data, blockWrapperProps, url }) {
    const [blockData, setBlockData] = useState(data);
    const [formBlock, setFormBlock] = useState(null);
    const [showConfirm, setShowConfirm] = useState(false);
    const dataUrlRef = useRef(data?.data_url);

    useEffect(() => {
        dataUrlRef.current = blockData?.data_url ?? data?.data_url ?? dataUrlRef.current;
    }, [blockData?.data_url, data?.data_url]);

    const handleOpenDeployForm = async (item) => {
        if (item.form_url) {
            const sResponse = await fetcher(`/api.php?r=${item.form_url}`);
            setFormBlock({ content: sResponse.data, designbox_id: 0, title: 'Deployment settings' });
        }

        if (item.request_url) {
            setShowConfirm(`/api.php?r=${item.request_url}`)
        }
    };

    const refreshBlockData = useCallback(async () => {
        const dataUrl = dataUrlRef.current;
        if (!dataUrl) return;

        const sResponse = await fetcher(`/api.php?r=${dataUrl}`);
        setBlockData(sResponse?.data[0]?.data);
    }, []);

    const handleCloseDeployForm = useCallback(() => {
        setFormBlock(null);
        refreshBlockData();
    }, [refreshBlockData]);

    useEffect(() => {
        if (!formBlock) return;

        const formNames = getFormNamesFromBlock(formBlock);
        if (!formNames.length) return;

        const subscriptions = formNames.map((formName) =>
            emitter.addListener(`form_${formName}`, (event) => {
                if (event.action !== 'received') return;
                if (!shouldCloseAfterFormResponse(event.data)) return;

                handleCloseDeployForm();
            })
        );

        return () => subscriptions.forEach((subscription) => subscription.remove());
    }, [formBlock, handleCloseDeployForm]);

    useEffect(() => {
        if (!blockData.text || blockData?.buttons.length > 0 || !blockData.data_url) return;

        const dataUrl = blockData.data_url;

        const poll = async () => {
            const sResponse = await fetcher(`/api.php?r=${dataUrl}`);
            setBlockData(sResponse?.data[0]?.data);
        };

        poll();
        const intervalId = setInterval(poll, 5000);

        return () => clearInterval(intervalId);
    }, [blockData.text, blockData.data_url]);

    return (
        <BlockWrapper {...blockWrapperProps}>
            <Row className="gap-x-2 items-center">
                {blockData.text && <Text className="text-sm text-destructive">{blockData.text}</Text>}
                {blockData?.buttons.map((item, index) => {
                    return <Button key={item.id || item.name || item.title || `deploy-button-${index}`} title={item.title} variant={index == 0 ? 'primary' : 'default'} onPress={() => handleOpenDeployForm(item)} />
                })}
            </Row>
            {!!blockData?.containers?.length && (
                <View className="mt-3 gap-2">
                    {blockData.containers.map((container, index) => (
                        <View key={`container-${index}`} className="gap-1 border border-border/60 rounded-lg p-2">
                            <Row>
                            {!!container?.title && <View className="w-1/4"><Text className="text-sm font-medium">{container.title}</Text></View>}
                            {!!container?.url && (
                                <Link href={container.url} asExternal mode="text" className="text-sm text-primary">
                                    {container.url}
                                </Link>
                            )}
                            </Row>
                            {!!container?.info && (
                                <Text className="text-xs text-muted-foreground">{container.info}</Text>
                            )}
                        </View>
                    ))}
                </View>
            )}
            {!!formBlock && (
                <Modal scrollable={true} title={formBlock.title || 'Deployment settings'} onVisible={!!formBlock} onClose={handleCloseDeployForm}>
                    <BlockByData block={formBlock} onFormEmpty={handleCloseDeployForm} />
                </Modal>
            )}
            <Confirm onVisible={showConfirm} title="Server will be removed with all data! Are you sure to proceed ?" handleCancel={() => setShowConfirm(false)} handleOk={async () => { await fetcher(showConfirm); setShowConfirm(false); handleCloseDeployForm() }} />
        </BlockWrapper>
    );
}
