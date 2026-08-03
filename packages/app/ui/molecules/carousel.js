import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { View, Pressable, Row } from 'app/design/view'
import Image from 'app/ui/atoms/image';
import { Modal, Button, NeoButton } from "app/design/controls";
import { Text } from 'app/design/typography';
import { Image as ImageOr, Platform } from 'react-native';
import { appSetting, LAYOUT_BREAKPOINTS } from 'app/lib/util'
import Video from 'app/ui/atoms/video';
import { ReactNativeZoomableView } from '@openspacelabs/react-native-zoomable-view';
import { useWindowSize } from 'app/context/measure';

const Image2 = memo((item) => {

    const handlePress = useCallback(() => item.handleShowImage(item), [item]);

    return (
        <View className={(item.len > 1 ? 'w-1/2' : 'w-full') + ' h-full bg-muted  '}>
            <Pressable style={{ flex: 1, justifyContent: 'center' }} onPress={handlePress} >
                {item.type == 'image' ? ((item.width && item.height) ?
                    <Image sizes={LAYOUT_BREAKPOINTS.xl} src={item.src} alt='' height={item.height} width={item.width} className=" u-cover   gap-x-1 " /> :
                    <Image sizes={LAYOUT_BREAKPOINTS.xl} src={item.src} alt='' view="cover" className=" u-cover   gap-x-1 " />
                ) : <Video cover={true} src={item.src} controls={false} muted={"muted"} autoplay={"autoplay"} />}

                {item.row == 1 && item?.index2 == 1 && item.data.length > 3 && <View className='absolute z-50 w-full h-full text-center items-center justify-center'><Text className='text-5xl lg:text-7xl text-white'>+{item.data.length - 3}</Text></View>}
            </Pressable>
        </View>
    )
});


const Gallery = React.memo(({ data, handleShowImage, windowWidthOr, containerWidth }) => {
    const data2 = useMemo(() => data.slice(0, 3), [data]);
    const len = useMemo(() => data2.length, [data2]);
    const dataR1 = useMemo(() => (len === 3 ? data2.slice(0, 1) : data2.slice(0, 2)), [data2, len]);
    const dataR2 = useMemo(() => (len === 3 ? data2.slice(1, 3) : data2.slice(2, 4)), [data2, len]);
    const isWeb = Platform.OS == 'web'
    const max_image_width = appSetting('carousel', 'image_width');
    const max_image_aspect = appSetting('carousel', 'image_aspect_ratio');
    // Prefer measured container width (e.g. messenger max-w-xs) over full window
    const availableWidth = containerWidth > 0 ? containerWidth : Math.max((windowWidthOr || 0) - 20, 0);

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
                /*bg-secondary  */
                return (<View className={`${max_image_width} ${aspect} w-full items-start justify-center  rounded-lg  overflow-hidden 003-` + w + '-' + h + '-' + (w > h)}>
                    <View style={{ aspectRatio: aspectStyle }} className='h-full'>
                        <Image2 handleShowImage={handleShowImage} data={data} row={0} index={0} key={0} width={w} height={h} src={data[0].src} type={data[0].type} />
                    </View>
                </View>)
            }
            aspectStyle = w / h;
            if (availableWidth > 0 && w > availableWidth) {
                h = availableWidth / w * h;
                w = availableWidth;
            }

            return (
                /*bg-secondary  */
                <View className={`${max_image_width}  ${aspect} w-full items-start justify-center rounded-lg overflow-hidden 002`}>
                    <View className='rounded-lg overflow-hidden max-w-full' style={{ aspectRatio: aspectStyle, width: w }} >
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
                /*bg-secondary  */
                <View className={`${max_image_width}  ${aspect} w-full items-center justify-center bg-muted  rounded-lg overflow-hidden`}>
                    <View style={{ aspectRatio: aspectStyle }} className='h-full max-w-full'>
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
});

function CarouselContent({ data }) {
    const [currentImageIndex, setCurrentImageIndex] = useState(false);
    const [imageSize2, setImageSize2] = useState([0, 0]);
    const [viewerSize, setViewerSize] = useState({ width: 0, height: 0 });
    const [containerWidth, setContainerWidth] = useState(0);

    const { width: windowWidthOr, height: windowHeightOr } = useWindowSize();
    const isWeb = Platform.OS === 'web';
    // Prefer measured modal content size; fall back to window (needed on desktop web where Modal height is auto).
    const lightboxWidth = (viewerSize.width > 0 ? viewerSize.width : windowWidthOr) || 0;
    const lightboxHeight = (viewerSize.height > 0 ? viewerSize.height : windowHeightOr) || 0;

    const handleShowImage = useCallback((img) => {
        setImageSize2([0, 0]);
        setCurrentImageIndex(img.index);
    }, []);

    const handleLayout = useCallback((event) => {
        const nextWidth = event.nativeEvent.layout.width;
        setContainerWidth((prev) => (prev !== nextWidth ? nextWidth : prev));
    }, []);

    const handleViewerLayout = useCallback((event) => {
        const { width, height } = event.nativeEvent.layout;
        setViewerSize((prev) =>
            prev.width === width && prev.height === height ? prev : { width, height }
        );
    }, []);

    useEffect(() => {
        if (currentImageIndex === false) return;

        const item = data[currentImageIndex];
        if (!item || item.type !== 'image') return;

        const ww = lightboxWidth;
        const wh = lightboxHeight;
        if (!ww || !wh) return;

        ImageOr.getSize(item.src, (width, height) => {
            if (!width || !height) return;

            const imageAspectRatio = width / height;
            const viewerAspectRatio = ww / wh;

            let newImageWidth;
            let newImageHeight;
            if (imageAspectRatio > viewerAspectRatio) {
                newImageWidth = ww;
                newImageHeight = ww / imageAspectRatio;
            } else {
                newImageHeight = wh;
                newImageWidth = wh * imageAspectRatio;
            }
            setImageSize2([newImageWidth, newImageHeight]);
        });
    }, [currentImageIndex, data, lightboxWidth, lightboxHeight]);

    const viewerStyle = isWeb && windowHeightOr > 0
        ? { height: windowHeightOr, minHeight: windowHeightOr, width: '100%' }
        : { flex: 1, width: '100%' };

    return <>
        {currentImageIndex !== false && (
            <Modal
                padding=""
                maxWidth="max-w-full"
                skipUnsavedGuard
                onVisible={currentImageIndex !== false}
                onClose={() => setCurrentImageIndex(false)}
            >
                <View
                    className="relative w-full h-full flex-1 items-center justify-center overflow-hidden"
                    style={viewerStyle}
                    onLayout={handleViewerLayout}
                >
                    <View className="absolute right-3 top-3 z-50">
                        <NeoButton
                            style="bordered"
                            controlSize="regular"
                            borderShape="circle"
                            image="X"
                            accessibilityLabel="Close"
                            onPress={() => setCurrentImageIndex(false)}
                        />
                    </View>

                    {imageSize2[0] > 0 && data[currentImageIndex].type === 'image' ? (
                        <Pressable
                            style={{
                                width: lightboxWidth || '100%',
                                height: lightboxHeight || '100%',
                                justifyContent: 'center',
                                alignItems: 'center',
                                overflow: 'hidden',
                            }}
                            onPress={() => setCurrentImageIndex(false)}
                        >
                            <ReactNativeZoomableView
                                maxZoom={30}
                                contentWidth={imageSize2[0]}
                                contentHeight={imageSize2[1]}
                                style={{
                                    width: lightboxWidth || undefined,
                                    height: lightboxHeight || undefined,
                                }}
                            >
                                <Image
                                    width={imageSize2[0]}
                                    height={imageSize2[1]}
                                    sizes={LAYOUT_BREAKPOINTS.xl}
                                    src={data[currentImageIndex].src}
                                    alt=""
                                    nobg
                                    contentFit="contain"
                                />
                            </ReactNativeZoomableView>
                        </Pressable>
                    ) : null}

                    {data[currentImageIndex].type === 'video' ? (
                        <Pressable
                            style={{
                                width: lightboxWidth || '100%',
                                height: lightboxHeight || '100%',
                            }}
                            onPress={() => setCurrentImageIndex(false)}
                        >
                            <Video
                                fill
                                autoplay="autoplay"
                                muted={false}
                                controls={true}
                                src={data[currentImageIndex].src}
                            />
                        </Pressable>
                    ) : null}

                    {data[currentImageIndex].type === 'image' ? (
                        <Row style={{ pointerEvents: 'box-none' }} className="absolute inset-x-0 top-1/2 -mt-4 items-center justify-between px-4">
                            {currentImageIndex > 0 ? (
                                <Button
                                    variant="default"
                                    rounded
                                    size="base"
                                    onPress={() => {
                                        setImageSize2([0, 0]);
                                        setCurrentImageIndex(currentImageIndex - 1);
                                    }}
                                    startDecorator="ArrowLeft"
                                />
                            ) : (
                                <View className="w-10" />
                            )}
                            {currentImageIndex !== data.length - 1 ? (
                                <Button
                                    variant="default"
                                    rounded
                                    size="base"
                                    onPress={() => {
                                        setImageSize2([0, 0]);
                                        setCurrentImageIndex(currentImageIndex + 1);
                                    }}
                                    startDecorator="ArrowRight"
                                />
                            ) : (
                                <View className="w-10" />
                            )}
                        </Row>
                    ) : null}
                </View>
            </Modal>
        )}
        <View className="w-full mx-auto overflow-hidden" onLayout={handleLayout}>
            <Gallery windowWidthOr={windowWidthOr} containerWidth={containerWidth} data={data} handleShowImage={handleShowImage} />
        </View>
    </>
}

const Carousel = memo(({ data = [] }) => {
    if (!data.length) return null;

    return <CarouselContent data={data} />;
});

export default Carousel;
