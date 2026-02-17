import { View, Row, ScrollView } from 'app/design/view'
import { useState } from 'react'
import { getFormFieldByData, getHiddenFields } from 'app/lib/form-helpers'
import Profile from 'app/ui/molecules/profile';

import { useCurrentUser } from 'app/context/user';
import { Text } from 'app/design/typography'
import { FileButton } from 'app/lib/form-helpers';

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
            'p-4 border-dashed border-bordercard dark:border-bordercard-d'
        inputs['covers'].caption = 'Add cover image'
    }

    // inputs['title'].type = 'textarea'
    // inputs['title'].height = 12
    // inputs['title'].viewClasses =
    ' text-2xl lg:text-3xl font-bold my-2 placeholder-neutral-500 text-neutral-900 dark:text-neutral-50 focus:outline-none'
    // inputs['text'].viewClasses = 'dark:focus:bg-red-500'

    if (inputs['allow_comments'])
        inputs['allow_comments'].caption = '';

    // Prepare author name for the visibility switcher
    const authorName = <Text className="font-semibold text-card-foreground">{currentUser.display_name}</Text>;

    return (
        <View className="w-full max-w-3xl flex-col p-3 sm:p-4 mx-auto">
            {getHiddenFields(inputs, handleSubmit)}

            <View className="  flex-col  ">
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
                        { placeholder: 'Write your text here...' }
                    )}
                </View>
            </View>
            <View className="flex-col">
                <View className='w-full flex-wrap my-1 flex-row border rounded-xl border-border   py-1 px-2 items-center'>
                    <Text className="font-semibold px-3 py-1 justify-center my-auto text-sm flex-auto text-neutral-800 dark:text-neutral-200">Add to post</Text>
                    <Row className=" justify-center items-center flex-row flex-wrap px-2">
                        {props.data.inputs['pictures'] && (
                            <View className="ml-2">
                                <FileButton field_name='pictures' variant='text' icon="Image" rounded={false} />
                            </View>
                        )}
                        {props.data.inputs['videos'] && (
                            <View className="ml-2">
                                <FileButton field_name='videos' variant='text' icon="Image" rounded={false} />
                            </View>
                        )}
                        {props.data.inputs['files'] && (
                            <View className="ml-2">
                                <FileButton field_name='files' variant='text' icon="Paperclip" rounded={false} />
                            </View>
                        )}
                        {props.data.inputs['sounds'] && (
                            <View className="ml-2">
                                <FileButton field_name='files' variant='text' icon="FileAudio" rounded={false} />
                            </View>
                        )}

                    </Row>

                </View>
                <ScrollView keyboardDismissMode="on-drag" keyboardShouldPersistTaps="handled" className="w-full " horizontal={true}>
                    <Row className='flex-wrap '>
                        {
                            getFormFieldByData(
                                props.data.inputs['pictures'],
                                props.handleSubmit,
                                'notitle',
                                { hide_button: true, list_only: true }
                            )
                        }
                        {
                            getFormFieldByData(
                                props.data.inputs['videos'],
                                props.handleSubmit,
                                'notitle',
                                { hide_button: true, list_only: true }
                            )
                        }
                        {
                            getFormFieldByData(
                                props.data.inputs['files'],
                                props.handleSubmit,
                                'notitle',
                                { hide_button: true, list_only: true }
                            )
                        }
                        {
                            getFormFieldByData(
                                props.data.inputs['sounds'],
                                props.handleSubmit,
                                'notitle',
                                { hide_button: true, list_only: true }
                            )
                        }
                    </Row>
                </ScrollView>

                <View className='w-full my-1 flex-row border rounded-xl border-border  py-1 px-2'>
                    <Text className="font-semibold px-3 py-1 justify-center my-auto text-sm  text-neutral-800 dark:text-neutral-200">Labels</Text>
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
                    <Text className="font-semibold px-3 py-1 my-auto text-sm  text-neutral-800 dark:text-neutral-200">Category</Text>
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
                    <Text className="font-semibold px-3 py-1  my-auto text-sm flex-auto text-neutral-800 dark:text-neutral-200">Allow Comments</Text>
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
