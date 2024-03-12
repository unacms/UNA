import { View, Row } from 'app/design/view'
import { useState } from 'react'
import { getFormFieldByData } from 'app/lib/form-helpers'
import { Button } from 'app/design/controls'
import Profile from 'app/ui/molecules/profile';
import React from 'react'
import { useCurrentUser } from 'app/context/user';

export default function FormPost(props) {
    const [imageSource, setImageSource] = useState([])
    let { currentUser, setCurrentUser } = useCurrentUser();
    function setPlaceHolder(name, previews) {
        if (JSON.stringify(previews) != JSON.stringify(imageSource[name])) {
            setImageSource((prevImageSource) => ({
                ...prevImageSource,
                [name]: previews,
            }))
        }
    }

    let prevList = Object.values(imageSource).flat()
    if (props.data.inputs['covers']) {
        props.data.inputs['covers'].viewClasses =
            'p-4 border-dashed border-bdrcard dark:border-bdrcard-d'
        props.data.inputs['covers'].caption = 'Add header image'
    }
    props.data.inputs['title'].type = 'textarea'
    props.data.inputs['title'].height = 12
    props.data.inputs['title'].viewClasses =
        ' text-2xl lg:text-3xl font-bold my-2 lg:my-4  tracking-tight placeholder-neutral-500 text-neutral-900 dark:text-neutral-50  focus:outline-none'

    props.data.inputs['text'].viewClasses = 'dark:focus:bg-red-500'

    return (
        <View className="w-full max-w-5xl flex-col">
            <View className=" bg-bgrcard dark:bg-bgrcard-d  overflow-hidden flex-col  sm:rounded-2xl ">
                <View className=" flex-row px-4 pt-4 pb-2 ">

                    <Profile {...currentUser} displayType="unit" displaySize="base" />
                    <View className="pl-2 flex-row flex-wrap flex-auto justify-between ">
                        <View className=" text-base font-bold text-neutral-800 my-auto mr-4">

                        </View>
                        <View className="my-auto gap-x-2 flex-row">
                            {getFormFieldByData(
                                props.data.inputs['allow_view_to'],
                                props.handleSubmit,
                                'nofield'
                            )}


                            {getFormFieldByData(
                                props.data.inputs['covers'],
                                props.handleSubmit,
                                'notitle',
                                { format: 'custom', view: 'button' }
                            )}


                        </View>
                    </View>
                </View>
                {getFormFieldByData(
                    props.data.inputs['covers'],
                    props.handleSubmit,
                    'notitle',
                    { format: 'custom', view: 'preview' }
                )}

                <View className=" px-4 pb-2 xl:pb-4 xl:px-6 ">
                    {getFormFieldByData(
                        props.data.inputs['title'],
                        props.handleSubmit,
                        'notitle',
                        { placeholder: 'Title...', format: 'custom' }
                    )}
                    {getFormFieldByData(
                        props.data.inputs['text'],
                        props.handleSubmit,
                        'notitle',
                        { placeholder: 'Write your text here...' }
                    )}
                </View>
            </View>
            <View className="flex-col gap-y-4 px-4 xl:px-8">
                <Row className=" ">
                    <View className="">
                        {getFormFieldByData(
                            props.data.inputs['pictures'],
                            props.handleSubmit,
                            'custom',
                            { previewPlaceHolder: setPlaceHolder }
                        )}
                    </View>
                    <View className="">
                        {getFormFieldByData(
                            props.data.inputs['videos'],
                            props.handleSubmit,
                            'custom',
                            { previewPlaceHolder: setPlaceHolder }
                        )}
                    </View>
                    <View className="">
                        {getFormFieldByData(
                            props.data.inputs['files'],
                            props.handleSubmit,
                            'custom',
                            { previewPlaceHolder: setPlaceHolder }
                        )}
                    </View>
                    <View className="">
                        {getFormFieldByData(
                            props.data.inputs['sounds'],
                            props.handleSubmit,
                            'custom',
                            { previewPlaceHolder: setPlaceHolder }
                        )}
                    </View>
                </Row>
                {prevList.length > 0 && prevList[0]?.key && (
                    <Row className="flex-wrap">{prevList}</Row>
                )}
                {getFormFieldByData(
                    props.data.inputs['cat'],
                    props.handleSubmit,
                    'notitle'
                )}
                {getFormFieldByData(
                    props.data.inputs['labels'],
                    props.handleSubmit,
                    'notitle'
                )}

                {getFormFieldByData(
                    props.data.inputs['allow_comments'],
                    props.handleSubmit,
                    'default'
                )}
                {getFormFieldByData(
                    props.data.inputs['do_publish'],
                    props.handleSubmit,
                    'default'
                )}
                {getFormFieldByData(
                    props.data.inputs['do_submit'],
                    props.handleSubmit,
                    'default'
                )}
            </View>
        </View>
    )
}
