import { useCallback, useEffect, useState } from 'react';
import { Linking } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from 'app/design/typography';
import { View, Row, Pressable } from 'app/design/view';
import { NeoButton } from 'app/design/controls';
import Image from 'app/ui/atoms/image';
import { Icon } from 'app/ui/atoms/icon';
import { fetcher } from 'app/lib/fetcher';
import { pickUnaDisplaySrc } from 'app/lib/image-helpers';

type ConvoFile = {
    id: number;
    name: string;
    url: string;
    image?: unknown;
};

type ConvoFilesProps = {
    lotId: string | number;
};

const openFile = (url: string) => {
    if (url) Linking.openURL(url).catch(() => {});
};

/** Files sent in a conversation (UNA `bx_messenger/get_convo_files`): image grid, then other files. */
export default function ConvoFiles({ lotId }: ConvoFilesProps) {
    const { t } = useTranslation();
    const [files, setFiles] = useState<ConvoFile[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // No state is set before the request: the first page loads from an effect.
    const load = useCallback(async (start: number) => {
        try {
            const params = JSON.stringify({ lot: lotId, start });
            const response = await fetcher('/api.php?r=bx_messenger/get_convo_files/Services&params=' + params);
            const data = response?.data;
            if (data?.code != 0 || !Array.isArray(data?.files)) {
                setError(data?.message || t('Error'));
                return;
            }
            setFiles((prev) => (start ? [...prev, ...data.files] : data.files));
            setTotal(data.params?.total ?? 0);
        } finally {
            setLoading(false);
        }
    }, [lotId, t]);

    useEffect(() => {
        load(0);
    }, [load]);

    if (error)
        return <Text className="text-muted-foreground text-base text-center py-4">{error}</Text>;

    if (!loading && !files.length)
        return <Text className="text-muted-foreground text-base text-center py-4">{t('No files')}</Text>;

    const images = files.filter((file) => pickUnaDisplaySrc(file.image));
    const others = files.filter((file) => !pickUnaDisplaySrc(file.image));

    return (
        <View className="w-full gap-y-4 pb-4">
            {images.length > 0 ? (
                <Row className="flex-wrap -mx-1">
                    {images.map((file) => (
                        <View key={file.id} className="w-1/3 sm:w-1/4 p-1">
                            <Pressable
                                className="w-full aspect-square rounded-xl overflow-hidden bg-muted"
                                accessibilityLabel={file.name}
                                onPress={() => openFile(file.url)}
                            >
                                <Image src={pickUnaDisplaySrc(file.image)} alt={file.name} view="cover" sizes="160px" />
                            </Pressable>
                        </View>
                    ))}
                </Row>
            ) : null}
            {others.length > 0 ? (
                <View className="gap-y-1">
                    {others.map((file) => (
                        <Pressable key={file.id} onPress={() => openFile(file.url)}>
                            <Row className="items-center gap-x-3 py-2">
                                <Icon icon="File" />
                                <Text className="flex-1 min-w-0 text-popover-foreground text-base" numberOfLines={1}>{file.name}</Text>
                            </Row>
                        </Pressable>
                    ))}
                </View>
            ) : null}
            {files.length < total || loading ? (
                <Row className="justify-center">
                    <NeoButton style="bordered" controlSize="regular" loading={loading} label={t('Load more')} onPress={() => {
                        setLoading(true);
                        load(files.length);
                    }} />
                </Row>
            ) : null}
        </View>
    );
}
