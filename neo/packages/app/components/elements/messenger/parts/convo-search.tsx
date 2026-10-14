import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text } from 'app/design/typography';
import { View, Row, ScrollView } from 'app/design/view';
import { NeoButton } from 'app/design/controls';
import MessageItem from 'app/components/elements/chat/parts/message-item';
import { ContentMore } from 'app/ui/molecules/content/content-more';
import { fetcher } from 'app/lib/fetcher';

type FoundJot = {
    id: number;
    message: string;
    added: number;
    author_data?: { display_name?: string; [key: string]: unknown };
};

type ConvoSearchResultsProps = {
    lotId: string | number;
    /** Debounced text from the search field in the chat header. */
    term: string;
    headerInset?: number;
    footerInset?: number;
};

/**
 * Messages of one conversation found by text (UNA
 * `bx_messenger/search_convo_messages`). Shown in place of the message list
 * while the header search is open.
 */
export default function ConvoSearchResults({ lotId, term, headerInset = 0, footerInset = 0 }: ConvoSearchResultsProps) {
    const { t } = useTranslation();
    const [jots, setJots] = useState<FoundJot[]>([]);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    // The query the shown results belong to.
    const [resultsFor, setResultsFor] = useState('');
    const requestId = useRef(0);
    const query = term.trim();
    // Results and paging belong to one query: while the next one loads, the old page isn't shown or extended.
    const current = resultsFor === query;

    // No state is set before the request: the first page loads from an effect.
    const load = useCallback(async (start: number) => {
        const id = ++requestId.current;
        try {
            const params = encodeURIComponent(JSON.stringify({ lot: lotId, term: query, start }));
            const response = await fetcher('/api.php?r=bx_messenger/search_convo_messages/Services&params=' + params);
            if (id !== requestId.current) return;

            const data = response?.data;
            if (data?.code != 0 || !Array.isArray(data?.jots)) {
                setError(data?.message || t('Error'));
                return;
            }
            setError('');
            setResultsFor(query);
            setJots((prev) => (start ? [...prev, ...data.jots] : data.jots));
            setHasMore(data.jots.length >= (data.params?.per_page ?? 20));
        } finally {
            if (id === requestId.current) setLoading(false);
        }
    }, [lotId, query, t]);

    useEffect(() => {
        if (query) load(0);
    }, [query, load]);

    let content = null;
    if (!query)
        content = <Text className="text-muted-foreground text-base text-center">{t('Search messages in this chat')}</Text>;
    else if (error)
        content = <Text className="text-muted-foreground text-base text-center">{error}</Text>;
    else if (current && !jots.length && !hasMore)
        content = <Text className="text-muted-foreground text-base text-center">{t('Nothing found')}</Text>;

    return (
        <ScrollView
            className="h-full w-full"
            contentContainerClassName="w-full"
            contentContainerStyle={{ paddingTop: headerInset + 16, paddingBottom: footerInset + 16 }}
        >
            {content ? <View className="px-4">{content}</View> : null}
            {/* Same look as the conversation: MessageItem with the body as in ItemJot. */}
            {query && current ? jots.map((jot) => (
                <MessageItem key={jot.id} author={jot.author_data || {}} time={jot.added}>
                    <View className="pb-2">
                        <ContentMore
                            content={jot.message}
                            embed={undefined}
                            numberOfLines={3}
                            numberOfSymbols={360}
                            openSmall={false}
                            showLess={true}
                            customClassName="u-vanilla-html-small"
                        />
                    </View>
                </MessageItem>
            )) : null}
            {query && current && hasMore ? (
                <Row className="justify-center pt-3">
                    <NeoButton
                        style="bordered"
                        controlSize="regular"
                        loading={loading}
                        label={t('Load more')}
                        onPress={() => {
                            setLoading(true);
                            load(jots.length);
                        }}
                    />
                </Row>
            ) : null}
        </ScrollView>
    );
}
