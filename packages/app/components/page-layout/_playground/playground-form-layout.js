/**
 * Dev playground page-layout (`/pg/form`).
 *
 * UNA form-field kitchen sink (JSON → `Form`) + posted-payload dump.
 * Isolated from `/pg` so NeoButton gallery and the form don't share a tree.
 */

import { ScrollView, View } from 'app/design/view';
import Page from 'app/ui/molecules/page/page';
import PlaygroundForm from './playground-form';

export default function PageLayoutPlaygroundForm({ data }) {
    return (
        <Page data={data || { uri: 'playground-form' }}>
            <ScrollView className="flex-1 bg-background">
                <View className="px-6 py-8 pb-12 max-w-5xl mx-auto w-full">
                    <PlaygroundForm />
                </View>
            </ScrollView>
        </Page>
    );
}
