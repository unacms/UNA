import Image from '../../ui/atoms/image';
import Link from '../../ui/atoms/link';
import Time from '../../ui/atoms/time';
import Profile from '../../ui/molecules/profile';
import { TouchableOpacity } from 'app/design/view'
import { useState } from 'react';
import Html from '../../ui/atoms/html';
import { Text, H1 } from 'app/design/typography'
import { View } from 'app/design/view'
import {StyleSheet, useWindowDimensions} from 'react-native';
import { Platform, PlatformIOSStatic, Image as ImageNative } from 'react-native';
import { Button } from 'app/design/controls';
import { stripTags } from '../../lib/util';

export default function UnitFeed({data}) {
    var oImage = null;
    if (data.content.images)  
      oImage = data.content.images.length > 0 ? data.content.images[0] : null;
    
    const [showFull, setShowFull] = useState(false)
    const [imageAspect, setImageAspect] = useState('aspect-square bg-blue-500/50')

    
    const {height, width, scale, fontScale} = useWindowDimensions();

    //TODO: rework url
    let url = data.content.entry_url;

    return (
        <Link href={url} className="w-full">
        
        <View className="bg-neocard group duration-200 hover:shadow-lg active:shadow-none dark:bg-neocard-dark overflow-hidden border-y sm:border sm:rounded-lg hover:border-neoborder/20 border-neoborder/30 dark:border-neoborder-dark/30 dark:hover:border-neoborder-dark/30" >
                <Profile {...data.author_data} displayType="unit" displaySize="lg" showInfo="false" />   
               <Text>{stripTags(data.content_parsed)}</Text>
                </View>
        
        
      
        </Link>     
    );
}
