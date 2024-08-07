import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { View, Pressable, Row } from 'app/design/view'
import Image from 'app/ui/atoms/image';
import { Button } from 'app/design/controls';
import { Modal } from "app/design/controls";
import { Text } from 'app/design/typography';
import { Image as ImageOr } from 'react-native';
import { useWindowDimensions } from 'react-native';
import { appSetting } from 'app/lib/util'
import { Platform } from 'react-native'
import Video from 'app/ui/atoms/video';

const Carousel = memo(({ data = [] }) => {

    if (!data.length) return null;

    const isWeb = Platform.OS == 'web'
    const max_image_width = appSetting('layout', 'carousel_image_width');
    const max_image_aspect = appSetting('layout', 'carousel_image_aspect');

    const [currentImageIndex, setCurrentImageIndex] = useState(false);

    const [imageSize, setImageSize] = useState([0, 0]);
    const [imageSize2, setImageSize2] = useState([0, 0]);

    const [width, setWidth] = useState(400);

    const windowWidthOr = useWindowDimensions().width;
    const windowWidth = windowWidthOr - 200;
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

    const Image2 = (item) => {
        return (
            <View className={(item.len > 1 ? 'w-1/2' : 'w-full') + ' h-full border border-bdr dark:border-bdr-d bg-bgritem dark:bg-bgritem-d '}>
                <Pressable style={{ flex: 1, justifyContent: 'center' }} onPress={() => handleShowImage(item)} >
                    {item.type == 'image' ? ((item.width && item.height) ?
                        <Image sizes="1280px" src={item.src} alt='' height={item.height} width={item.width} className=" u-cover dark:bg-bgritem-d dark:bg-bgritem-d gap-x-1 " /> :
                        <Image sizes="1280px" src={item.src} alt='' view="cover" className=" u-cover dark:bg-bgritem-d dark:bg-bgritem-d gap-x-1 " />
                    ) : <Video cover={true} src={item.src} controls={false} muted={"muted"} autoplay={"autoplay"}/>}

                    {item.row == 1 && item?.index2 == 1 && data.length > 3 && <View className='absolute z-50 w-full h-full text-center items-center justify-center'><Text className='text-5xl lg:text-7xl text-white'>+{data.length - 3}</Text></View>}
                </Pressable>
            </View>
        )
    };

    const data2 = useMemo(() => data.slice(0, 3), [data]);
    const len = useMemo(() => data2.length, [data2]);

    const dataR1 = useMemo(() => (len === 3 ? data2.slice(0, 1) : data2.slice(0, 2)), [data2, len]);
    const dataR2 = useMemo(() => (len === 3 ? data2.slice(1, 3) : data2.slice(2, 4)), [data2, len]);

    const Gallery = React.memo(({ data2, imageSize, width, handleLayout }) => {
        if (data2.length == 1) {

            // back compability for old data
            if (!data[0].height || !data[0].width) {
                return (
                    <View className={`${max_image_width} mx-auto ${max_image_aspect} w-full 005`}>
                        <Image2 row={0} index={0} key={0}  src={data[0].src} type={data[0].type} />
                    </View>
                )
            }
            // back compability for old data

            let aspect = max_image_aspect;
            let aspectStyle = '';
            let w = Number(data[0].width);
            let h = Number(data[0].height);
            if (w && h && (w > h)) {
                aspect = '';
                if (isWeb) {
                    /*bg-neutral-200  dark:bg-neutral-600*/
                    return (<View className={`${max_image_width} ${aspect} w-full max-w-lg  items-start justify-center  rounded sm:rounded-lg 003-` + w + '-' + h + '-' + (w > h)}>
                        <View style={{ aspectRatio: aspectStyle }} className='h-full'>
                            <Image2 row={0} index={0} key={0} width={w} height={h} src={data[0].src} type={data[0].type} />
                        </View>
                    </View>)
                }
                aspectStyle = w / h;
                if (w > (windowWidthOr - 20)) {
                    h = (windowWidthOr - 20) / w * h
                    w = windowWidthOr - 20;

                }

                return (
                    /*bg-neutral-200  dark:bg-neutral-600*/
                    <View className={`${max_image_width}  ${aspect} w-full max-w-lg items-start justify-center rounded sm:rounded-lg 002`}>
                        <View style={{ aspectRatio: aspectStyle, width: w, height: h }} >
                            <Image2 row={0} index={0} key={0} src={data[0].src} type={data[0].type} />
                        </View>
                    </View>
                )
            }
            else {
                aspectStyle = w / h;
                h = "";
                w = "";
                return (
                    /*bg-neutral-200  dark:bg-neutral-600*/
                    <View className={`${max_image_width}  ${aspect} w-full max-w-lg items-start justify-center ounded sm:rounded-lg 001`}>
                        <View style={{ aspectRatio: aspectStyle }} className='h-full '>
                            <Image2 row={0} index={0} key={0} width={w} height={h} src={data[0].src} type={data[0].type} />
                        </View>
                    </View>
                )
            }

        }

        return (
            <View className={(data.length == 2 ? "aspect-video" : "aspect-square") + " w-full " + max_image_width + " gap-y-0.5 rounded sm:rounded-lg overflow-hidden mx-auto "}>
                <Row className={(len > 2 ? 'h-1/2' : 'h-full') + ' gap-x-0.5 w-full '}>
                    {dataR1?.map((item, index) => (
                        <Image2 len={dataR1.length} row={0} index={index} key={index} src={item.src} type={item.type} />
                    ))}
                </Row>
                <Row className={(len > 2 ? 'h-1/2 gap-y-0.5 ' : 'h-full') + ' gap-x-0.5 w-full '}>
                    {
                        dataR2?.map((item, index) => (
                            <Image2 len={dataR2.length} row={1} index={dataR1.length + index} index2={index} key={index} src={item.src} type={item.type} />
                        ))}

                </Row>
            </View>
        )
    }, (prevProps, nextProps) => prevProps.data2 === nextProps.data2);

    return <>
        {currentImageIndex !== false && <Modal title="Viewer" visible={currentImageIndex !== false} onClose={() => { setCurrentImageIndex(false) }} transparent={true} >
            <Row className=' w-full mx-auto items-center justify-center'>

                {
                    (imageSize2[0] > 0 && data[currentImageIndex].type == 'image') && <Pressable style={{ width: imageSize2[0], height: imageSize2[1], maxWidth: windowWidth, maxHeight: windowHeight }} onPress={() => setCurrentImageIndex(false)}>
                        {currentImageIndex !== false && <Image width={imageSize2[0]} height={imageSize2[1]} sizes="(max-width:1280px) 100vw, 1280px" src={data[currentImageIndex].src} alt='' className=" u-cover  dark:bg-bgritem-d dark:bg-bgritem-d gap-x-1 " />}
                    </Pressable>
                }
                {
                    data[currentImageIndex].type == 'video' && <Pressable onPress={() => setCurrentImageIndex(false)}><View className='aspect-video max-w-xl' style={{ width: windowWidthOr }}><Video autoplay="autoplay" muted={false} controls={true} src={data[currentImageIndex].src} /></View></Pressable>
                }

            </Row>
            <Row className='mt-4 items-center justify-center w-full'>
                {
                    currentImageIndex > 0 ? <View className='mr-2'><Button variant="outline" size="sm" onPress={() => setCurrentImageIndex(currentImageIndex - 1)} startDecorator="ArrowLeft" /></View> : <View className='mr-1 w-10'></View>
                }
                {
                    (currentImageIndex != data.length - 1) ? <View className='ml-2'><Button variant="outline" size="sm" onPress={() => setCurrentImageIndex(currentImageIndex + 1)} startDecorator="ArrowRight" /></View> : <View className='mr-1 w-10'></View>
                }
            </Row>
        </Modal>}
        <View className='w-full max-w-3xl mx-auto'>
            <Gallery data2={data2} imageSize={imageSize} width={width} handleLayout={handleLayout} />
        </View>
        
    </>
});

export default Carousel;
