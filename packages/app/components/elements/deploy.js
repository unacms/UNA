import { BlockWrapper } from 'app/components/block-wrapper'
import { BlockByDataInt as BlockByData } from 'app/components/block'
import { NeoButton, Modal } from 'app/design/controls'
import { fetcher } from 'app/lib/fetcher';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Html from 'app/ui/atoms/html'
import { Row, View } from 'app/design/view';
import { Text } from 'app/design/typography';
import Confirm from 'app/ui/molecules/confirm';
import Badge from 'app/ui/molecules/badge';
import emitter from 'app/context/emitter';
import Link from 'app/ui/atoms/link';
import { isFormResponseComplete } from 'app/lib/form-helpers';
import { useFocusEffect } from 'app/lib/hooks/router';

function getFormNamesFromBlock(block) {
    const content = Array.isArray(block?.content) ? block.content : [];

    return content
        .filter((item) => item?.type === 'form')
        .map((item) => item?.data?.params?.display || item?.name)
        .filter((name) => name && !name.includes('_delete'));
}

function shouldCloseAfterFormResponse(responseData) {
    return isFormResponseComplete(responseData);
}

function getHostname(url) {
    if (!url || typeof url !== 'string') return '';
    try {
        return new URL(url).hostname.replace(/^www\./, '');
    } catch {
        return '';
    }
}

function getMainDomain(containers) {
    if (!Array.isArray(containers) || !containers.length) return '';

    const neo = containers.find((container) => /neo/i.test(container?.title || ''));
    const neoHost = getHostname(neo?.url);
    if (neoHost) return neoHost;

    const hosts = containers
        .map((container) => getHostname(container?.url))
        .filter(Boolean)
        .sort((a, b) => a.length - b.length);

    return hosts[0] || '';
}

function getStatusBadgeData(text) {
    if (!text || typeof text !== 'string') return null;

    const normalized = text.trim().toLowerCase();
    let color = 'neutral';

    if (/(run|active|ready|online|live|ok|success|healthy)/.test(normalized)) {
        color = 'green';
    } else if (/(fail|error|down|stop|destroy|crash|unhealthy)/.test(normalized)) {
        color = 'red';
    } else if (/(deploy|start|pend|wait|progress|build|creat|provision|queue)/.test(normalized)) {
        color = 'amber';
    }

    return { text: text.trim(), color };
}

function isDestructiveButton(item) {
    return /(tear|delete|destroy|remove|down|deploy)/i.test(item?.title || item?.name || '');
}

export default function ElementDeploy({ data, blockWrapperProps, url }) {
    const [blockData, setBlockData] = useState(null);
    const [formBlock, setFormBlock] = useState(null);
    const [showConfirm, setShowConfirm] = useState(false);
    const dataUrlRef = useRef(data?.data_url);

    const refreshBlockData = useCallback(async () => {
        const dataUrl = dataUrlRef.current;
        if (!dataUrl) return;

        const sResponse = await fetcher(`/api.php?r=${dataUrl}`);
        setBlockData(sResponse?.data[0]?.data);
    }, []);

    useEffect(() => {
        refreshBlockData();
    }, [refreshBlockData]);

    useFocusEffect(
        useCallback(() => {
            refreshBlockData();
        }, [refreshBlockData])
    );

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
        if (!blockData?.text || blockData?.buttons.length > 0 || !blockData.data_url) return;

        const dataUrl = blockData.data_url;

        const poll = async () => {
            const sResponse = await fetcher(`/api.php?r=${dataUrl}`);
            setBlockData(sResponse?.data[0]?.data);
        };

        poll();
        const intervalId = setInterval(poll, 5000);

        return () => clearInterval(intervalId);
    }, [blockData?.text, blockData?.data_url]);

    const mainDomain = useMemo(
        () => getMainDomain(blockData?.containers),
        [blockData?.containers]
    );

    const statusBadge = useMemo(
        () => getStatusBadgeData(blockData?.text),
        [blockData?.text]
    );

    const buttons = Array.isArray(blockData?.buttons) ? blockData.buttons : [];
    const containers = Array.isArray(blockData?.containers) ? blockData.containers : [];

    const looksLikeHtml = (s) => /<[a-z][\s\S]*>/i.test(String(s ?? ''))

    return (
        <BlockWrapper {...blockWrapperProps}>
            {(!!statusBadge || buttons.length > 0) && (
                <View className="w-full  gap-3 w-full">
                    {(!!statusBadge && looksLikeHtml(statusBadge.text)) && (

                        <View className={`bg-${statusBadge.color}-600/20 p-3 text-center rounded-full w-full gap-2`}>
                            <Html data={statusBadge.text} />
                        </View>

                    )}
                    {(!!statusBadge && !looksLikeHtml(statusBadge.text)) && (

                        <Row className="gap-2 items-center">
                            <Text>Status:</Text><Badge
                                size="sm"
                                rounded
                                data={statusBadge}
                            /></Row>

                    )}

                    {buttons.length > 0 && (
                        <Row className="items-center gap-2 flex-wrap justify-start">
                            {buttons.map((item, index) => {
                                const destructive = isDestructiveButton(item);
                                const buttonStyle = destructive || item?.primary ? 'borderedProminent' : 'bordered';
                                const buttonLabel = String(item?.title || item?.name || '').trim();
                                if (!buttonLabel) return null;
                                return (
                                    <NeoButton
                                        key={item.id || item.name || buttonLabel || `deploy-button-${index}`}
                                        buttonStyle={destructive ? 'borderedProminent' : 'bordered'}
                                        controlSize={buttons.length > 1 ? "small" : "xlarge"}
                                        role={destructive ? 'destructive' : undefined}
                                        accessibilityLabel={buttonLabel}
                                        onPress={() => handleOpenDeployForm(item)}
                                    >
                                        <Text
                                            className={
                                                destructive
                                                    ? 'text-sm font-medium text-destructive-foreground'
                                                    : 'text-sm font-medium text-secondary-foreground'
                                            }
                                        >
                                            {buttonLabel}
                                        </Text>
                                    </NeoButton>
                                );
                            })}
                        </Row>
                    )}
                </View>
            )}
            {containers.length > 0 && (
                <View className="mt-1 gap-2">
                    {containers.map((container, index) => (
                        <View
                            key={`container-${index}`}
                            className="gap-1 rounded-xl border border-border/50 bg-muted/30 px-3 py-2.5"
                        >
                            <Row className="items-start justify-between gap-3 flex-wrap">
                                {!!container?.title && (
                                    <Text className="text-sm text-muted-foreground shrink-0 pt-0.5">
                                        {container.title}
                                    </Text>
                                )}
                                {!!container?.url && (
                                    <Link
                                        href={container.url}
                                        asExternal
                                        mode="text"
                                        className="text-sm font-medium text-primary web:hover:underline min-w-0 flex-1 text-right"
                                    >
                                        {container.url}
                                    </Link>
                                )}
                            </Row>
                            {!!container?.info && (
                                <Text className="text-xs text-muted-foreground leading-5">
                                    {container.info}
                                </Text>
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
