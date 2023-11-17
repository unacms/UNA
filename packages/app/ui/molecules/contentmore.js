import { Text } from 'app/design/typography'
import { useState } from 'react';
import { stripTags } from 'app/lib/util';
import { View, Pressable } from 'app/design/view';
import Html from 'app/ui/atoms/html';
import { appSetting } from 'app/lib/util';

export function ContentMore({content, numberOfLines, textStyle, openSmall, textClassName}) {
    
    const handleShowMore = () => {
        setShowFull(!showFull);
    } 

    const [showFull, setShowFull] = useState(openSmall);

    return (
        <Pressable onPress={(e) => {handleShowMore(); e.preventDefault() }} >
            <View className={showFull ? 'hidden' : ''}>
                <Text  className={textClassName} htmlStyles={textStyle} numberOfLines={numberOfLines} >
                    {stripTags(content)}
                </Text>
            </View>
            <View className={!showFull ? 'hidden' : ''}>
                <Html data={content} htmlStyles={textStyle}  />
            </View>
        </Pressable>
    )
}