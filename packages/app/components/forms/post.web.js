import { View, Row } from 'app/design/view'
import { useState } from 'react'
import { getFormFieldByData, getHiddenFields } from 'app/lib/form-helpers'
import Profile from 'app/ui/molecules/profile';
import React from 'react'
import { useCurrentUser } from 'app/context/user';
import { Text } from 'app/design/typography'

export default function FormPost(props) {
    const {data, handleSubmit} = props;
    const inputs = data.inputs;

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

    const prevList = Object.values(imageSource)
        .flat()
        .filter((element) => element !== undefined && element !== null)

    if (inputs['covers']) {
        inputs['covers'].viewClasses =
            'p-4 border-dashed border-bdrcard dark:border-bdrcard-d'
        inputs['covers'].caption = 'Add cover image'
    }
    inputs['title'].type = 'textarea'
    inputs['title'].height = 12
    inputs['title'].viewClasses =
        ' text-2xl lg:text-3xl font-bold my-2 placeholder-neutral-500 text-neutral-900 dark:text-neutral-50 focus:outline-none'
    inputs['text'].viewClasses = 'dark:focus:bg-red-500'

    if (inputs['allow_comments'])
        inputs['allow_comments'].caption = '';

    return (
        <View className="w-full max-w-5xl flex-col">
          {getHiddenFields(inputs, handleSubmit)}
        
            <View className="  overflow-hidden flex-col  ">
                <View className=" flex-row flex-wrap gap-x-2 flex-auto justify-between items-center mr-1">
                    <View className=" flex-auto mb-4 ">
                        <Profile {...currentUser} displayType="unit" displaySize="base" />
                    </View>
                    <View className=" mb-4  ">
                        {getFormFieldByData(
                            inputs['allow_view_to'],
                            handleSubmit,
                            'nofield'
                        )}
                    </View>
                    <View className=" mb-4  ">
                        {getFormFieldByData(
                            inputs['covers'],
                            handleSubmit,
                            'notitle',
                            { format: 'custom', view: 'button' }
                        )}
                    </View>
                </View>
                {getFormFieldByData(
                    inputs['covers'],
                    handleSubmit,
                    'notitle',
                    { format: 'custom', view: 'preview' }
                )}
                <View className="  ">
                    {getFormFieldByData(
                        inputs['title'],
                        handleSubmit,
                        'notitle',
                        { placeholder: 'Title...', format: 'custom' }
                    )}
                    {getFormFieldByData(
                        inputs['text'],
                        handleSubmit,
                        'notitle',
                        { placeholder: 'Write your text here...' }
                    )}
                </View>
            </View>
            <View className="flex-col ">
                <View className='w-full flex-wrap my-1 flex-row border rounded-xl border-bdr dark:border-bdr-d  py-1 px-2 items-center'>
                    <Text className="font-semibold px-3 py-1 justify-center my-auto text-sm flex-auto text-neutral-800 dark:text-neutral-200">Add to post</Text>
                    <Row className=" justify-center items-center flex-row flex-wrap px-2">
                        <View className="items-center justify-center">
                            {getFormFieldByData(
                                inputs['pictures'],
                                handleSubmit,
                                'custom',
                                { previewPlaceHolder: setPlaceHolder, noMargin:true }
                            )}
                        </View>
                        <View className="">
                            {getFormFieldByData(
                                inputs['videos'],
                                handleSubmit,
                                'custom',
                                { previewPlaceHolder: setPlaceHolder, noMargin:true }
                            )}
                        </View>
                        <View className="">
                            {getFormFieldByData(
                                inputs['files'],
                                handleSubmit,
                                'custom',
                                { previewPlaceHolder: setPlaceHolder, noMargin:true }
                            )}
                        </View>
                        <View className="">
                            {getFormFieldByData(
                                inputs['sounds'],
                                handleSubmit,
                                'custom',
                                { previewPlaceHolder: setPlaceHolder, noMargin:true }
                            )}
                        </View>
                    </Row>
                    
                </View>
                {prevList.length > 0 && prevList[0]?.key && (
                        <Row className="flex-wrap">{prevList}</Row>
                    )}


                <View className='w-full my-1 flex-row border rounded-xl border-bdr dark:border-bdr-d py-1 px-2'>
                    <Text className="font-semibold px-3 py-1 justify-center my-auto text-sm  text-neutral-800 dark:text-neutral-200">Labels</Text>
                    <Row className=" justify-end items-center flex-auto px-2 ">
                        {getFormFieldByData(
                            inputs['labels'],
                            handleSubmit,
                            'notitle',
                            { noMargin:true, variant: 'text', align: 'right', size: 'sm' }
                        )}
                    </Row>
                </View>

                <View className='w-full my-1 flex-row border rounded-xl border-bdr dark:border-bdr-d py-1 px-2'>
                    <Text className="font-semibold px-3 py-1 my-auto text-sm  text-neutral-800 dark:text-neutral-200">Category</Text>
                    <Row className=" justify-end items-center flex-auto px-2 ">
                        {getFormFieldByData(
                            inputs['cat'],
                            handleSubmit,
                            'notitle',
                            { noMargin:true,  align: 'right',  variant: 'text', size: 'sm' }
                        )}
                    </Row>
                </View>

                <View className='w-full flex-wrap my-1   flex-row border rounded-xl border-bdr dark:border-bdr-d py-1 px-2 mb-2'>
                    <Text className="font-semibold px-3 py-1  my-auto text-sm flex-auto text-neutral-800 dark:text-neutral-200">Allow Comments</Text>
                    <Row className=" gap-x-2 px-2 py-0.5 justify-start items-center flex-row flex-wrap ">
                        {getFormFieldByData(
                            inputs['allow_comments'],
                            handleSubmit,
                            'default',
                            { noMargin:true }
                        )}
                    </Row>
                </View>
                {getFormFieldByData(
                    inputs['do_publish'],
                    handleSubmit,
                    'default'
                )}
                {getFormFieldByData(
                    inputs['do_submit'],
                    handleSubmit,
                    'default'
                )}
            </View>
        </View>
    )
}
