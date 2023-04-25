import {BlockByName} from 'app/components/block';
import { View, ScrollView } from 'app/design/view'
import LayoutDataContext from 'app/context/layout';
import { KeyboardAvoidingView } from 'react-native';
import BottomBar from 'app/ui/molecules/bottombar';
import { useState } from 'react';

export default function PageLayout(props) {
    return (
        <View className='flex-1  w-full h-full'>
                <LayoutDataContext>
                <ScrollView className="w-full h-full flex-1">
                    <BlockByName data={props.data} name={props.blocks.author}/>
                    <BlockByName data={props.data} name={props.blocks.text}/>
                    <BlockByName data={props.data} name={props.blocks.actions}/>
                    <BlockByName data={props.data} name={props.blocks.comments}/>
            </ScrollView>
            <KeyboardAvoidingView keyboardVerticalOffset={92} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} >
                <BottomBar/>     
            </KeyboardAvoidingView>
            </LayoutDataContext>
        </View>);
}
