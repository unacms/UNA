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
        'https://ci.una.io/test3/s/bx_posts_photos_resized/cq6im7k8qqbbqq38ycjplybjwtx9m8an.webp',
        'https://ci.una.io/test3/s/bx_posts_photos_resized/vbcykn7wncy6vqjbfzfakc5rvryfj2ys.jpg',
        'https://ci.una.io/test3/s/bx_posts_photos_resized/cq6im7k8qqbbqq38ycjplybjwtx9m8an.webp',
        'https://ci.una.io/test3/s/bx_posts_photos_resized/vbcykn7wncy6vqjbfzfakc5rvryfj2ys.jpg'
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
        <View className="w-full h-48 bg-red-500">
            <Modal onVisible={!!showImage} onClose={() => {setShowImage(null)}}>
                <View className='h-4 w-full  flex-row gap-x-2'>
                    {images.map((image, index) => (
                        <View className='h-3 w-1/4 bg-green-500'><Animated.View style={[{height:12, position:'absolute', backgroundColor:'orange'}, animatedStyles2[index]]} className='h-96 w-96' >
                           
                        </Animated.View></View>
                    ))}
                </View>
                <View className='h-96 w-96' >
                    {images.map((image, index) => (
                        <Animated.View style={[{width:500, height:500, position:'absolute'}, animatedStyles[index]]} className='h-96 w-96' >
                            <Image
                                key={index}
                                src={image}
                                alt="cxv" 
                                view="cover"
                            />
                        </Animated.View>
                    ))}
                </View>
            </Modal>
        <ScrollView horizontal={true}>
            <Row>
            <Pressable onPress={() => setShowImage(true)}>
            <View className="w-24 h-24 bg-blue-500 m-2">
            </View>
            </Pressable>
            <View className="w-24 h-24 bg-blue-500 m-2">
            </View>
            <View className="w-24 h-24 bg-blue-500 m-2">
            </View>
            <View className="w-24 h-24 bg-blue-500 m-2">
            </View>
            <View className="w-24 h-24 bg-blue-500 m-2">
            </View>
            <View className="w-24 h-24 bg-blue-500 m-2">
            </View>
            <View className="w-24 h-24 bg-blue-500 m-2">
            </View>
            <View className="w-24 h-24 bg-blue-500 m-2">
            </View>
            <View className="w-24 h-24 bg-blue-500 m-2">
            </View>
            <View className="w-24 h-24 bg-blue-500 m-2">
            </View>
            </Row>
        </ScrollView>
    </View>);
}