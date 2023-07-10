import { View, ScrollView, Row, Pressable } from 'app/design/view'
import { Modal } from 'app/design/controls'
import { useState, useEffect } from 'react';
import Image from '../../ui/atoms/image';
import Animated, { useSharedValue, withTiming, useAnimatedStyle, Easing } from "react-native-reanimated";


export function Story(props) {
    const [showImage, setShowImage] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const opacity = useSharedValue(0);

    useEffect(() => {
        opacity.value = withTiming(1, { duration: 500 });
    }, [currentImageIndex, opacity]);

    const images = [
        'https://ci.una.io/test3/s/bx_albums_photos_resized/jacrfp7dxxup4r4kcysmctkqcxrpqxcf.jpg',
        'https://ci.una.io/test3/s/bx_albums_photos_resized/xad3wcrecjzseazbz4pafghsn6xc7xxu.jpg',
        'https://ci.una.io/test3/s/bx_albums_photos_resized/efcupgrnxphpjeqrs7s3zyz9vtifuadr.jpg',
        'https://ci.una.io/test3/s/bx_albums_photos_resized/xaurzdanv39cteuc2nkyjjcz4gmqmxcu.jpg',
        'https://ci.una.io/test3/s/bx_albums_photos_resized/uvl9ltecz5qekked9zsa6mzyxhxfhkuc.jpg',
        'https://ci.una.io/test3/s/bx_albums_photos_resized/umj3krzwnnavv2srknq3ncuzggpvks3g.jpg',
        'https://ci.una.io/test3/s/bx_albums_photos_resized/wptg3pgdtwevhgvgabvraverc34qewqg.jpg', 
        'https://ci.una.io/test3/s/bx_posts_photos_resized/fkntirm9qfbvkah2t7e63qz5fvlw67qe.jpg',
        'https://ci.una.io/test3/s/bx_posts_photos_resized/fkntirm9qfbvkah2t7e63qz5fvlw67qe.jpg'
    ];

    useEffect(() => {
        const timer = setTimeout(() => {
          setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
        }, 3000);

        return () => {
          clearTimeout(timer);
        };
    }, [currentImageIndex]);

    const animatedStyles = images.map((_, index) => {
        return useAnimatedStyle(() => {
            const opacityValue = index === currentImageIndex ? 1 : 0;
            const opacityValue1 = withTiming(opacityValue, { duration: 700 });
            return {
                opacity: opacityValue1,
                display: opacityValue1 === 0 ? 'none' : 'flex',
            };
        });
    });

    const animatedStyles2 = images.map((_, index) => {
        return useAnimatedStyle(() => {
            const opacityValue = index <= currentImageIndex ? '100%' : 0;
            const opacityValue1 = withTiming(opacityValue, { duration: 3000 });
            return {
                width: opacityValue1,
            };
        });
    });

    return (
        <View className=" 
            overflow-hidden sm:rounded-lg  
            bg-backgroundcard dark:bg-backgroundcard-dark border-y sm:border 
            border-bordercolorcard dark:border-bordercolorcard-dark 
            sm:mx-4 mt-2 sm:mt-4">
            <Modal onVisible={!!showImage} onClose={() => {setShowImage(null)}}>
                <View className='h-4 w-full  flex-row gap-x-2'>
                    {images.map((image, index) => (
                        <View  key={'slideindex' + index} className='h-3 w-1/4 bg-green-500'>
                            <Animated.View style={[{height:12, position:'absolute', backgroundColor:'orange'}, animatedStyles2[index]]} className='h-96 w-96' >
                            </Animated.View>
                        </View>
                    ))}
                </View>
                <View className='h-96 w-96' >
                    {images.map((image, index) => (
                        <Animated.View key={'slide' + index} style={[{width:500, height:500, position:'absolute'}, animatedStyles[index]]} className='h-96 w-96' >
                            <Image
                                src={image}
                                alt="Show image" 
                                view="cover"
                            />
                        </Animated.View>
                    ))}
                </View>
            </Modal>
        <ScrollView horizontal={true}>
            <Row className='gap-x-2 p-2'>
            {images.map((image, index) => (
                  <Pressable key={'slide' + index} onPress={() => setShowImage(true)}>
                    <View className="w-28 h-48 rounded bg-primary/20 ">
                        <Image
                                view="cover"
                                
                                src={image}
                                alt="Show image" 
                            />
                    </View>
                  </Pressable>
            ))}
            </Row>
        </ScrollView>
    </View>);
}