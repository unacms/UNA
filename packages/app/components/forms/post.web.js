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
        props.data.inputs['covers'].caption = 'Add cover image'
    }
    props.data.inputs['title'].type = 'textarea'
    props.data.inputs['title'].height = 12
    props.data.inputs['title'].viewClasses =
        ' text-2xl lg:text-3xl font-bold my-2 lg:my-4  tracking-tight placeholder-neutral-500 text-neutral-900 dark:text-neutral-50  focus:outline-none'

    props.data.inputs['text'].viewClasses = 'dark:focus:bg-red-500'

    return (
        <View className="w-full max-w-5xl flex-col">
            <View className="  overflow-hidden flex-col  ">

                    <View className=" flex-row flex-wrap gap-x-2  flex-auto justify-between ">
                        <View className=" flex-auto mb-4 text-base font-bold text-neutral-800 my-auto ">
                        <Profile {...currentUser} displayType="unit" displaySize="base" />

                        </View>
                        <View className=" mb-4  ">
                            {getFormFieldByData(
                                props.data.inputs['allow_view_to'],
                                props.handleSubmit,
                                'nofield'
                            )}

                            
                            


                        </View>
                        <View className=" mb-4  ">
                           

                            {getFormFieldByData(
                                props.data.inputs['covers'],
                                props.handleSubmit,
                                'notitle',
                                { format: 'custom', view: 'button' }
                            )}
                            
                            


                        </View>
                    </View>
                        
                        
                    
                
                {getFormFieldByData(
                    props.data.inputs['covers'],
                    props.handleSubmit,
                    'notitle',
                    { format: 'custom', view: 'preview' }
                )}

                <View className="  ">
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
            <View className="flex-col ">
                
                <View className='w-full flex-wrap mb-2 flex-row border rounded-xl border-bdr dark:border-bdr-d p-1 '>
                    <View className="font-semibold px-3 h-10 justify-center my-auto text-sm flex-auto text-neutral-800 dark:text-neutral-200">Add media</View>
                    <Row className=" justify-start items-center flex-row flex-wrap ">
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
                </View>




                {prevList.length > 0 && prevList[0]?.key && (
                    <Row className="flex-wrap">{prevList}</Row>
                )}
                
                {getFormFieldByData(
                    props.data.inputs['labels'],
                    props.handleSubmit,
                    'notitle'
                )}

                <View className='w-full flex-wrap mb-2 flex-row border rounded-xl border-bdr dark:border-bdr-d p-1'>
                    <View className="font-semibold px-2 py-1 flex-auto my-auto text-sm  text-neutral-800 dark:text-neutral-200">Category</View>
                    <Row className=" gap-x-2 max-w-xl px-2 justify-start items-center flex-auto flex-row flex-wrap ">
                    {getFormFieldByData(
                    props.data.inputs['cat'],
                    props.handleSubmit,
                    'notitle'
                )}
                    </Row>
                </View>

                

                <View className='w-full flex-wrap my-2   flex-row border rounded-xl border-bdr dark:border-bdr-d p-2'>
                    <View className="font-semibold px-2 py-1  my-auto text-sm flex-auto text-neutral-800 dark:text-neutral-200">Comments</View>
                    <Row className=" gap-x-2 p-2 justify-start items-center flex-row flex-wrap ">
                    {getFormFieldByData(
                    props.data.inputs['allow_comments'],
                    props.handleSubmit,
                    'default'
                )}
                    </Row>
                </View>

                
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
