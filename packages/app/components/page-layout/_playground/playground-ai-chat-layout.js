/**
 * Dev playground page-layout (`/pg/ai`).
 *
 * UNA-style AI chat (Agent). Web can stream `/sys-ai-chat/{AgentId}`;
 * the local AG-UI emulator remains the fallback (and the native path).
 */

import { ScrollView, View } from 'app/design/view';
import Page from 'app/ui/molecules/page/page';
import PlaygroundAiChat from './playground-ai-chat';

export default function PageLayoutPlaygroundAiChat({ data }) {
    return (
        <Page data={data || { uri: 'playground-ai-chat' }}>
            <ScrollView className="flex-1 bg-background">
                <View className="px-6 py-8 pb-12 w-full">
                    <PlaygroundAiChat />
                </View>
            </ScrollView>
        </Page>
    );
}
