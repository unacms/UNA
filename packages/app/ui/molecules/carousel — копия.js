
import { useState, useRef } from 'react';
import Carousel from "react-native-reanimated-carousel";
import { View, Pressable } from 'app/design/view'

import Image from '../../ui/atoms/image';

import Animated, {
    Extrapolate,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
  } from "react-native-reanimated";
  import { Button } from 'app/design/controls';
  import { Modal } from 'react-native';
  import ImageViewer from 'react-native-image-zoom-viewer';
  

export default function ElementCarousel(props) {
    const carouselRef = useRef();

    let data = props.data;
    if (data.length == 0)
        return <></>

    const progressValue = useSharedValue(0);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

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
          <View className='bg-bgrcard dark:bg-bgrcard-d'
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

    const data2 = data.map(item => ({url: item.src}));  

    const ImViewer = () => (
      <Modal visible={!!showImage} transparent={true}>
        <ImageViewer 
          index={currentImageIndex}
          imageUrls={data2} 
          renderArrowLeft={() => (
            currentImageIndex == 0 ? null : <Button
              variant="text"
              size='xl'
              startDecorator="ArrowCircleLeft"
              onPress={() => setCurrentImageIndex((prevIndex) => prevIndex > 0 ? prevIndex - 1 : prevIndex)}
            />
          )}
          renderArrowRight={() => (
              currentImageIndex == data2.length - 1 ? null : <Button
              variant="text"
              size='xl'
              startDecorator="ArrowCircleRight"
              onPress={() => setCurrentImageIndex((prevIndex) => prevIndex < data2.length - 1 ? prevIndex + 1 : prevIndex)}
            />
          )}
          onClick={() => {setShowImage(null)}}
        />
      </Modal>
    );

    if (data.length == 1)
      return (<>
        <Modal visible={!!showImage} transparent={true}><ImageViewer imageUrls={data2} onClick={() => {setShowImage(null)}}/></Modal>
        <View className="w-full mx-auto aspect-video mb-0" onLayout={handleLayout}>
        <Pressable style={{
                        flex: 1,
                        justifyContent: 'center',
                    }} className=" mt-1 " onPress={() => handleShowImage([data[0].src, 'image'])} ><Image sizes="384px" src={data[0].src} alt='' view="cover" className=" u-cover rounded-lg dark:bg-bgrcard-d border-bdr dark:border-bdr-dark border rounded-lg"  /></Pressable>
        </View>
        </>);
    
    
    return ( 
        <View className='bg-bgritem dark:bg-bgritem-dark pb-4 mb-2'>
        <ImViewer/>
        <View className="w-full aspect-video " onLayout={handleLayout}>
            
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
                    }} key={index} className=" mt-1 " onPress={() => handleShowImage([item.src, 'image'])} ><Image sizes="384px" src={item.src} alt='' view="cover" className=" u-cover rounded-lg dark:bg-bgrcard-d border-bdr dark:border-bdr-dark border rounded-lg"  /></Pressable>
                    
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