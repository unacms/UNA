import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { View, Pressable, Row, ScrollView } from 'app/design/view'
import Image from 'app/ui/atoms/image';
import { Modal, Button } from "app/design/controls";
import { Text } from 'app/design/typography';
import { Image as ImageOr, useWindowDimensions,Platform } from 'react-native';
import { appSetting, LAYOUT_BREAKPOINTS } from 'app/lib/util'
import Video from 'app/ui/atoms/video';
import { ReactNativeZoomableView } from '@openspacelabs/react-native-zoomable-view';

const Image2 = memo((item) => {

    const handlePress = useCallback(() => item.handleShowImage(item), [item]);

    return (
        <View className={(item.len > 1 ? 'w-1/2' : 'w-full') + ' h-full bg-bgritem dark:bg-bgritem-d '}>
            <Pressable style={{ flex: 1, justifyContent: 'center' }} onPress={handlePress} >
                {item.type == 'image' ? ((item.width && item.height) ?
                    <Image sizes={LAYOUT_BREAKPOINTS.xl} src={item.src} alt='' height={item.height} width={item.width} className=" u-cover dark:bg-bgritem-d dark:bg-bgritem-d gap-x-1 " /> :
                    <Image sizes={LAYOUT_BREAKPOINTS.xl} src={item.src} alt='' view="cover" className=" u-cover dark:bg-bgritem-d dark:bg-bgritem-d gap-x-1 " />
                ) : <Video cover={true} src={item.src} controls={false} muted={"muted"} autoplay={"autoplay"} />}

                {item.row == 1 && item?.index2 == 1 && item.data.length > 3 && <View className='absolute z-50 w-full h-full text-center items-center justify-center'><Text className='text-5xl lg:text-7xl text-white'>+{item.data.length - 3}</Text></View>}
            </Pressable>
        </View>
    )
});


const Gallery = React.memo(({ data, handleShowImage, windowWidthOr }) => {
    const data2 = useMemo(() => data.slice(0, 3), [data]);
    const len = useMemo(() => data2.length, [data2]);
    const dataR1 = useMemo(() => (len === 3 ? data2.slice(0, 1) : data2.slice(0, 2)), [data2, len]);
    const dataR2 = useMemo(() => (len === 3 ? data2.slice(1, 3) : data2.slice(2, 4)), [data2, len]);
    const isWeb = Platform.OS == 'web'
    const max_image_width = appSetting('carousel', 'image_width');
    const max_image_aspect = appSetting('carousel', 'image_aspect_ratio');

    if (data2.length == 1) {

        // back compability for old data
        if (!data[0].height || !data[0].width) {
            return (
                <View className={`${max_image_width} mx-auto ${max_image_aspect} w-full rounded-lg overflow-hidden 005`}>
                    <Image2 handleShowImage={handleShowImage} data={data} row={0} index={0} key={0} src={data[0].src} type={data[0].type} />
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
                return (<View className={`${max_image_width} ${aspect} w-full items-start justify-center  rounded-lg  overflow-hidden 003-` + w + '-' + h + '-' + (w > h)}>
                    <View style={{ aspectRatio: aspectStyle }} className='h-full'>
                        <Image2 handleShowImage={handleShowImage} data={data} row={0} index={0} key={0} width={w} height={h} src={data[0].src} type={data[0].type} />
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
                <View className={`${max_image_width}  ${aspect} w-full items-start justify-center  002`}>
                    <View className='rounded-lg overflow-hidden' style={{ aspectRatio: aspectStyle, width: w, height: h }} >
                        <Image2 handleShowImage={handleShowImage} data={data} row={0} index={0} key={0} src={data[0].src} type={data[0].type} />
                    </View>
                </View>
            );
        }
        else {
            aspectStyle = w / h;
            h = undefined;
            w = undefined;
            return (
                /*bg-neutral-200  dark:bg-neutral-600*/
                <View className={`${max_image_width}  ${aspect} w-full items-center justify-center bg-bgritem dark:bg-bgritem-d rounded-lg overflow-hidden`}>
                    <View style={{ aspectRatio: aspectStyle }} className='h-full'>
                        <Image2 handleShowImage={handleShowImage} data={data} row={0} index={0} key={0} width={w} height={h} src={data[0].src} type={data[0].type} />
                    </View>
                </View>
            );
        }

    }

    return (
        <View className={(data.length == 2 ? "aspect-video" : "aspect-square") + " w-full " + max_image_width + " gap-y-0.5 rounded sm:rounded-lg overflow-hidden mx-auto "}>
            <Row className={(len > 2 ? 'h-1/2' : 'h-full') + ' gap-x-0.5 w-full '}>
                {dataR1?.map((item, index) => (
                    <Image2 handleShowImage={handleShowImage} data={data} len={dataR1.length} row={0} index={index} key={index} src={item.src} type={item.type} />
                ))}
            </Row>
            <Row className={(len > 2 ? 'h-1/2 gap-y-0.5 ' : 'h-full') + ' gap-x-0.5 w-full '}>
                {
                    dataR2?.map((item, index) => (
                        <Image2 handleShowImage={handleShowImage} data={data} len={dataR2.length} row={1} index={dataR1.length + index} index2={index} key={index} src={item.src} type={item.type} />
                    ))}

            </Row>
        </View>
    )
}, (prevProps, nextProps) => prevProps.data2 === nextProps.data2);

const Carousel = memo(({ data = [] }) => {
    if (!data.length) return null;

    const [currentImageIndex, setCurrentImageIndex] = useState(false);
    const [imageSize, setImageSize] = useState([0, 0]);
    const [imageSize2, setImageSize2] = useState([0, 0]);

    const [width, setWidth] = useState(400);

    const windowDimensions = useWindowDimensions();
    const windowWidthOr = windowDimensions.width;
    const windowHeightOr = windowDimensions.height;

    const handleShowImage = useCallback((img) => {
        setCurrentImageIndex(img.index);
    }, []);

    const handleLayout = useCallback((event) => {
        if (event.nativeEvent.layout.width !== width)
            setWidth(event.nativeEvent.layout.width);
    }, [width]);

    const offset = useMemo(() => (windowWidthOr > 672 ? 60 : Platform.OS === 'ios' ? 120 : 60), [windowWidthOr]);

    useEffect(() => {
        if (currentImageIndex !== false) {
            ImageOr.getSize(
                data[currentImageIndex].src,
                (width, height) => {
                    let imageAspectRatio = width / height;
                    let ww = windowWidthOr > 672 ? 672 : windowWidthOr;
                    let wh = windowHeightOr - (offset);

                    let newImageWidth, newImageHeight;
                    //  let wh = windowWidthOr * wh1/ww;
                    let windowAspectRatio = ww / wh;

                    if (false) {

                        if (imageAspectRatio > windowAspectRatio) {
                            newImageWidth = ww;
                            newImageHeight = ww / imageAspectRatio;
                        } else {
                            newImageHeight = wh;
                            newImageWidth = wh * imageAspectRatio;
                        }
                    }
                    else {
                        newImageWidth = ww;
                        newImageHeight = newImageWidth * height / width
                    }
                    setImageSize2([newImageWidth, newImageHeight]);
                }
            );
        }
    }, [currentImageIndex]);

    return <>
        {currentImageIndex !== false && <Modal padding="" title="Viewer" onVisible={currentImageIndex !== false} onClose={() => { setCurrentImageIndex(false) }} transparent={true} >
            <Row className=' w-full mx-auto items-center justify-center h-full'>
                {
                    (imageSize2[0] > 0 && data[currentImageIndex].type == 'image') && (
                        <ScrollView style={{ height: windowHeightOr - offset }}>
                            <Pressable style={{ width: imageSize2[0], height: imageSize2[1] }} onPress={() => setCurrentImageIndex(false)}>
                                {currentImageIndex !== false && (
                                       <ReactNativeZoomableView
                                       maxZoom={30}
                                       // Give these to the zoomable view so it can apply the boundaries around the actual content.
                                       // Need to make sure the content is actually centered and the width and height are
                                       // dimensions when it's rendered naturally. Not the intrinsic size.
                                       // For example, an image with an intrinsic size of 400x200 will be rendered as 300x150 in this case.
                                       // Therefore, we'll feed the zoomable view the 300x150 size.
                                       contentWidth={300}
                                       contentHeight={150}
                                     >
                                    <Image view='cover' sizes={LAYOUT_BREAKPOINTS.xl} src={data[currentImageIndex].src} alt='' className=" u-cover  dark:bg-bgritem-d dark:bg-bgritem-d gap-x-1 " />
                                    </ReactNativeZoomableView>
                                )}
                                <Row className='absolute w-full -mt-4 top-1/2 items-center justify-between w-full px-4'>
                                    {
                                        currentImageIndex > 0 ? <Button variant="default" rounded size="base" onPress={() => setCurrentImageIndex(currentImageIndex - 1)} startDecorator="ArrowLeft" /> : <View className='mr-1 w-10'></View>
                                    }
                                    {
                                        (currentImageIndex != data.length - 1) ? <Button variant="default" rounded size="base" onPress={() => setCurrentImageIndex(currentImageIndex + 1)} startDecorator="ArrowRight" /> : <View className='mr-1 w-10'></View>
                                    }
                                </Row>
                            </Pressable>
                        </ScrollView>
                    )
                }
                {
                    data[currentImageIndex].type == 'video' && <Pressable onPress={() => setCurrentImageIndex(false)}><View className='aspect-video max-w-xl' style={{ width: windowWidthOr }}><Video autoplay="autoplay" muted={false} controls={true} src={data[currentImageIndex].src} /></View></Pressable>
                }

            </Row>

        </Modal>}
        <View className='w-full mx-auto px-1'>
            <Gallery windowWidthOr={windowWidthOr} data={data} handleShowImage={handleShowImage} />
        </View>

    </>
});

export default Carousel;
