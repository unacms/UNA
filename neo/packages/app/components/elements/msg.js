import { View } from 'app/design/view'
import { BlockWrapper } from 'app/components/block-wrapper'
import Html from 'app/ui/atoms/html';
import EmptyState from 'app/ui/molecules/misc/empty-state';

export default function ElementMsg({ data, msg_type, empty_state, blockWrapperProps }) {
    // A denied action says why and what to do (UNA's BxDolAcl::getDenialState): "Create profile", "Log in"...
    if (empty_state)
        return (
            <BlockWrapper {...blockWrapperProps}>
                <EmptyState state={empty_state} fallbackTitle={data} fill={false} />
            </BlockWrapper>
        );

    if (!data.length)
        return null;

    let clsname = "bg-accent p-3 rounded-xl";
    let clsname1 = "text-accent-foreground text-center";
    if (msg_type == 'caption') {
        clsname = " ";
        clsname1 = "text-card-foreground";
    }

    if (msg_type == 'result') {
        clsname = "";
        clsname1 = "text-card-foreground text-center";
    }

    if (msg_type == 'info') {
        clsname = "px-4 py-2 sm:px-6 sm:py-4 mb-4 rounded-none lg:rounded-2xl sm:border border-border/60 backgrop-blur web:duration-200 overflow-hidden rounded-2xl  bg-card mx-4";
        clsname1 = "text-card-foreground text-center";
    }

    return (
        <BlockWrapper {...blockWrapperProps}>
            <View className={clsname}>
                <Html className={clsname1} data={data}/>
            </View>
        </BlockWrapper>
    );
}
