import { View, Row, Pressable } from 'app/design/view'
import { NeoButton } from 'app/design/controls'
import { useState, useRef, useMemo, useEffect } from 'react'
import { getFormFieldByData } from 'app/lib/form/form-helpers'
import KbAvoidingView, { useStickyComposerListInset } from 'app/ui/atoms/kb-avoiding-view'
import { Platform, View as RNView } from 'react-native'
import { useStableSafeAreaInsets } from 'app/lib/hooks/router'
import { useCurrentUser } from 'app/context/user'
import Profile from 'app/ui/molecules/profile/profile'
import { appSetting, stripTags } from 'app/lib/util'
import { Keyboard } from 'react-native'
import { useFormContext } from 'react-hook-form'
import { PollButton, LabelButton, FileButton } from 'app/lib/form/form-helpers'
import { useIsDesktop, useWindowHeight } from 'app/context/measure';
import emitter, { EVENTS } from 'app/context/emitter';
import { Icon } from 'app/ui/atoms/icon'
import { Text } from 'app/design/typography';
import { useSound } from 'app/lib/hooks/use-sound';
import { useTranslation } from 'react-i18next';

const dropdownTheme = appSetting('theme', 'dropdown');
const menuSettings = appSetting('theme', 'dropdown_menu');
const isWeb = Platform.OS === 'web';
const nativeTruncateProps = isWeb
    ? {}
    : { numberOfLines: 1, ellipsizeMode: 'tail', textBreakStrategy: 'simple' };

const ATTACHMENT_BUTTON = { style: 'bordered', controlSize: 'small', borderShape: 'capsule', tooltipSide: 'top' };

function getAttachmentMenuItems(inputs) {
    const items = [];
    if (inputs?.photo) {
        items.push({
            id: 'photo',
            title: 'Add Photos',
            icon: 'Image',
            onAction: () => emitter.emit(EVENTS.fieldFiles('photo'), { action: 'add', source: 'library', mediaTypes: ['images'] }),
        });
    }
    if (inputs?.video) {
        items.push({
            id: 'video',
            title: 'Add Photos or Videos',
            icon: 'ImagePlay',
            onAction: () => emitter.emit(EVENTS.fieldFiles('video'), { action: 'add', source: 'library', mediaTypes: ['images', 'videos'] }),
        });
    }
    if (inputs?.file) {
        items.push({
            id: 'file',
            title: 'Add Files',
            icon: 'Paperclip',
            onAction: () => emitter.emit(EVENTS.fieldFiles('file'), { action: 'add' }),
        });
    }
    if (inputs?.labels) {
        items.push({
            id: 'labels',
            title: 'Add Labels',
            icon: 'Hash',
            onAction: () => emitter.emit(EVENTS.fieldLabels('labels'), { action: 'add' }),
        });
    }
    if (inputs?.polls) {
        items.push({
            id: 'polls',
            title: 'Add Polls',
            icon: 'ChartBarBig',
            onAction: () => emitter.emit(EVENTS.fieldPolls('polls'), { action: 'add' }),
        });
    }
    return items;
}

function AttachmentMenuList({ items, onSelect }) {
    const { t } = useTranslation();
    return (
        <View className={`mb-2 ${dropdownTheme.cnt}`}>
            {items.map((item) => (
                <Pressable
                    key={item.id}
                    onPress={() => onSelect(item)}
                    className={menuSettings.item_ver}
                >
                    <Row className="items-center">
                        {item.icon ? (
                            <View className={menuSettings.item_icon}>
                                <Icon icon={item.icon} size={menuSettings.icon_size || 20} />
                            </View>
                        ) : null}
                        <Text className={menuSettings.item_text}>{t(item.title)}</Text>
                    </Row>
                </Pressable>
            ))}
        </View>
    );
}

function ComposerDock({ children }) {
    const { keyboardLift } = useStickyComposerListInset(0);
    return (
        <RNView
            pointerEvents="box-none"
            style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: keyboardLift,
                zIndex: 20,
            }}
        >
            {children}
        </RNView>
    );
}

function ComposerToolbar({ data, handleSubmit, isWeb, children }) {
    const { t } = useTranslation();
    const isDesktop = useIsDesktop();
    const [menuOpen, setMenuOpen] = useState(false);
    const menuItems = useMemo(
        () => getAttachmentMenuItems(data.inputs),
        [data.inputs]
    );

    const obfuscate = data.inputs['obfuscate_faces'] ? (
        <View className="flex-none">
            {getFormFieldByData(data.inputs['obfuscate_faces'], handleSubmit, 'default')}
        </View>
    ) : null;

    const leading = isDesktop ? (
        <RNView style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {obfuscate}
            {data.inputs['photo'] ? (
                <FileButton field_name="photo" icon="Image" tooltip={t('Add Photos')} {...ATTACHMENT_BUTTON} />
            ) : null}
            {data.inputs['video'] ? (
                <FileButton field_name="video" icon="ImagePlay" tooltip={t('Add Photos or Videos')} {...ATTACHMENT_BUTTON} />
            ) : null}
            {data.inputs['video'] && !isWeb ? (
                <FileButton field_name="video" icon="ImagePlay" {...ATTACHMENT_BUTTON} />
            ) : null}
            {data.inputs['file'] ? (
                <FileButton field_name="file" icon="Paperclip" {...ATTACHMENT_BUTTON} />
            ) : null}
            {data.inputs['labels'] ? (
                <LabelButton field_name="labels" {...ATTACHMENT_BUTTON} />
            ) : null}
            {data.inputs['polls'] ? (
                <PollButton field_name="polls" {...ATTACHMENT_BUTTON} />
            ) : null}
        </RNView>
    ) : (
        <RNView style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {obfuscate}
            {menuItems.length > 0 ? (
                <NeoButton
                    {...ATTACHMENT_BUTTON}
                    image="Plus"
                    style={menuOpen ? 'borderedProminent' : ATTACHMENT_BUTTON.style}
                    accessibilityLabel={t('Add attachment')}
                    onPress={() => setMenuOpen((was) => !was)}
                />
            ) : null}
        </RNView>
    );

    return (
        <RNView style={{ alignSelf: 'stretch' }}>
            {!isDesktop && menuOpen && menuItems.length > 0 ? (
                <AttachmentMenuList
                    items={menuItems}
                    onSelect={(item) => {
                        setMenuOpen(false);
                        item.onAction?.();
                    }}
                />
            ) : null}
            <RNView
                style={{
                    width: '100%',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                {leading}
                {children}
            </RNView>
        </RNView>
    );
}

function AuthorAudienceButton({ profileData, displayName, destination, destinationIcon, onPress }) {
    return (
        <NeoButton
            style="borderless"
            controlSize="regular"
            borderShape="capsule"
            align="start"
            contentInsets="mediaLeading"
            onPress={onPress}
            accessibilityLabel={destination ? `${displayName}, ${destination}` : displayName}
            classNames={{
                root: 'w-max max-w-full min-w-0',
                container: 'w-max max-w-full min-w-0 gap-x-2 pe-4 -ms-1 -mt-1',
            }}
        >
            <View className="pointer-events-none flex-none">
                <Profile {...profileData} displaySize="md" displayType="unit_wo_info" showLinks={false} />
            </View>
            <View className="min-w-0 max-w-full overflow-hidden">
                <Text
                    className="min-w-0 max-w-full truncate text-sm font-semibold tracking-tight leading-5 text-button-foreground"
                    {...nativeTruncateProps}
                >
                    {displayName}
                </Text>
                {destination ? (
                    <Row className="min-w-0 max-w-full items-center gap-1">
                        {typeof destinationIcon === 'string' ? (
                            <Icon icon={destinationIcon} size={12} className="flex-none text-muted-foreground" />
                        ) : destinationIcon ? (
                            <View className="pointer-events-none flex-none">{destinationIcon}</View>
                        ) : null}
                        <Text
                            className="min-w-0 shrink truncate text-xs leading-4 text-secondary-foreground"
                            {...nativeTruncateProps}
                        >
                            {destination}
                        </Text>
                        {onPress ? (
                            <Icon icon="ChevronsUpDown" size={12} className="flex-none text-muted-foreground" />
                        ) : null}
                    </Row>
                ) : null}
            </View>
        </NeoButton>
    );
}

export default function FormFeed({ data, handleSubmit, exProps, name, response }) {
    const { t } = useTranslation();
    const formContext = useFormContext()
    const isFormOnly = exProps?.formOnly === true || name === 'feed_edit';

    const [showImage, setShowImage] = useState(isFormOnly ? true : false);
    const [responseId, setResponseId] = useState(0)

    const isIos = Platform.OS === 'ios'
    const scrollViewRef = useRef(null)
    const screenHeight = useWindowHeight();
    const insets = useStableSafeAreaInsets();
    const { currentUser } = useCurrentUser();

    // iOS: distance from screen top to KbAvoidingView = safe area + modal padding (16) + form header (~48) + gap (12).
    // Android resizes the window itself, so keep the previous working offset.
    const modalOffset = isIos ? insets.top + 76 : 60;

    const rawEditorText = formContext.watch('text');
    const object_privacy_view = formContext.watch('object_privacy_view');

    const hasText = useMemo(() => stripTags(rawEditorText || '').trim().length > 0, [rawEditorText]);

    const playSound = useSound('success');

    function onClose() {
        setShowImage(false)
        exProps?.onClose?.();
    }

    useEffect(() => {
        if (response?.id && response?.id != responseId) {
            playSound();
            emitter.emit(EVENTS.feed, { action: 'new_content', data: response });
            onClose();
            setResponseId(response?.id)
        }
    }, [response?.id])

    useEffect(() => {
        if (showImage) {
            scrollViewRef.current?.scrollToEnd({ animated: true })
        }
    }, [showImage])

    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener(
            'keyboardDidShow',
            () => {
                scrollViewRef.current?.scrollToEnd({ animated: true })
            }
        )
        return () => {
            keyboardDidShowListener.remove()
        }
    }, [])

    const isHiddenVisibility = data?.inputs?.['object_privacy_view']?.origtype == 'hidden' || !data?.inputs?.['object_privacy_view']

    const displayProfile = exProps?.item?.author_data || {
        ...currentUser,
        url_avatar: currentUser.avatar,
        url: null,
    };

    const profileData = {
        ...displayProfile,
        url_avatar: displayProfile.url_avatar || displayProfile.avatar,
        url: null,
    };

    const isPollsPresent = !!data.inputs['polls'];
    const isLabelsPresent = !!data.inputs['labels'];
    const isButtonDisabled = !hasText || ((!isHiddenVisibility && object_privacy_view == '')) ? true : false;
    if (isFormOnly) {
        return (
            <RNView style={{ position: 'relative', width: '100%', flex: 1, gap: 12 }}>
                <View className="items-start justify-start ">
                    <Row className="w-full items-center justify-between gap-x-2">
                        <View className="min-w-0 max-w-full shrink">
                        {data?.inputs?.['object_privacy_view'] ? getFormFieldByData(
                            {
                                ...data.inputs['object_privacy_view'],
                            },
                            handleSubmit,
                            'nofield',
                            {
                                onShowModal: setShowImage,
                                showModal: showImage,
                                maxLength: 0,
                                noContainer: true,
                                renderTrigger: ({ onPress, displayText, icon }) => (
                                    <AuthorAudienceButton
                                        profileData={profileData}
                                        displayName={displayProfile.display_name}
                                        destination={displayText}
                                        destinationIcon={icon}
                                        onPress={onPress}
                                    />
                                ),
                            }
                        ) : (
                            <AuthorAudienceButton
                                profileData={profileData}
                                displayName={displayProfile.display_name}
                            />
                        )}
                        </View>
                        <NeoButton
                            style="bordered"
                            controlSize="small"
                            borderShape="circle"
                            image="X"
                            accessibilityLabel={t('Close')}
                            onPress={onClose}
                            classNames={{ root: 'flex-none' }}
                        />
                    </Row>
                </View>
                <KbAvoidingView className="flex-auto" modalOffset={modalOffset}>
                    {getFormFieldByData(data.inputs['action'], handleSubmit, 'default')}
                    {getFormFieldByData(data.inputs['object_cf'], handleSubmit, 'default')}
                    {getFormFieldByData(data.inputs['owner_id'], handleSubmit, 'default')}
                    {getFormFieldByData(data.inputs['type'], handleSubmit, 'default')}
                    <View className="flex-auto justify-start pb-14">
                        <View className="w-full flex-auto justify-start ">
                            <View
                                className="flex-auto "
                                style={{
                                    ...(isWeb && { transition: 'height 0.1s cubic-bezier(0.25, 0.1, 0.25, 1)' })
                                }}
                            >
                                {getFormFieldByData(
                                    data.inputs['text'],
                                    handleSubmit,
                                    'custom',
                                    {
                                        form_name: name,
                                        styles: { verticalAlign: 'top' },
                                        focus: true,
                                        noPadding: true,
                                        bg: 'transparent',
                                        placeholder: t('Write here...'),
                                        linkify: true,
                                        autofocus: true,
                                        classes: 'flex-auto',
                                        initialHeight: 160,
                                        maxHeight: screenHeight / 2 - 80 ,
                                    }
                                )}
                            </View>
                            <View >
                                <Row className='flex-wrap w-full'>
                                    {
                                        getFormFieldByData(
                                            data.inputs['video'],
                                            handleSubmit,
                                            'notitle',
                                            {
                                                hide_button: true,
                                                list_only: true,
                                                form_name: name,
                                                asDefaultStorage: !data.inputs['photo'],
                                            }
                                        )
                                    }
                                    {
                                        getFormFieldByData(
                                            data.inputs['photo'],
                                            handleSubmit,
                                            'notitle',
                                            { hide_button: true, list_only: true, asDefaultStorage: true, form_name: name }
                                        )
                                    }
                                    {
                                        getFormFieldByData(
                                            data.inputs['file'],
                                            handleSubmit,
                                            'notitle',
                                            { hide_button: true, list_only: true, form_name: name }
                                        )
                                    }
                                </Row>
                                {isLabelsPresent && (
                                    <View className="flex-auto">
                                        {
                                            getFormFieldByData(
                                                data.inputs['labels'],
                                                handleSubmit,
                                                'notitle',
                                                { hide_button: true, noPadding: true }
                                            )
                                        }
                                    </View>
                                )}
                                {isPollsPresent && (
                                    <View className="">
                                        {getFormFieldByData(
                                            data.inputs['polls'],
                                            handleSubmit,
                                            'custom',
                                            { hide_button: true }
                                        )}
                                    </View>
                                )}
                            </View>
                        </View>
                    </View>
                </KbAvoidingView>
                <ComposerDock>
                    <ComposerToolbar
                        data={data}
                        handleSubmit={handleSubmit}
                        isWeb={isWeb}
                    >
                        {getFormFieldByData(
                            data.inputs['tlb_do_submit'],
                            handleSubmit,
                            'default',
                            {
                                form_name: name,
                                form_layout: 'hor',
                                disabled: isButtonDisabled,
                                noPadding: true,
                                size: 'sm',
                                style: 'borderedProminent',
                                rounded: true,
                                notFullWidth: true,
                                icon: "SendHorizontal",
                                bare: true,
                            }
                        )}
                    </ComposerToolbar>
                </ComposerDock>
            </RNView>
        )
    }
}
