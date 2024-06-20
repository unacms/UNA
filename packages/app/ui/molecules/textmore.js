import { Text, H1 } from 'app/design/typography'
import { useState } from 'react';
import { View, Pressable } from 'app/design/view';


export default function ({ text, className, numberOfLines, tagName }) {
    const [showFull, setShowFull] = useState(false);
    const Wrapper = tagName == 'h1' ? H1 : Text;
    return (<Pressable onPress={() => { setShowFull((prevShowFull) => !prevShowFull) }} >
        <Wrapper className={className} {...(!showFull ? { numberOfLines: numberOfLines } : {})}>{text}</Wrapper>
    </Pressable>);
}