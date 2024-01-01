import { View, Row } from 'app/design/view';
import { BlockByName, DataByName } from 'app/components/block';
import { useRouter } from  'next/navigation';
import { useState, useRef} from 'react';
import { getBackButtonWeb } from 'app/lib/conductor-helpers';
import { CommentsBrowse, CommentsForm } from 'app/lib/comments-helpers'
import { Dimensions } from 'react-native';
import { KeyboardAvoidingView } from 'react-native';
import { Platform } from 'react-native'
import { stripTags } from 'app/lib/util';
import { useWindowDimensions } from 'react-native'

export default function PageLayout(props) {
    const [formData, setFormData] = useState({});
    const [addData, setAddData] = useState({});
    const [sizes, setSizes] = useState({cntHeight:0, listHeight:100, formHeight:0, formWidth:100});
    
    const viewFormRef = useRef();
    const viewCntRef = useRef();

    const handleReply =  async (id, author, text) => {
        setFormData({text:stripTags(text), parent_id:id, author:author})
        document.getElementsByClassName("form-control-cmt_text")[0].getElementsByClassName("ProseMirror")[0].focus();
    }
    
    const handleForm =  async (data) => {
        setAddData(data)
        calculateSize();
    }   

    const handleWindowSizeChange = () => {
        calculateSize();
    };

    Dimensions.addEventListener('change', handleWindowSizeChange);

    const handleLayout = () => {
        calculateSize();
    }; 

    const router = useRouter();
    const windowWidth = useWindowDimensions().width + 24;
    const windowWidthOr = useWindowDimensions().width;
   
    const calculateSize = () => {
        if (viewFormRef.current){
            viewFormRef.current.measure((x, y, width, height, pageX, pageY) => {
                let  FormH = height
                let offset = 90;
                if (Dimensions.get('window').width < 1024){
                    FormH = FormH 
                    offset = 128;
                }
                let otherH = Dimensions.get('window').height;
                otherH = otherH - FormH - offset
                viewCntRef.current.measure((x, y, width, height, pageX, pageY) => {
                    setSizes({formHeight: FormH, formWidth: width, otherHeight:otherH, cntHeight:height})             
                });
            });
        }
    }

    const commentsData = DataByName(props.data, props.blocks.comments);

    let aItems = Object.entries(props.blocks).filter(([key, value]) => value.forList).map(([key, value]) => ({
        id: `block_${key}`,
        data: <BlockByName data={props.data} name={value} />
    }));

    let actionsItemIndex = aItems.findIndex(item => item.id === 'block_actions');
    if (actionsItemIndex !== -1) {
        aItems[actionsItemIndex].data = (
            <View className=' border-b  border-bdr dark:border-bdr-d'>
                {aItems[actionsItemIndex].data}
            </View>
        );
    }

    let header = <></>
    actionsItemIndex = aItems.findIndex(item => item.id === 'block_author');
    if (actionsItemIndex !== -1) {
        if(windowWidthOr < 1024){
            header = (
                <><Row className='py-2 px-2 w-full items-center fixed top-0 z-50 border-b  bg-bgrnavbar dark:bg-bgrnavbar-d backdrop-blur border-bdrnavbar dark:border-bdrnavbar-d flex-row justify-between'>
                    {getBackButtonWeb()}
                    <View style={{width:windowWidth-100}}>
                        {aItems[actionsItemIndex].data}
                    </View>
                </Row></>
            );
            aItems.splice(actionsItemIndex, 1);
        }
        else{
            aItems[actionsItemIndex].data = (
                <View className='pt-4 px-4 lg:pt-4'>
                    {aItems[actionsItemIndex].data}
                </View>
            );
        }

    }
   
    let isStycky = Dimensions.get('window').width < 1024 || sizes.otherHeight < sizes.cntHeight;
    return ( 
        <>
            {header}
            <View className=" py-0 mt-11 lg:mt-4 ">
                <View className="max-w-5xl mx-auto w-full  border-bdrcard dark:border-bdrcard-d group duration-500  lg:rounded-2xl bg-bgrcard dark:bg-bgrcard-d sm:hover:bg-bgrcard-h sm:dark:hover:bg-bgrcard-dh">
                    <Row><View ref={viewCntRef} style ={{marginBottom: isStycky ? /*sizes.formHeight +*/ 36: 16, heightx:sizes.otherHeight}} className='  w-full pb-20'>
                        <CommentsBrowse addItems = {aItems} handleReply={handleReply} browse={commentsData?.content[0].browse} addData={addData} module={commentsData?.content[0].browse?.data?.module ? commentsData?.content[0].browse.data.module : commentsData?.module} requestUrl={commentsData?.content[0].url} />
                    </View>
                    </Row>
                    <View ref={viewFormRef} style={{width:sizes.formWidth}} onLayout={handleLayout} className={isStycky? ' bg-bgrcard dark:bg-bgrcard-d border-bdr dark:border-bdr-d fixed bottom-0 w-full border-t border-bdr dark:border-bdr-d' : ' w-full sm:rounded-b-2xl border-t border-bdr dark:border-bdr-d '} > 
                        <KeyboardAvoidingView keyboardVerticalOffset={92} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} >
                            <CommentsForm handleForm={handleForm} browse={commentsData?.content[0].browse} module={commentsData?.content[0].browse?.data?.module ? commentsData?.content[0].browse.data.module : commentsData?.module} form={commentsData?.content[0].form} formData={formData} requestUrl={commentsData?.content[0].url} />         
                        </KeyboardAvoidingView>
                    </View>
                </View>
            </View>
        </>
    )

}
