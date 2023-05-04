import {BlockByName, DataByName} from 'app/components/block';
import { View, ScrollView } from 'app/design/view'
import LayoutDataContext from 'app/context/layout';
import { KeyboardAvoidingView } from 'react-native';
import BottomBar from 'app/ui/molecules/bottombar';
import { useRef } from 'react';
import Comments from 'app/components/elements/comments';

export default function PageLayout(props) {

    const commentsData = DataByName(props.data, props.blocks.comments);

    const scrollViewRef = useRef();

    const handleScrollToElement = () => {
        console.log('scroll');

        const yOffset = 500;
        scrollViewRef.current.scrollTo({
          x: 0,
          y: yOffset,
          animated: true,
        });
      };

    return (
        <View className='flex-1  w-full h-full'>
                <LayoutDataContext>
                <ScrollView className="w-full h-full flex-1" ref={scrollViewRef}>
                    <BlockByName data={props.data} name={props.blocks.author}/>
                    <BlockByName data={props.data} name={props.blocks.text}/>
                    <BlockByName data={props.data} name={props.blocks.actions}/>
                    <Comments {...commentsData.content[0]} handleScrollToElement={handleScrollToElement}></Comments>
            </ScrollView>
            <KeyboardAvoidingView keyboardVerticalOffset={92} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} >
                <BottomBar/>     
            </KeyboardAvoidingView>
            </LayoutDataContext>
        </View>);
}
