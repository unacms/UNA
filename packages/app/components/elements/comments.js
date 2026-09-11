import { View } from 'app/design/view';
import { useState } from 'react';
import { CommentsBrowse, CommentsForm } from 'app/components/elements/comments-browse'
import { BlockWrapper } from 'app/components/block-wrapper'

export default function ({browse, form, url, blockWrapperProps}) {
    const aItems = [];
    const [addData, setAddData] = useState({});
 
    const handleForm = async (data) => {
        setAddData(data)
    }

    const formContent = <View className=''>
        <CommentsForm 
            handleForm={handleForm} 
            objectId={browse?.data?.object_id} 
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
