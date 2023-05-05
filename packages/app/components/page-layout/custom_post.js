import {BlockByName, DataByName} from 'app/components/block';
import { View, ScrollView } from 'app/design/view'
import LayoutDataContext from 'app/context/layout';
import { KeyboardAvoidingView } from 'react-native';
import BottomBar from 'app/ui/molecules/bottombar';
import { useRef } from 'react';
import Comments from 'app/components/elements/comments';
import { useRouter } from 'expo-router';
import { Theme } from 'app/design/theme';
import { useNavigation} from "expo-router";
import { updateCenterHeader } from 'app/lib/native-handlers'

export default function PageLayout(props) {

    const commentsData = DataByName(props.data, props.blocks.comments);

    const routerExpo = useRouter();
    const { colors } = Theme();
    const navigation = useNavigation();

    setTimeout(() => {
      updateCenterHeader(null, <View style={{width:360}} className=' items-center  '><BlockByName data={props.data} name={props.blocks.author}/></View>, true, navigation, routerExpo, colors, null);
    }, 100);
    

    const scrollViewRef = useRef();
    const viewListRef = useRef();
    let scrollToId = null;
    const handleScrollToElement = (id) => {
        scrollToId = id;

      };

      const handleCmt = (pageY, id, cmt) => {
        if ('i'+ scrollToId == id){

          cmt.current.measure((x, y, width, height, pageX, pageY) => {
              scrollViewRef.current.scrollTo({
                x: 0,
                y: pageY+400,
                animated: true,
            });
            });
          
            
        }
      };


    return (
        <View className='flex-1  w-full h-full'>
                <LayoutDataContext>
                <ScrollView className="w-full h-full flex-1" ref={scrollViewRef}>
                    <BlockByName data={props.data} name={props.blocks.text}/>
                    <BlockByName data={props.data} name={props.blocks.actions}/>
                    <View  ref={viewListRef}>
                      <Comments {...commentsData.content[0]} handleScrollToElement={handleScrollToElement} handleCmt={handleCmt}></Comments>
                    </View>
            </ScrollView>
            <KeyboardAvoidingView keyboardVerticalOffset={92} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} >
                <BottomBar/>     
            </KeyboardAvoidingView>
            </LayoutDataContext>
        </View>);
}
