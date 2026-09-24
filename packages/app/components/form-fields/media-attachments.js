import { Row, ScrollView } from 'app/design/view'
import { getFormFieldByData, FileButton, wellButtonProps } from 'app/lib/form/form-helpers'
import { useTranslation } from 'react-i18next'
import Field from './_field'
import FieldWell from './_well'


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

/** Field that should receive editor-pasted files (first image field, else first files). */
export function getDefaultPasteStorageKey(inputs) {
    const mediaFields = getMediaFields(inputs)
    const fromMultiple = mediaFields.find((f) => f.kind === 'image')?.key ?? mediaFields[0]?.key
    if (fromMultiple) return fromMultiple

    const entries = Object.entries(inputs ?? {}).filter(([, v]) => v?.type === 'files')
    const image = entries.find(([key]) => getMediaKind(key) === 'image')
    return image?.[0] ?? entries[0]?.[0] ?? null
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
    const { t } = useTranslation()
    const mediaFields = getMediaFields(inputs)
    if (!mediaFields.length) return null

    const defaultKey =
        asDefaultStorageKey ??
        mediaFields.find((f) => f.kind === 'image')?.key ??
        mediaFields[0]?.key

    // Caption above a FieldWell, like labels / selector / visibility.
    return (
        <Field caption={t(label)} format="default">
            <FieldWell>
                {mediaFields.map(({ key, kind }) => (
                    <FileButton
                        key={key}
                        field_name={key}
                        {...wellButtonProps({ variant: 'text' })}
                        icon={getIconForKind(kind)}
                        tooltip={t('Add') + ' ' + key}
                    />
                ))}
            </FieldWell>

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
                            {
                                hide_button: true,
                                list_only: true,
                                form_name: formName,
                                ...(shouldAsDefaultStorage ? { asDefaultStorage: true } : null),
                            },
                            key
                        )
                    })}
                </Row>
            </ScrollView>
        </Field>
    )
}
