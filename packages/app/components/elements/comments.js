import { View, Row } from 'app/design/view';
import { useState, useRef, useEffect } from 'react';
import { CommentsBrowse, CommentsForm } from 'app/lib/comments-helpers'

export default function (props) {
    const aItems = [];
    const [addData, setAddData] = useState({});
 
    const handleForm = async (data) => {
        setAddData(data)
    }

    const formContent = <View className=' border-bdrcard dark:border-bdrcard-d border-t border-bdr dark:border-bdr-d mt-12 '>
        <CommentsForm 
            handleForm={handleForm} 
            browse={props.browse.data.object_id} 
            module={props.browse?.data?.module || ''} 
            form={props.form} 

            requestUrl={props.url} 
        />
    </View>

    const wrappedForm = formContent;

    return (
        <>
            <View>
                <CommentsBrowse 
                    commentsTitle="Reviews" 
                    classesBrowse='items-center my-4' 
                    addItems={aItems} 
                    browse={props.browse} 
                    addData={addData} 
                    module={props.browse?.data?.module ? props.browse.data.module : ''} 
                    requestUrl={props.url} 
                />
            </View>
            {!!form ? wrappedForm : <View className='mt-12'></View>}
        </>
    )
}
