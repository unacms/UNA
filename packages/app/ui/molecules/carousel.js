import { useState, useEffect } from 'react';
import { View, Pressable, Row } from 'app/design/view'
import Image from 'app/ui/atoms/image';
import { Button } from 'app/design/controls';
import { Modal } from 'react-native';
import ImageViewer from 'react-native-image-zoom-viewer';
import { Text } from 'app/design/typography';
import { Image as ImageOr } from 'react-native';

export default function ElementCarousel(props) {
    let data = props.data;
    if (data.length == 0)
        return <></>
    
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const [showImage, setShowImage] = useState(false);
    const [imageSize, setImageSize] = useState([0,0]);
    const [width, setWidth] = useState(400);


    const handleShowImage = (img) => {
        setShowImage(img);
    } 

    const handleLayout = (event) => {
        if (event.nativeEvent.layout.width != width)
            setWidth(event.nativeEvent.layout.width);
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
    data = data.slice(0,3);
    const len = data.length;
   
    let dataR1 = data.slice(0,2);
    let dataR2 = data.slice(2,4);
    if (len == 3){
        dataR1 = data.slice(0,1);
        dataR2 = data.slice(1,3);
    }
    const Image2 = (item) => (
        <View className='flex-auto h-full'><Pressable style={{
            flex: 1,
            justifyContent: 'center',
            }}    className=" " onPress={() => handleShowImage([item.src, 'image'])} >
                <Image sizes="384px" src={item.src} alt='' view="cover" className=" u-cover  dark:bg-bgritem-d dark:bg-bgritem-d gap-x-1 "    />
                {item.row == 1 && item.index== 1 && len > 4 && <View className='absolute z-50 w-full h-full text-center items-center justify-center'><Text className='text-5xl lg:text-7xl text-white'>+{len-4}</Text></View>} 
        </Pressable></View>
    );


    useEffect(() => {
        if (data.length === 1 && imageSize[0] === 0) {
            ImageOr.getSize(
            data[0].src,
            (width, height) => {
              setImageSize([width, height]);
            }
          );
        }
      }, [data, imageSize]);

    if (data.length == 1){
        
        if (imageSize[0] == 0){
            return <></>
        }
        let widthIm = width;
        let heightIm= widthIm/imageSize[0]*imageSize[1];
        if (heightIm > widthIm)
            heightIm = widthIm;
       

        return ( 
            <View className='px-0.5 sm:px-4 '>
                <ImViewer/>
                <View className="w-full gap-y-0.5 rounded sm:rounded-lg overflow-hidden " onLayout={handleLayout}>
                    <Row className='gap-x-0.5  ' style={{width:widthIm, height: heightIm}}>
                        <Image2 row ={0}  key={0} src={data[0].src}/>
                    </Row>
                </View>
            </View>
        )
    }
    return ( 
        <View className='px-0.5 sm:px-4 '>
            <ImViewer/>
            <View className="w-full  aspect-square gap-y-0.5 rounded sm:rounded-lg overflow-hidden " onLayout={handleLayout}>
                <Row className={(len > 2 ? 'h-1/2': 'h-full') + ' gap-x-0.5 w-full '}>
                {dataR1?.map((item, index) => (
                        <Image2 row ={0}  key={index} src={item.src}/>
                ))}
                </Row>
                <Row className={(len > 2 ? 'h-1/2 gap-y-0.5 ': 'h-full') + ' gap-x-0.5 w-full '}>
                    {
                    dataR2?.map((item, index) => (
                        <Image2 row ={1} key={index} index={index} src={item.src} />
                    )) }
                </Row>
            </View>
        </View>
    )
}