import React, { useCallback, useState, useRef, useContext } from 'react';
import Carousel from "react-native-reanimated-carousel";
import { Dimensions} from 'react-native';
import { View, Pressable, Row } from 'app/design/view'
import { Text } from 'app/design/typography'
import Image from '../../ui/atoms/image';
import { Modal } from 'app/design/controls'
import Animated, {
    Extrapolate,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
  } from "react-native-reanimated";
  import { Button } from 'app/design/controls';

  

export default function ElementCarousel(props) {

    const carouselRef = useRef();


    let data = props.data;
    const progressValue = useSharedValue(0);

    const height = Dimensions.get('window').height;

    const [showImage, setShowImage] = useState(false);
    const [width, setWidth] = useState(400);

    const handleShowImage = (img) => {
        setShowImage(img);
    } 

    const handleLayout = (event) => {
        setWidth(event.nativeEvent.layout.width);
    };

    const nextSlide = () => {
        
        carouselRef.current.next();
    };
    
    const prevSlide = () => {
        carouselRef.current.prev();
    };

    const PaginationItem = (props) => {
        const { animValue, index, length, backgroundColor, isRotate } = props;
        const width = 10;
      
        const animStyle = useAnimatedStyle(() => {
          let inputRange = [index - 1, index, index + 1];
          let outputRange = [-width, 0, width];
      
          if (index === 0 && animValue?.value > length - 1) {
            inputRange = [length - 1, length, length + 1];
            outputRange = [-width, 0, width];
          }
      
          return {
            transform: [
              {
                translateX: interpolate(
                  animValue?.value,
                  inputRange,
                  outputRange,
                  Extrapolate.CLAMP,
                ),
              },
            ],
          };
        }, [animValue, index, length]);
        return (
          <View className='bg-bordercolortabbar dark:bg-bordercolortabbar-dark'
            style={{
              width,
              height: width,
              borderRadius: 50,
              
              overflow: "hidden",
              transform: [
                {
                  rotateZ: isRotate ? "90deg" : "0deg",
                },
              ],
            }}
          >
            <Animated.View
              style={[
                {
                  borderRadius: 50,
                  backgroundColor: 'blue',
                  flex: 1,
                },
                animStyle,
              ]}
            />
          </View>
        );
      };  


    if (data.length == 0)
        return <></>

    return ( 
        <View className='bg-neutral-200 dark:bg-neutral-800 pb-4'>
        <View className="w-full aspect-video " onLayout={handleLayout}>
            <Modal id={'file-preview'} title="Preview title" onVisible={!!showImage} onClose={() => {setShowImage(null)}}>
                <View className="w-full h-screen" style={{height:height - 100}} >
                    {!!showImage && showImage[1] == 'image' && <Image className="w-full h-full" src={showImage[0]} alt='' view="cover" />}
                </View>
            </Modal>
            { data.length > 1 && <>
                <View className='absolute top-1/2 z-50 -mt-8 left-0'>
                    <Button onPress={prevSlide} variant="text" size='xl' startDecorator="ArrowCircleLeft" />
                </View>
                <View className='absolute top-1/2 right-0 z-50 -mt-8 '>
                    <Button onPress={nextSlide} variant="text" size='xl' startDecorator="ArrowCircleRight" />
                </View>
            </>
            }
            <Carousel
                ref={carouselRef}
                loop
                width={width}
                height={width / 16*9}
                autoPlay={false}
                data={data}
                mode="parallax"
                modeConfig={{
                  parallaxScrollingScale: 0.9,
                  parallaxScrollingOffset: 100,
                }}
                customConfig={{viewCount: 2}}
                scrollAnimationDuration={1000}
                pagingEnabled={true}
                onProgressChange={(_, absoluteProgress) =>
                    (progressValue.value = absoluteProgress)
                }
                renderItem={({ item, index }) => (
                    <Pressable style={{
                        flex: 1,
                        justifyContent: 'center',
                    }} key={index} className=" mt-1 " onPress={() => handleShowImage([item.src, 'image'])} ><Image sizes="384px" src={item.src} alt='' view="cover" className=" u-cover rounded-lg dark:bg-neocard-dark border-neoborder dark:border-neoborder-dark border rounded-lg"  /></Pressable>
                    
                )}
            />
             
        </View>
        {!!progressValue && (
        <View
          style={
           {
                flexDirection: "row",
                justifyContent: "space-between",
                width: 100,
                alignSelf: "center",
              }
          }
        >
          {data.map((backgroundColor, index) => {
            return (
              <PaginationItem
                backgroundColor={backgroundColor}
                animValue={progressValue}
                index={index}
                key={index}
                isRotate={false}
                length={data.length}
              />
            );
          })}
        </View>
      )}
        </View>
  )
}