import { View, Row } from 'app/design/view'
import { useState } from 'react'
import { getFormFieldByData, getHiddenFields } from 'app/lib/form/form-helpers'
import Profile from 'app/ui/molecules/profile/profile';

import { useCurrentUser } from 'app/context/user';
import { Text } from 'app/design/typography'
import MediaAttachments from 'app/components/form-fields/media-attachments'
import { useTranslation } from 'react-i18next'

// Rendered below attachments in this order when the form display includes them.
const OPTION_FIELDS = ['labels', 'cat', 'allow_comments', 'resolvable'];

export default function FormPost(props) {
    const { t } = useTranslation()
    const { data, handleSubmit } = props;
    const inputs = data.inputs;

    const [coverSource, setCoverSource] = useState([])
    let { currentUser } = useCurrentUser();


    function setPlaceHolderCover(name, previews) {
        if (JSON.stringify(previews) != JSON.stringify(currentUser[name])) {
            setCoverSource((prevImageSource) => ({
                ...prevImageSource,
                [name]: previews,
            }))
        }
    }

    const prevListCover = Object.values(coverSource)
        .flat()
        .filter((element) => element !== undefined && element !== null)

    if (inputs['covers']) {
        inputs['covers'].viewClasses =
            'p-4 border-dashed border-border'
        inputs['covers'].caption = 'Add cover image'
    }

    // Prepare author name for the visibility switcher
    const authorName = <Text className="font-semibold text-card-foreground">{currentUser.display_name}</Text>;

    return (
        <View className="w-full p-4">
            {getHiddenFields(inputs, handleSubmit)}

            <View>
                <View className="flex-row flex-auto items-center justify-between gap-x-2 mb-4">
                    <View className="gap-x-2 mr-2 flex-row flex-auto items-center group">
                        <Profile {...currentUser} displaySize="lg" displayType="unit_wo_info" />

                        {getFormFieldByData(
                            inputs['allow_view_to'],
                            handleSubmit,
                            'nofield',
                            {
                                variant: 'text',
                                size: 'base',
                                addElement: authorName
                            }
                        )}
                    </View>

                    <View>
                        {getFormFieldByData(
                            inputs['covers'],
                            handleSubmit,
                            'notitle',
                            { format: 'custom', view: 'button', preview: 'cover', variant: 'text', size: 'sm', previewPlaceHolder: setPlaceHolderCover, }
                        )}
                    </View>
                </View>

                {prevListCover.length > 0 && prevListCover[0]?.key && (
                    <Row className="flex-wrap">{prevListCover}</Row>
                )}

                <View className="py-1">
                    {getFormFieldByData(
                        inputs['title'],
                        handleSubmit,
                        'notitle',
                        { placeholder: 'Title...', format: 'custom' }
                    )}
                </View>
                <View className="py-1">
                    {getFormFieldByData(
                        inputs['text'],
                        handleSubmit,
                        'notitle',
                        { placeholder: 'Write your text here...', form_name: props.name }
                    )}
                </View>
            </View>
            <View className="flex-col gap-4 pt-3">
                <MediaAttachments
                    inputs={inputs}
                    handleSubmit={handleSubmit}
                    formName={props.name}
                    label={t('Add to post')}
                />

                {/* Standard field rendering, as in FormContent. bx_posts and bx_forum
                    share this layout but not all fields; missing inputs render nothing. */}
                {OPTION_FIELDS.map((key) =>
                    getFormFieldByData(
                        inputs[key],
                        handleSubmit,
                        'default',
                        { form_name: props.name },
                        key
                    )
                )}
                {getFormFieldByData(
                    inputs['do_publish'],
                    handleSubmit,
                    'default',
                    { noPadding: true }
                )}
                {getFormFieldByData(
                    inputs['do_submit'],
                    handleSubmit,
                    'default',
                    { noPadding: true }
                )}
                 {getFormFieldByData(
                    inputs['controls'],
                    handleSubmit,
                    'default',
                    { noPadding: true }
                )}
                
            </View>
        </View>
    )
}
