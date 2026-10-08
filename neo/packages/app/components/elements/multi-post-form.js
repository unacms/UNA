import { Row, View, Pressable } from 'app/design/view'
import { Text } from 'app/design/typography'
import { NeoButton } from 'app/design/controls'
import { useState, useEffect, useMemo } from 'react'
import { useWindowDimensions } from 'react-native'
import { menuItemsByNameNew, cloneObject, getBreakpoint, isWeb } from 'app/lib/util'
import { useCurrentUser } from 'app/context/user'
import Profile from 'app/ui/molecules/profile/profile'
import { CardList } from 'app/ui/molecules/page/card'
import { useTranslation } from 'react-i18next'
import FormModal, { handleFormModal, getFormModal } from 'app/ui/molecules/dialogs/form-modal';
import { BlockWrapper } from 'app/components/block-wrapper'
import { useBreakpointName } from 'app/context/measure'
import { pickLibraryMedia } from 'app/lib/media/pick-media'
import { queueFieldAssets } from 'app/lib/form/pending-field-assets'

// The first form's media field, as its own "Add Photos or Videos" button in the
// composer toolbar would open it (forms/feed.js getAttachmentMenuItems).
function getMediaField(formPage) {
    const findInputs = (node) => {
        if (!node || typeof node !== 'object') return null;
        if (node.inputs && typeof node.inputs === 'object') return node.inputs;
        for (const key of Object.keys(node)) {
            const inputs = findInputs(node[key]);
            if (inputs) return inputs;
        }
        return null;
    };
    const inputs = findInputs(formPage?.elements);
    if (inputs?.video?.type === 'files')
        return { name: 'video', mediaTypes: ['images', 'videos'], icon: 'ImagePlay', title: 'Add Photos or Videos' };
    if (inputs?.photo?.type === 'files')
        return { name: 'photo', mediaTypes: ['images'], icon: 'Image', title: 'Add Photos' };
    return null;
}

// The "Create new …" trigger is not a form input (nothing is typed here), so it
// is a plain Pressable rather than a NeoButton or a TextInput look-alike: text
// only on phones, fading while pressed; a capsule on tablet and desktop.
const TRIGGER_CLASS = 'flex-1 min-w-0 h-11 justify-center rounded-full active:opacity-50 '
    + 'sm:px-4 sm:bg-button sm:hover:bg-button-hover web:transition-[background-color,opacity] web:duration-150';
const TRIGGER_TEXT_CLASS = 'text-base font-medium tracking-tight text-muted-foreground';

export default function MultiPostForm({ data, blockWrapperProps }) {
    const { currentUser } = useCurrentUser();
    const { t } = useTranslation()
    const { width: windowWidth } = useWindowDimensions();
    // Other content types: tablet and desktop only. Web hides them with
    // classes (SSR-safe); native does not render them on phones, since a
    // `display: none` subtree of native (Expo UI) buttons trips Fabric's
    // layout ownership assert in debug builds (facebook/react-native#52349).
    const showOtherTypes = isWeb || !!getBreakpoint(windowWidth);
    // Phones get a borderless media button (hydration-safe: bordered until hydrated on web).
    const mediaButtonStyle = useBreakpointName() === '' ? 'borderless' : 'bordered';
    const [pageData, setPageData] = useState(false);
    const [pageDataDef, setPageDataDef] = useState(false);
    const menu_add_items = menuItemsByNameNew('', data.menu, currentUser).filter(item => item.name != 'more-auto');

    const firstForm = menu_add_items.shift();

    const profileData = useMemo(() => ({
        ...currentUser,
        url_avatar: currentUser.avatar,
        url: null,
    }));

    useEffect(() => {
        const fetchData = async () => {
            const sResponse = await getFormModal(firstForm, data.params);
            setPageDataDef(sResponse.data);
        };
        fetchData();
    }, []);

    // Show tooltip after configured delay on first feed visit
    // Keep showing until user opens the post form


    const mediaField = useMemo(() => getMediaField(pageDataDef), [pageDataDef]);

    const getFirstForm = async () => {
        if (pageDataDef) {
            setPageData({ ...cloneObject(pageDataDef), ts: Date.now() });
        }
        else {
            const a = await getFormModal(firstForm, data.params);
            setPageData({ ...a.data, ts: Date.now() });
        }
    }

    if (menu_add_items.length == 0 && !firstForm)
        return;



    const triggerLabel = t('Create new ') + firstForm.title.toLowerCase();

    const handleTriggerPress = () => {
        // User clicked to create post - permanently dismiss tooltip

        getFirstForm();
    };

    // Fast track to "Add Photos or Videos": pick first (on web the file dialog
    // needs the click's user gesture), then open the form with the files queued
    // for its media field, which uploads them on mount.
    const handleMediaPress = async () => {
        if (!mediaField) return;
        const assets = await pickLibraryMedia(mediaField.mediaTypes);
        if (!assets.length) return;
        queueFieldAssets(mediaField.name, assets);
        getFirstForm();
    };

    return (
        <BlockWrapper {...blockWrapperProps}>
            <CardList className="flex-row items-center gap-3 min-w-0">
                <View className="flex-none">
                    <Profile {...profileData} displaySize="base" displayType="unit_wo_info" />
                </View>
                <Pressable
                    className={TRIGGER_CLASS}
                    accessibilityRole="button"
                    accessibilityLabel={triggerLabel}
                    onPress={handleTriggerPress}
                >
                    <Text className={TRIGGER_TEXT_CLASS} numberOfLines={1}>{triggerLabel}</Text>
                </Pressable>
                {mediaField && (
                    <NeoButton
                        style={mediaButtonStyle}
                        borderShape="circle"
                        controlSize="regular"
                        image={mediaField.icon}
                        tooltip={t(mediaField.title)}
                        accessibilityLabel={t(mediaField.title)}
                        onPress={handleMediaPress}
                    />
                )}

                <FormModal key={pageData?.ts} pageData={pageData} setPageData={setPageData} />
                {menu_add_items.length > 0 && showOtherTypes && <Row className="hidden sm:flex gap-3 flex-none">
                    {menu_add_items.map((item, index) => (
                        <NeoButton key={item.name} style="bordered" borderShape="circle" controlSize="regular" onPress={() => handleFormModal(item, null, setPageData, data.params)} image={item.icon} />
                    ))}
                </Row>}

            </CardList>
        </BlockWrapper>

    )
}
