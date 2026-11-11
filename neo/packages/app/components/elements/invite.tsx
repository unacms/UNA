import { useState } from 'react';
import { useTranslation } from 'react-i18next'
import { Text } from 'app/design/typography'
import { View, Row } from 'app/design/view'
import { NeoButton, Input, Modal } from 'app/design/controls';
import { fetcher } from 'app/lib/fetcher';
import { setClipboard } from 'app/lib/util'
import { APP_URL } from 'app/config';
import { BlockWrapper } from 'app/components/block-wrapper'
import Form from 'app/components/form';

// The invite block of bx_invites, as on the UNA site: invite by email, get an invitation link and,
// for admins and context admins, an invitation code. Each opens a modal instead of its own page.
// UNA sends `request_url` (link), `form_url` (email form) and `code_url` (code, when allowed), with
// the context (`aja` / `ajp`) already in them. An older UNA sends only `request_url` and the page
// `invite_url`; the context is then taken from `invite_url`.

/** The `invite` block's data (BxInvTemplate::getBlockInvite). */
interface InviteData {
    /** Invites left, or the translated "unlimited". */
    remain?: number | string;
    request_url?: string;
    form_url?: string;
    code_url?: string;
    invite_url?: string;
}

interface ElementInviteProps {
    data: InviteData;
    blockWrapperProps?: any;
}

type InviteView = 'link' | 'code' | 'email';

type InviteModal =
    | { view: InviteView; message: string }
    | { view: 'email'; form: Record<string, any> }
    | { view: 'link' | 'code'; link: string; code?: string };

function contextQuery(inviteUrl?: string): string {
    const query = String(inviteUrl || '').split('?')[1] || '';
    const params = new URLSearchParams(query);
    const out = new URLSearchParams();
    ['aja', 'ajp'].forEach((key) => {
        const value = params.get(key);
        if (value)
            out.set(key, value);
    });
    return out.toString();
}

function withContext(url: string | undefined, context: string): string | undefined {
    if (!url || !context || /[?&]aja=/.test(url))
        return url;
    return url + '&' + context;
}

function responseMessage(data: unknown): string {
    const items: any[] = Array.isArray(data) ? data : [data];
    const msg = items.find((item) => item?.type === 'msg');
    return typeof msg?.data === 'string' ? msg.data : '';
}

function CopyRow({ value, label }: { value: string; label: string }) {
    const [copied, setCopied] = useState(false);
    const handleCopy = async () => {
        try {
            await setClipboard(value);
        } catch {
            // The value stays selectable in the field: copying by hand still works.
            return;
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    }

    return (
        <Row className='items-center gap-x-2'>
            <Input value={value} readOnly className="flex-1 min-w-0" />
            <NeoButton style="bordered" image={copied ? 'Check' : 'Copy'} accessibilityLabel={label} onPress={handleCopy} />
        </Row>
    );
}

function ModalContent({ modal }: { modal: InviteModal | null }) {
    const { t } = useTranslation();
    if (!modal)
        return null;
    if ('message' in modal)
        return <Text className="text-foreground text-center">{modal.message}</Text>;
    if ('form' in modal)
        return <Form {...modal.form} />;
    if (modal.view === 'code')
        return (
            <View className='gap-y-3'>
                <Text className="text-muted-foreground text-sm">{t('Your invitation code')}</Text>
                <CopyRow value={modal.code || ''} label={t('Copy')} />
                <Text className="text-muted-foreground text-sm">{t('Or share it as a link')}</Text>
                <CopyRow value={APP_URL + modal.link} label={t('Copy link')} />
            </View>
        );
    return <CopyRow value={APP_URL + modal.link} label={t('Copy link')} />;
}

export default function ElementInvite({ data, blockWrapperProps }: ElementInviteProps) {
    const { t } = useTranslation();
    const [modal, setModal] = useState<InviteModal | null>(null);
    const [loading, setLoading] = useState<InviteView | ''>('');

    const context = contextQuery(data.invite_url);
    const linkUrl = withContext(data.request_url, context);
    const codeUrl = withContext(data.code_url, context);
    const formUrl = withContext(data.form_url || 'bx_invites/get_block_form_invite/', context);
    const failed = t('Something didn’t go as planned. Please try again or reload the page.');

    const open = async (view: InviteView, url?: string) => {
        if (loading || !url)
            return;
        setLoading(view);
        try {
            const response = await fetcher('/api.php?r=' + url);
            const result = response?.data;
            const form = Array.isArray(result) ? result.find((item) => item?.type === 'form') : null;
            if (view === 'email' && form)
                setModal({ view, form });
            else if (view !== 'email' && result?.link)
                setModal({ view, link: result.link, code: result.code });
            else
                setModal({ view, message: responseMessage(result) || failed });
        }
        catch {
            setModal({ view, message: failed });
        }
        finally {
            setLoading('');
        }
    }

    const titles: Record<InviteView, string> = {
        link: t('Invitation link'),
        code: t('Invitation code'),
        email: t('Invite by email'),
    };

    const text = t('You can invite your friends to join. You have {{count}} invites to share.', { count: data.remain as number });
    const remain = String(data.remain ?? '');
    const remainAt = remain ? text.indexOf(remain) : -1;

    return (
        <BlockWrapper {...blockWrapperProps}>
            <Modal
                title={modal ? titles[modal.view] : ''}
                onVisible={!!modal}
                onClose={() => setModal(null)}
                scrollable={modal?.view === 'email'}
            >
                <ModalContent modal={modal} />
            </Modal>
            <View className="p-4">
                <Text className="text-card-foreground text-center">
                    {remainAt < 0 ? text : (
                        <>
                            {text.slice(0, remainAt)}
                            <Text className="text-card-foreground font-semibold">{remain}</Text>
                            {text.slice(remainAt + remain.length)}
                        </>
                    )}
                </Text>
                <Row className='flex-wrap justify-center gap-2 pt-4'>
                    <NeoButton borderShape="capsule" label={t('Invite by email')} loading={loading === 'email'} onPress={() => open('email', formUrl)} />
                    {/* The code modal shows the link too, so the link button is only for those without a code. */}
                    {!!linkUrl && !codeUrl && <NeoButton borderShape="capsule" label={t('Get invitation link')} loading={loading === 'link'} onPress={() => open('link', linkUrl)} />}
                    {!!codeUrl && <NeoButton borderShape="capsule" label={t('Invite by code')} loading={loading === 'code'} onPress={() => open('code', codeUrl)} />}
                </Row>
            </View>
        </BlockWrapper>
    );
}
