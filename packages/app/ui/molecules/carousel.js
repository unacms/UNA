import React, { useCallback, useState, useRef, useContext } from 'react';
import Carousel from "react-native-reanimated-carousel";
import { Dimensions} from 'react-native';
import { View, Pressable, Row } from 'app/design/view'
import { Text } from 'app/design/typography'
import Image from '../../ui/atoms/image';
import { Modal } from 'app/design/controls'

export default function ElementCarousel(props) {

    let data = props.data;

    const height = Dimensions.get('window').height;

    const [showImage, setShowImage] = useState(false);
    const [width, setWidth] = useState(400);

    const handleShowImage = (img) => {
        setShowImage(img);
    } 

    const handleLayout = (event) => {
            console.log(event.nativeEvent.layout.width)
        setWidth(event.nativeEvent.layout.width);
    };


    if (data.length == 0)
        return <></>
        
    return ( 
        <View className="w-full aspect-video" onLayout={handleLayout}>
            <Modal id={'file-preview'} title="Preview title" onVisible={!!showImage} onClose={() => {setShowImage(null)}}>
                <View className="w-full h-screen" style={{height:height - 100}} >
                    {!!showImage && showImage[1] == 'image' && <Image className="w-full h-full" src={showImage[0]} alt='' view="cover" />}
                </View>
            </Modal>
            <Carousel
                loop
                width={width}
                height={width / 16*9}
                autoPlay={true}
                data={data}
                customConfig={{viewCount: 2}}
                scrollAnimationDuration={1000}
                onSnapToItem={(index) => console.log('current index:', index)}
                renderItem={({ item, index }) => (
                    <Pressable style={{
                        flex: 1,
                        justifyContent: 'center',
                    }} key={index} className=" mt-1 " onPress={() => handleShowImage([item.src, 'image'])} ><Image sizes="384px" src={item.src} alt='' view="cover" className=" u-cover rounded-lg dark:bg-neocard-dark border-neoborder dark:border-neoborder-dark border rounded-lg"  /></Pressable>
                    
                )}
            />
        </View>
  )
}