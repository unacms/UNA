import { View, Row } from 'app/design/view';
import { BlockByName, DataByName } from 'app/components/block';
import { useRouter } from  'next/navigation';
import { useState, useRef} from 'react';
import { getBackButtonWeb } from 'app/lib/blackbox-helpers';
import { CommentsBrowse, CommentsForm } from 'app/lib/comments-helpers'
import { Dimensions } from 'react-native';
import { KeyboardAvoidingView } from 'react-native';
import { Platform } from 'react-native'
import { stripTags } from '../../lib/util';
import { useWindowDimensions } from 'react-native'
import Card from 'app/ui/molecules/card'

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

    const calculateSize = () => {
        if (viewFormRef.current){
            viewFormRef.current.measure((x, y, width, height, pageX, pageY) => {
                let  FormH = height
                let offset = 100;
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
        if(windowWidth < 1024){
            header = (
                <><Row className='py-2 px-2 w-full items-center fixed top-0 z-50 border-b  bg-bgrnavbar   dark:bg-bgrnavbar-d backdrop-blur   border-bdrnavbar dark:border-bdrnavbar-d flex-row'>
                    {getBackButtonWeb()}
                    {aItems[actionsItemIndex].data}
                </Row></>
            );
            aItems.splice(actionsItemIndex, 1);
        }
        else{
            aItems[actionsItemIndex].data = (
                <View className='pt-4 px-4'>
                    {aItems[actionsItemIndex].data}
                </View>
            );
        }

    }
    let isStycky = Dimensions.get('window').width < 1024 || sizes.otherHeight < sizes.cntHeight;
    return ( 
        <>{header}
 
        <View className="py-12 lg:py-4">
            <View className="max-w-5xl mx-auto w-full shadow border-bdrcard dark:border-bdrcard-d group duration-500 overflow-hidden sm:rounded-2xl  bg-bgrcard dark:bg-bgrcard-d sm:hover:bg-bgrcard-h sm:dark:hover:bg-bgrcard-dh">
                <Row><View ref={viewCntRef} style ={{marginBottom: isStycky ? /*sizes.formHeight +*/ 16: 16, heightx:sizes.otherHeight}} className='  w-full pb-4'>
                    <CommentsBrowse addItems = {aItems} handleReply={handleReply} browse={commentsData?.content[0].browse} addData={addData} module={commentsData?.module} requestUrl={commentsData?.content[0].url} />
                </View>
                </Row>
                <View ref={viewFormRef} style={{width:sizes.formWidth}} onLayout={handleLayout} className={isStycky? ' bg-bgrcard dark:bg-bgrcard-d border-bdrcard dark:border-bdrcard-d fixed bottom-0 w-full' : ' w-full'} > 
                    <KeyboardAvoidingView keyboardVerticalOffset={92} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} >
                        <CommentsForm handleForm={handleForm} browse={commentsData?.content[0].browse} module={commentsData?.module} form={commentsData?.content[0].form} formData={formData} requestUrl={commentsData?.content[0].url} />         
                    </KeyboardAvoidingView>
                </View>
            </View>
        </View> </>
    )

}
