import { View, Row, ScrollView } from 'app/design/view'
import { getFormFieldByData, FileButton } from 'app/lib/form-helpers'
import { Text } from 'app/design/typography'

function getExtAllow(input) {
    return input?.ext_allow ?? input?.extAllow ?? ''
}

function getExtDeny(input) {
    return input?.ext_deny ?? input?.extDeny ?? ''
}

export function getMediaKind(fieldName) {
    switch (fieldName) {
        case 'photo':
        case 'cmt_image':
        case 'pictures':
            return 'image'
        case 'video':
        case 'videos':
            return 'video'
        case 'sounds':
            return 'audio'
        case 'file':
        case 'files':
        default:
            return 'file'
    }
}

export function getMediaFields(inputs) {
    return Object.entries(inputs ?? {})
        .filter(([_, v]) => v?.type === 'files' && (v?.multiple === true || v?.multiple === 'true' || v?.multiple === 1))
        .map(([key, v]) => ({
            key,
            input: v,
             kind: getMediaKind(key),
        }))
}

function getIconForKind(kind) {
    switch (kind) {
        case 'video':
            return 'Film'
        case 'image':
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
                                tooltip={'Add '+ key}
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
                                : { hide_button: true, list_only: true },
                            key
                        )
                    })}
                </Row>
            </ScrollView>
        </>
    )
}
