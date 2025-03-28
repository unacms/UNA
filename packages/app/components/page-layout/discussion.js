import { View } from 'app/design/view';
import { BlockByName, DataByName} from 'app/components/block';
import { useState, useContext, useRef, useEffect } from 'react';
import { stripTags } from 'app/lib/util';
import { CommentsBrowse, CommentsForm } from 'app/lib/comments-helpers'
import KbAvoidingView from 'app/ui/atoms/kb-avoiding-view';
import { Keyboard } from 'react-native';
import { useCurrentUser } from 'app/context/user';

export default function PageLayout(props) {

    const [formData, setFormData] = useState({});
    const [addData, setAddData] = useState({});
    const [sizes, setSizes] = useState({formHeight:0});
    const [isKeyboardVisible, setKeyboardVisible] = useState(0);
    
    const { currentUser } = useCurrentUser();
    const viewFormRef = useRef();
    const viewCntRef = useRef();

    const handleReply =  async (id, author, text) => {
        setFormData({text:stripTags(text), parent_id:id, author:author})
    }

    const handleForm =  async (data) => {

        setAddData(data)
    }
    
    const commentsData = DataByName(props.data, props.blocks.comments);
    
    let aItems = Object.entries(props.blocks).filter(([key, value]) => value.forList).filter(([key, value]) => value.forHeader == null).map(([key, value]) => ({
        id: `block_${key}`,
        data: <BlockByName data={props.data} name={value} />
    }));

    let actionsItemIndex = aItems.findIndex(item => item.id === 'block_actions');
    if (actionsItemIndex !== -1) {
        aItems[actionsItemIndex].data = (
            <View className='border-b border-bdrcard dark:border-bdrcard-d'>
                {aItems[actionsItemIndex].data}
            </View>
        );
    }



    const headerItems = useMemo(() => {
        return Object.entries(props.blocks)
            .filter(([key, value]) => value.forHeader)
            .map(([key, value]) => ({
                data: <BlockByName data={props.data} name={value} />
            }));
    }, [props.blocks, props.data]);

  

    const handleLayout = () => {
        viewFormRef.current.measure((x, y, width, height, pageX, pageY) => {
            setSizes({formHeight: height})             
        });
    }; 

    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => {;
            setKeyboardVisible(e.endCoordinates.height);
        });
    
        const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
          setKeyboardVisible(0);
        });
    
        return () => {
          keyboardDidShowListener.remove();
          keyboardDidHideListener.remove();
        };
      }, []);


    return (//style ={{marginBottom: sizes.formHeight}}
        <View className='flex-1 w-full h-full'>
            <View ref={viewCntRef} className="w-full h-full flex-1 bg-bgrcard dark:bg-bgrcard-d" >
                <View  className='overflow-hidden h-full w-full' >
                    <CommentsBrowse addItems = {aItems} handleReply={handleReply} browse={commentsData.content[0].browse} addData={addData} module={commentsData?.content[0].browse?.data?.module ? commentsData?.content[0].browse.data.module : commentsData?.module} requestUrl={commentsData.content[0].url} />
                </View>
            </View>                
            <KbAvoidingView>
                <View ref={viewFormRef} onLayout={handleLayout} className='border-bdrcard dark:border-bdrcard-d  border-t border-bdr dark:border-bdr-d'> 
                    <CommentsForm handleForm={handleForm} browse={commentsData.content[0].browse} module={commentsData?.content[0].browse?.data?.module ? commentsData?.content[0].browse.data.module : commentsData?.module} form={commentsData.content[0].form} formData={formData} requestUrl={commentsData.content[0].url} />         
                </View>
            </KbAvoidingView>

        </View>
    )
}
