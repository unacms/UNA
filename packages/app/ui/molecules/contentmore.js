import { Text } from 'app/design/typography'
import { useState } from 'react';
import { stripTags } from '../../lib/util';
import { View, Pressable } from 'app/design/view';
import Html from '../../ui/atoms/html';

export function ContentMore({content, numberOfLines, textStyle, openSmall, textClassName}) {
    
    const handleShowMore = () => {
        setShowFull(!showFull);
    } 

    const [showFull, setShowFull] = useState(openSmall)

    return (
        <Pressable onPress={handleShowMore}>
            <View className={showFull ? 'hidden' : ''}>
                <Text  className={textClassName} htmlStyles={textStyle} numberOfLines={3} >{stripTags(content)}</Text>
            </View>
            <View className={!showFull ? 'hidden' : ''}>
                <Html data={content} htmlStyles={textStyle}  />
            </View>
        </Pressable>
    )
}