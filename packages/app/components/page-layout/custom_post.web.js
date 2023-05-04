import { View, ScrollView } from 'app/design/view';
import {BlockByName, DataByName} from 'app/components/block';
import Comments from 'app/components/elements/comments';
import React from 'react';
import { useRef } from 'react';

export default function PageLayout(props) {

    const commentsData = DataByName(props.data, props.blocks.comments);

    const scrollViewRef = useRef();

    const handleScrollToElement = () => {
        console.log('scroll');
        // Replace 500 with the calculated Y-offset of the target element.
        const yOffset = 500;
        scrollViewRef.current.scrollTo({
          x: 0,
          y: yOffset,
          animated: true,
        });
      };

    return (<ScrollView className="w-full sm:p-5 max-w-5xl mx-auto" ref={scrollViewRef} >
        <BlockByName data={props.data} name={props.blocks.author}/>
        <BlockByName data={props.data} name={props.blocks.text}/>
        <BlockByName data={props.data} name={props.blocks.actions}/>
        <Comments {...commentsData.content[0]} handleScrollToElement={handleScrollToElement}></Comments>
    </ScrollView>)
}
