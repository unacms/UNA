import { View, Row, ScrollView } from 'app/design/view'
import { getFormFieldByData, FileButton } from 'app/lib/form-helpers'
import { Text } from 'app/design/typography'

function getExtAllow(input) {
    return input?.ext_allow ?? input?.extAllow ?? ''
}

function getExtDeny(input) {
    return input?.ext_deny ?? input?.extDeny ?? ''
}

export function getMediaKind(input) {
    const extAllow = getExtAllow(input)
    const extDeny = getExtDeny(input)

    const hasAny = (exts) => exts.some((ext) => extAllow.includes(ext) || extDeny.includes(ext))

    // Heuristics based on `ext_allow/ext_deny` logic used by `files.js`.
    // Used only for UI icons + deciding which field receives pasted-file defaults.
    const isAudio = hasAny(['mp3', 'm4a', 'm4b', 'wma', 'wav', 'aac', 'ogg'])
    if (isAudio) return 'audio'

    const hasImages = hasAny(['jpg', 'jpeg', 'jpe', 'png', 'gif', 'webp', 'svg'])
    const hasVideos = hasAny(['mp4', 'm4v', 'mov', 'webm'])

    if (hasVideos && !hasImages) return 'video'
    if (hasImages && !hasVideos) return 'image'

    return 'file'
}

export function getMediaFields(inputs) {
    return Object.entries(inputs ?? {})
        .filter(([_, v]) => v?.type === 'files' && (v?.multiple === true || v?.multiple === 'true' || v?.multiple === 1))
        .map(([key, v]) => ({
            key,
            input: v,
            kind: getMediaKind(v),
        }))
}

function getIconForKind(kind) {
    switch (kind) {
        case 'image':
        case 'video':
            return 'Image'
        case 'audio':
            return 'FileAudio'
        case 'file':
        default:
            return 'Paperclip'
    }
}

export default function MediaAttachments({
    inputs,
    handleSubmit,
    formName,
    label = 'Add',
    // Which field should receive pasted-file defaults.
    // If omitted: first `image` kind field, otherwise the first media field.
    asDefaultStorageKey,
}) {
    const mediaFields = getMediaFields(inputs)
    if (!mediaFields.length) return null

    const defaultKey =
        asDefaultStorageKey ??
        mediaFields.find((f) => f.kind === 'image')?.key ??
        mediaFields[0]?.key

    return (
        <>
            <View className='w-full flex-wrap my-1 flex-row border rounded-xl border-border   py-1 px-2 items-center'>
                <Text className="font-semibold px-3 py-1 justify-center my-auto text-sm flex-auto text-secondary-foreground ">
                    {label}
                </Text>
                <Row className=" justify-center items-center flex-row flex-wrap px-2">
                    {mediaFields.map(({ key, kind }) => (
                        <View className="ml-2" key={key}>
                            <FileButton
                                field_name={key}
                                variant='text'
                                icon={getIconForKind(kind)}
                                rounded={false}
                            />
                        </View>
                    ))}
                </Row>
            </View>

            <ScrollView
                keyboardDismissMode="on-drag"
                keyboardShouldPersistTaps="handled"
                className="w-full "
                horizontal={true}
            >
                <Row className='flex-wrap '>
                    {mediaFields.map(({ key, input }) => {
                        const shouldAsDefaultStorage = key === defaultKey
                        return getFormFieldByData(
                            input,
                            handleSubmit,
                            'notitle',
                            shouldAsDefaultStorage
                                ? { hide_button: true, list_only: true, asDefaultStorage: true, form_name: formName }
                                : { hide_button: true, list_only: true }
                        )
                    })}
                </Row>
            </ScrollView>
        </>
    )
}
