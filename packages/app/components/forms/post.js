import { View, Row } from 'app/design/view'
import { useState } from 'react'
import { getFormFieldByData, getHiddenFields } from 'app/lib/form-helpers'
import Profile from 'app/ui/molecules/profile';

import { useCurrentUser } from 'app/context/user';
import { Text } from 'app/design/typography'
import MediaAttachments from 'app/components/form-fields/media-attachments'

export default function FormPost(props) {
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

    if (inputs['allow_comments'])
        inputs['allow_comments'].caption = '';

    // Prepare author name for the visibility switcher
    const authorName = <Text className="font-semibold text-card-foreground">{currentUser.display_name}</Text>;

    return (
        <View className="w-full p-4">
            {getHiddenFields(inputs, handleSubmit)}

            <View>
                <View className="flex-row flex-auto items-center justify-between gap-x-2 mb-4">
                    <View className="gap-x-2 mr-2 flex-row flex-auto items-center web:group">
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
            <View className="flex-col">
                <MediaAttachments
                    inputs={inputs}
                    handleSubmit={handleSubmit}
                    formName={props.name}
                    label="Add to post"
                />

                <View className='w-full my-1 flex-row border rounded-xl border-border  py-1 px-2'>
                    <Text className="font-semibold px-3 py-1 justify-center my-auto text-sm  text-secondary-foreground ">Labels</Text>
                    <Row className=" justify-end items-center flex-auto px-2 ">
                        {getFormFieldByData(
                            inputs['labels'],
                            handleSubmit,
                            'notitle',
                            { noPadding: true, align: 'right' }
                        )}
                    </Row>
                </View>

                <View className='w-full my-1 flex-row border rounded-xl border-border  py-1 px-2'>
                    <Text className="font-semibold px-3 py-1 my-auto text-sm  text-secondary-foreground ">Category</Text>
                    <Row className=" justify-end items-center flex-auto px-2 ">
                        {getFormFieldByData(
                            inputs['cat'],
                            handleSubmit,
                            'notitle',
                            { noPadding: true, align: 'right', variant: 'text', size: 'sm' }
                        )}
                    </Row>
                </View>

                <View className='w-full flex-row my-1  border rounded-xl border-border  py-1 px-2 mb-2'>
                    <Text className="font-semibold px-3 py-1  my-auto text-sm flex-auto text-secondary-foreground ">Allow Comments</Text>
                    <View className=" gap-x-2 px-2 py-0.5 justify-start items-center  ">
                        {getFormFieldByData(
                            inputs['allow_comments'],
                            handleSubmit,
                            'default',
                            { noPadding: true }
                        )}
                    </View>
                </View>
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
            </View>
        </View>
    )
}
