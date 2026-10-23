import { BlockWrapper } from 'app/components/block-wrapper'
import { BlockByDataInt as BlockByData } from 'app/components/block'
import { NeoButton, Modal } from 'app/design/controls'
import { fetcher } from 'app/lib/fetcher';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Html from 'app/ui/atoms/html'
import { Row, View } from 'app/design/view';
import { Text } from 'app/design/typography';
import Confirm from 'app/ui/molecules/dialogs/confirm';
import emitter, { EVENTS } from 'app/context/emitter';
import Link from 'app/ui/atoms/link';
import { looksLikeHtml } from 'app/lib/util';
import { isFormResponseComplete } from 'app/lib/form/form-helpers';
import { useFocusEffect } from 'app/lib/hooks/router';
import { useTranslation } from 'react-i18next';
import { useCurrentUser } from 'app/context/user';
import { subscribe } from 'app/ui/atoms/socket';

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

// Status pill colors, the same as the badge ones (full class names, so they are not purged).
const STATUS_COLORS = {
    green: { bg: 'bg-green-600/20', text: 'text-green-700 dark:text-green-300' },
    red: { bg: 'bg-red-600/20', text: 'text-red-700 dark:text-red-300' },
    amber: { bg: 'bg-amber-600/20', text: 'text-amber-700 dark:text-amber-300' },
    neutral: { bg: 'bg-muted/50', text: 'text-secondary-foreground' },
};

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

/** Data of the deployment block in an answer of the deployment service, null when there is none. */
function getDeployBlockData(response) {
    const blocks = Array.isArray(response?.data) ? response.data : [];
    return blocks.find((block) => block?.type === 'deploy')?.data ?? null;
}

function isDestructiveButton(item) {
    return /(tear|delete|destroy|remove|down|deploy)/i.test(item?.title || item?.name || '');
}

export default function ElementDeploy({ data, blockWrapperProps, url }) {
    const { t } = useTranslation();
    const [blockData, setBlockData] = useState(null);
    const [formBlock, setFormBlock] = useState(null);
    const [showConfirm, setShowConfirm] = useState(false);
    const dataUrlRef = useRef(data?.data_url);

    const refreshBlockData = useCallback(async () => {
        const dataUrl = dataUrlRef.current;
        if (!dataUrl) return;

        const sResponse = await fetcher(`/api.php?r=${dataUrl}`);
        // The answer may hold other blocks too (e.g. the project URL form): take the deployment one,
        // keep what is shown when there is none.
        const deployBlock = getDeployBlockData(sResponse);
        if (deployBlock) setBlockData(deployBlock);
    }, []);

    useEffect(() => {
        refreshBlockData();
    }, [refreshBlockData]);

    // A deployment started, changed or torn down elsewhere (e.g. by the projects agent in the chat):
    // the Projects module reports it on the author's socket channel, reload so the progress polling starts.
    const { currentUser } = useCurrentUser();
    useEffect(() => {
        if (!currentUser?.id) return undefined;
        return subscribe(`bx_projects_${currentUser.id}`, 'deployment', () => refreshBlockData());
    }, [currentUser?.id, refreshBlockData]);

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
            setFormBlock({ content: sResponse.data, designbox_id: 0, title: t('Deployment settings') });
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
            emitter.addListener(EVENTS.form(formName), (event) => {
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
            const deployBlock = getDeployBlockData(sResponse);
            if (deployBlock) setBlockData(deployBlock);
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

    return (
        <BlockWrapper {...blockWrapperProps}>
            {(!!statusBadge || buttons.length > 0) && (
                <View className="w-full  gap-3 w-full">
                    {(!!statusBadge && looksLikeHtml(statusBadge.text)) && (

                        <View className={`bg-${statusBadge.color}-600/20 px-4 py-2.5 text-center rounded-2xl w-full min-w-0 gap-2 overflow-hidden web:break-words web:whitespace-normal`}>
                            <Html data={statusBadge.text} />
                        </View>

                    )}
                    {(!!statusBadge && !looksLikeHtml(statusBadge.text)) && (

                        // Not the Badge: it keeps one line, and progress texts are long.
                        <View className={`self-start max-w-full min-w-0 rounded-2xl px-3 py-1.5 ${STATUS_COLORS[statusBadge.color]?.bg ?? STATUS_COLORS.neutral.bg}`}>
                            <Text className={`text-sm web:break-words ${STATUS_COLORS[statusBadge.color]?.text ?? STATUS_COLORS.neutral.text}`}>
                                {statusBadge.text}
                            </Text>
                        </View>

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
                                        controlSize={buttons.length > 1 ? "small" : "regular"}
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
                            {!!container?.title && (
                                <Text className="text-xs text-muted-foreground">
                                    {container.title}
                                </Text>
                            )}
                            {!!container?.url && (
                                <Link
                                    href={container.url}
                                    asExternal
                                    mode="text"
                                    className="text-sm font-medium text-primary web:hover:underline min-w-0 w-full web:break-all"
                                >
                                    {container.url}
                                </Link>
                            )}
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
                <Modal scrollable={true} title={formBlock.title || t('Deployment settings')} onVisible={!!formBlock} onClose={handleCloseDeployForm}>
                    <BlockByData block={formBlock} onFormEmpty={handleCloseDeployForm} />
                </Modal>
            )}
            <Confirm onVisible={showConfirm} title={t('Server will be removed with all data! Are you sure to proceed ?')} handleCancel={() => setShowConfirm(false)} handleOk={async () => { await fetcher(showConfirm); setShowConfirm(false); handleCloseDeployForm() }} />
        </BlockWrapper>
    );
}
