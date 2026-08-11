import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { useForm, FormProvider } from 'react-hook-form';
import { View, Pressable } from 'app/design/view';
import Image, { POST_ENTRY_COVER_SIZES, POST_ENTRY_COVER_WIDTH_CAP } from 'app/ui/atoms/image';
import Html from 'app/ui/atoms/html';
import { Text, H1C } from 'app/design/typography';
import { Input } from 'app/design/controls';
import { appSetting, clearLinks, getYouTubeVideoId, cn } from 'app/lib/util'
import { useEditableRequest } from 'app/lib/form-helpers'
import { ContentMore } from 'app/ui/molecules/content/contentmore';
import EntityAttachments from './entity_attachments';
import TextMore from 'app/ui/molecules/content/textmore';
import Video from 'app/ui/atoms/video';
import Youtube from 'app/ui/molecules/content/youtube'
import { BlockWrapper } from 'app/components/block-wrapper'
import RftText from 'app/components/form-fields/editor-rft-text'

const isWeb = Platform.OS === 'web'

function useClickOutside(enabled, ref, onOutside) {
    const onOutsideRef = useRef(onOutside)
    onOutsideRef.current = onOutside

    useEffect(() => {
        if (!enabled || !isWeb || typeof document === 'undefined') return

        const handle = (event) => {
            const node = ref.current
            if (!node) return
            const target = event.target
            if (node.contains?.(target)) return
            onOutsideRef.current?.()
        }

        // Skip the same click that opened edit mode
        const timer = setTimeout(() => {
            document.addEventListener('mousedown', handle)
            document.addEventListener('touchstart', handle)
        }, 0)

        return () => {
            clearTimeout(timer)
            document.removeEventListener('mousedown', handle)
            document.removeEventListener('touchstart', handle)
        }
    }, [enabled, ref])
}

function EditableTitleField({
    editable,
    requestUrl,
    fieldName = 'title',
    initialValue,
    inputClassName,
    children,
}) {
    const { value, commit } = useEditableRequest({
        initialValue: initialValue ?? '',
        requestUrl,
        fieldName,
        toParam: (v) => encodeURIComponent(String(v ?? '')),
    })
    const [editing, setEditing] = useState(false)
    const draftRef = useRef(value ?? '')
    const wrapRef = useRef(null)

    const saveAndClose = useCallback(async () => {
        await commit(draftRef.current)
        setEditing(false)
    }, [commit])

    useClickOutside(editing, wrapRef, saveAndClose)

    if (!editable) {
        return typeof children === 'function' ? children(initialValue) : children
    }

    if (editing) {
        return (
            <View ref={wrapRef} className="w-full">
                <Input
                    autoFocus
                    defaultValue={String(value ?? '')}
                    onChangeText={(text) => { draftRef.current = text }}
                    onBlur={saveAndClose}
                    onSubmitEditing={saveAndClose}
                    className={cn(
                        'w-full border border-border/60 bg-input/40 web:focus:bg-input/70 rounded-lg px-3 py-2',
                        inputClassName,
                    )}
                />
            </View>
        )
    }

    return (
        <Pressable
            onPress={() => {
                draftRef.current = value ?? ''
                setEditing(true)
            }}
            accessibilityRole="button"
            accessibilityLabel="Edit title"
            className="w-full web:cursor-pointer web:hover:bg-muted/40 rounded-lg"
        >
            {typeof children === 'function' ? children(value) : children}
        </Pressable>
    )
}

function EditableTextField({
    editable,
    requestUrl,
    fieldName = 'text',
    initialValue,
    children,
}) {
    const { value, commit } = useEditableRequest({
        initialValue: initialValue ?? '',
        requestUrl,
        fieldName,
        toParam: (v) => encodeURIComponent(String(v ?? '')),
    })
    const [editing, setEditing] = useState(false)
    const wrapRef = useRef(null)
    const methods = useForm({
        defaultValues: { [fieldName]: value ?? '' },
    })
    const { isDirty } = methods.formState

    const saveAndClose = useCallback(async () => {
        if (isDirty) {
            await commit(methods.getValues(fieldName) ?? '')
        }
        setEditing(false)
    }, [commit, fieldName, isDirty, methods])

    useClickOutside(editing, wrapRef, saveAndClose)

    useEffect(() => {
        if (editing) {
            methods.reset({ [fieldName]: value ?? '' })
        }
    }, [editing, fieldName, methods, value])

    if (!editable) {
        return typeof children === 'function' ? children(initialValue) : children
    }

    if (editing) {
        return (
            <View ref={wrapRef} className="w-full">
                <FormProvider {...methods}>
                    <RftText
                        name={fieldName}
                        value={value ?? ''}
                        html={2}
                        autofocus
                        initialHeight={160}
                        maxHeight={420}
                        caption=""
                        placeholder=""
                    />
                </FormProvider>
            </View>
        )
    }

    return (
        <Pressable
            onPress={() => setEditing(true)}
            accessibilityRole="button"
            accessibilityLabel="Edit text"
            className="w-full web:cursor-pointer web:hover:bg-muted/40 rounded-lg"
        >
            {typeof children === 'function' ? children(value) : children}
        </Pressable>
    )
}

export default function EntityTextBlock ({blockWrapperProps, data, block, showPad, sidebar, editable}) {
    const isEditable = !!(editable || data?.editable)
    const view = appSetting('entry', 'default_view');
    switch (view) {
        case 'small':
            return <Small blockWrapperProps={blockWrapperProps} data={data} showPad={showPad} editable={isEditable} />;
        default:
            return <Default blockWrapperProps={blockWrapperProps} block={block} data={data} showPad={showPad} sidebar={sidebar} editable={isEditable} />;
    }
}

function Small({ data, editable }) {
    const requestUrl = data?.params?.request_url
    const text = clearLinks(data.entry_text);

    return (
        <View className="bg-card sm:border-x w-full mx-auto">
            <View className=' bg-primary/10 sm:bg-transparent  rounded-lg flex-col px-2.5 py-2 sm:p-0 mx-4 mb-2 mt-4'>
                <EditableTitleField
                    editable={editable}
                    requestUrl={requestUrl}
                    initialValue={data.entry_title}
                    inputClassName="font-bold text-popover-foreground text-base sm:text-xl"
                >
                    {(title) => (
                        <Text className="font-bold text-popover-foreground  text-base sm:text-xl ">{title}</Text>
                    )}
                </EditableTitleField>
                <EditableTextField
                    editable={editable}
                    requestUrl={requestUrl}
                    initialValue={text}
                >
                    {(body) => (
                        <ContentMore content={body} numberOfLines={3} numberOfSymbols={360} openSmall={false} customClassName="u-vanilla-html" />
                    )}
                </EditableTextField>
            </View>
        </View>
    );
}

const getImagesData = (data) => {
    if (!data["bx_if:show_screenshots"] || !data["bx_if:show_screenshots"].condition) {
        return [];
    }

    const screenshots = data["bx_if:show_screenshots"].content.screenshots;

    const att = screenshots.map(screenshot => ({
        type: 'image',
        data: { 'src': screenshot.url_bg }
    }));

    return att;
};

function Default({ data, showPad, sidebar, block, blockWrapperProps, editable }) {
    const att = getImagesData(data);
    const isSmall = block?.module == "bx_market";
    const checked = _checkEmpty(data);
    const text = checked?.text ?? clearLinks(data.entry_text);
    const videoId = checked?.videoId ?? null;
    const requestUrl = data?.params?.request_url;

    if (!editable && !text && !data.video && !data.image && !videoId)
        return null

    return (
        <BlockWrapper {...blockWrapperProps}>
            <View className="w-full">
                {(!!data.video?.src_mp4) && <View className='w-full aspect-video rounded-xl overflow-hidden mb-3'>
                    <Video poster={data.video.src_poster} src={data.video.src_mp4} cover={true} controls={true} muted={"muted"} />
                </View>}
                {(videoId) && <View className='w-full aspect-video rounded-xl overflow-hidden mb-3'>
                    <Youtube videoId={videoId} size={3} />
                </View>}
                {(!!data.image && !data.video) && (
                    <View className="w-full h-[30vh] mb-4 sm:rounded-xl overflow-hidden">
                        <Image
                            {...data.image}
                            alt={data.title}
                            className="u-cover"
                            view="cover"
                            sizes={POST_ENTRY_COVER_SIZES}
                            optimizedWidthCap={POST_ENTRY_COVER_WIDTH_CAP}
                        />
                    </View>
                )}
                <View className={`mx-auto w-full ${(showPad == false || sidebar ? '' : ' ')}`}>
                    <EditableTitleField
                        editable={editable}
                        requestUrl={requestUrl}
                        initialValue={data.entry_title}
                        inputClassName="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-title"
                    >
                        {(title) => (
                            isSmall
                                ? <TextMore tagName='h1' text={title} numberOfLines={2} className="font-bold tracking-tight text-foreground"></TextMore>
                                : <H1C>{title}</H1C>
                        )}
                    </EditableTitleField>
                    <EditableTextField
                        editable={editable}
                        requestUrl={requestUrl}
                        initialValue={data.entry_text}
                    >
                        {(body) => {
                            const display = clearLinks(body)
                            return isSmall
                                ? <ContentMore showLess={true} content={display} numberOfLines={3} numberOfSymbols={360} openSmall={false} customClassName="u-vanilla-html" />
                                : <Html data={display} />
                        }}
                    </EditableTextField>
                </View>
                <EntityAttachments data={att} />
            </View>
        </BlockWrapper>
    );
}

const _checkEmpty = (data) => {
    if (!data) return false
    const text = clearLinks(data.entry_text);
    const videoId = data.video_embed && getYouTubeVideoId(data.video_embed) || null;
    if (!text && !data.video && !data.image && !videoId)
        return false

    return {text: text, videoId: videoId}
}

EntityTextBlock.checkEmpty = (item) => {
    if (item?.editable || item?.data?.editable) {
        return _checkEmpty(item.data) || true
    }
    return _checkEmpty(item.data)
};
