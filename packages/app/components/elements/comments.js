import { View, Row } from 'app/design/view';
import { useState, useRef, useEffect } from 'react';
import { CommentsBrowse, CommentsForm } from 'app/lib/comments-helpers'
import { BlockWrapper } from 'app/components/block-wrapper'

export default function ({browse, form, url, blockWrapperProps}) {
    const aItems = [];
    const [addData, setAddData] = useState({});
 
    const handleForm = async (data) => {
        setAddData(data)
    }

    const formContent = <View className='border-border border-t border-border/60 mt-12'>
        <CommentsForm 
            handleForm={handleForm} 
            browse={browse.data.object_id} 
            module={browse?.data?.module || ''} 
            form={form} 
            requestUrl={url} 
        />
    </View>

    const wrappedForm = formContent;

    return (
        <BlockWrapper {...blockWrapperProps}>
            <View>
                <CommentsBrowse 
                    commentsTitle="Reviews" 
                    classesBrowse='items-center my-4' 
                    addItems={aItems} 
                    browse={browse} 
                    addData={addData} 
                    module={browse?.data?.module || ''} 
                    requestUrl={url} 
                />
            </View>
            {!!form ? wrappedForm : <View className='mt-12'></View>}
        </BlockWrapper>
    )
}
