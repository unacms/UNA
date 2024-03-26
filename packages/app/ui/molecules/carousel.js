import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Pressable, Row } from 'app/design/view'
import Image from 'app/ui/atoms/image';
import { Button } from 'app/design/controls';
import { Modal } from "app/design/controls";
import { Text } from 'app/design/typography';
import { Image as ImageOr } from 'react-native';
import { useWindowDimensions } from 'react-native';

export default function ElementCarousel({ data = [] }) {
    if (!data.length) return null;

    const [currentImageIndex, setCurrentImageIndex] = useState(false);

    const [imageSize, setImageSize] = useState([0, 0]);
    const [imageSize2, setImageSize2] = useState([0, 0]);

    const [width, setWidth] = useState(400);

    const windowWidth = useWindowDimensions().width - 200;
    const windowHeight = useWindowDimensions().height - 200;

    const handleShowImage = useCallback((img) => {
        setCurrentImageIndex(img.index);
    }, []);

    const handleLayout = useCallback((event) => {
        if (event.nativeEvent.layout.width !== width)
            setWidth(event.nativeEvent.layout.width);
    }, [width]);

    useEffect(() => {
        if (currentImageIndex !== false) {
            ImageOr.getSize(
                data[currentImageIndex].src,
                (width, height) => {
                    let imageAspectRatio = width / height;
                    let windowAspectRatio = windowWidth / windowHeight;

                    let newImageWidth, newImageHeight;

                    if (imageAspectRatio > windowAspectRatio) {
                        newImageWidth = windowWidth;
                        newImageHeight = windowWidth / imageAspectRatio;
                    } else {
                        newImageHeight = windowHeight;
                        newImageWidth = windowHeight * imageAspectRatio;
                    }
                    setImageSize2([newImageWidth, newImageHeight]);
                }
            );
        }
    }, [currentImageIndex]);

    const Image2 = (item) => (
        <View className='flex-auto h-full border border-bdr dark:border-bdr-d'>
            <Pressable style={{
                flex: 1,
                justifyContent: 'center',
            }} className=" " onPress={() => handleShowImage(item)} >
                <Image sizes="384px" src={item.src} alt='' view="cover" className=" u-cover  dark:bg-bgritem-d dark:bg-bgritem-d gap-x-1 " />
                {item.row == 1 && item?.index2 == 1 && data.length > 3 && <View className='absolute z-50 w-full h-full text-center items-center justify-center'><Text className='text-5xl lg:text-7xl text-white'>+{data.length - 3}</Text></View>}
            </Pressable>
        </View>
    );

    const data2 = useMemo(() => data.slice(0, 3), [data]);
    const len = useMemo(() => data2.length, [data2]);

    const dataR1 = useMemo(() => (len === 3 ? data2.slice(0, 1) : data2.slice(0, 2)), [data2, len]);
    const dataR2 = useMemo(() => (len === 3 ? data2.slice(1, 3) : data2.slice(2, 4)), [data2, len]);

    useEffect(() => {
        if (data2.length === 1 && imageSize[0] === 0) {
            ImageOr.getSize(
                data2[0].src,
                (width, height) => {
                    setImageSize([width, height]);
                }
            );
        }
    }, [data2, imageSize]);


    const Gallery = React.memo(({ data2, imageSize, width, handleLayout }) => {
        if (data2.length == 1) {

            if (imageSize[0] == 0) {
                return <></>
            }
            let widthIm = width;
            let heightIm = widthIm / imageSize[0] * imageSize[1];
            if (heightIm > widthIm)
                heightIm = widthIm;


            return (
                <View className='px-0.5 sm:px-4 max-w-xs mx-auto'>
                    <View className="w-full gap-y-0.5 rounded sm:rounded-lg overflow-hidden " onLayout={handleLayout}>
                        <Row className='gap-x-0.5  ' style={{ width: widthIm, height: heightIm }}>
                            <Image2 row={0} index={0} key={0} src={data[0].src} />
                        </Row>
                    </View>
                </View>
            )
        }

        return (
            <View className='px-0.5 sm:px-4 '>
                <View className={(data.length == 2 ? "aspect-video" : "aspect-square") + " w-full max-w-sm  gap-y-0.5 rounded sm:rounded-lg overflow-hidden max-w-lg mx-auto"} onLayout={handleLayout}>
                    <Row className={(len > 2 ? 'h-1/2' : 'h-full') + ' gap-x-0.5 w-full '}>
                        {dataR1?.map((item, index) => (
                            <Image2 row={0} index={index} key={index} src={item.src} />
                        ))}
                    </Row>
                    <Row className={(len > 2 ? 'h-1/2 gap-y-0.5 ' : 'h-full') + ' gap-x-0.5 w-full '}>
                        {
                            dataR2?.map((item, index) => (
                                <Image2 row={1} index={dataR1.length + index} index2={index} key={index} src={item.src} />
                            ))}

                    </Row>
                </View>
            </View>
        )
    }, (prevProps, nextProps) => prevProps.data2 === nextProps.data2);

    return <>
        {currentImageIndex !== false && <Modal visible={currentImageIndex !== false} onClose={() => { setCurrentImageIndex(false) }} transparent={true} >
            <Row className=' w-full mx-auto items-center justify-center'>
                {
                    currentImageIndex > 0 ? <View className='mr-2'><Button variant="outline" size="sm" onPress={() => setCurrentImageIndex(currentImageIndex - 1)} startDecorator="ArrowLeft" /></View> : <View className='mr-1 w-10'></View>
                }
                {
                    imageSize2[0] > 0 && <Pressable style={{ width: imageSize2[0], height: imageSize2[1], maxWidth: windowWidth, maxHeight: windowHeight }} onPress={() => setCurrentImageIndex(false)}>
                        {currentImageIndex !== false && <Image width={imageSize2[0]} height={imageSize2[1]} sizes="(max-width:1280px) 100vw, 1280px" src={data[currentImageIndex].src} alt='' className=" u-cover  dark:bg-bgritem-d dark:bg-bgritem-d gap-x-1 " />}
                    </Pressable>
                }
                {
                    (currentImageIndex != data.length - 1) ? <View className='ml-2'><Button variant="outline" size="sm" onPress={() => setCurrentImageIndex(currentImageIndex + 1)} startDecorator="ArrowRight" /></View> : <View className='mr-1 w-10'></View>
                }
            </Row>
        </Modal>}
        <Gallery data2={data2} imageSize={imageSize} width={width} handleLayout={handleLayout} />
    </>
}