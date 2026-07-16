import { View } from 'app/design/view'
import { getFormFieldByData, getHiddenFields } from 'app/lib/form-helpers'
import { appSetting } from 'app/lib/util'
import MediaAttachments, { getMediaFields } from 'app/components/form-fields/media-attachments'

export default function FormAds(props) {
    const { data, handleSubmit, name } = props
    const inputs = data.inputs

    const visibleKeys = Object.keys(inputs).filter(
        (key) => inputs[key] && inputs[key].type !== 'hidden'
    )
    const mediaFields = getMediaFields(inputs).filter((f) => visibleKeys.includes(f.key))
    const firstMediaKey = mediaFields[0]?.key
    const renderKeys = visibleKeys.filter(
        (key) => !mediaFields.some((f) => f.key === key) || key === firstMediaKey
    )
    const lastKey = renderKeys[renderKeys.length - 1]
    const useCaptionAsPlaceholder = appSetting('forms', 'without_captions').includes(name)

    return (
        <View className={appSetting('forms', 'form_container')}>
            {getHiddenFields(inputs, handleSubmit)}
            <View className="w-full gap-4">
                {renderKeys.map((key) => {
                    if (key === firstMediaKey) {
                        return (
                            <MediaAttachments
                                key="media-attachments"
                                inputs={inputs}
                                handleSubmit={handleSubmit}
                                formName={name}
                                label="Add to ad"
                            />
                        )
                    }

                    return getFormFieldByData(
                        inputs[key],
                        handleSubmit,
                        'default',
                        {
                            form_name: name,
                            noPadding: key === lastKey,
                            use_caption_as_placeholder: useCaptionAsPlaceholder,
                        }
                    )
                })}
            </View>
        </View>
    )
}
