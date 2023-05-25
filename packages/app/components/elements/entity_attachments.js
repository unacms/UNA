import { View, Row, Pressable } from 'app/design/view';
import { useState } from 'react';
import Image from '../../ui/atoms/image';
import { Text, H2 } from 'app/design/typography';
import Link from '../../ui/atoms/link';
import { Modal } from 'app/design/controls'
import Video from '../../ui/atoms/video';

export default function ElementEntityAttachments(props) {
    let aImages = [];
    const [showImage, setShowImage] = useState(false);

    const handleShowImage = (img) => {
        setShowImage(img);
    } 
    props.data.forEach(function (item, index) { 

        if (item.type == 'image'){
            aImages.push(getImage(item.data, index));
        }
        else if(item.type == 'video'){
            aImages.push(getVideo(item.data, index));
        }
        else{
            aImages.push(getLink(item, index));
        }
    });

    if (aImages.length == 0)
        return <></>
    
    return (
        <>
            <Modal id={'file-preview'} title="Preview title" onVisible={!!showImage} onClose={() => {setShowImage(null)}}>
                <View className="w-full h-64 lg:h-96" >
                    {showImage && showImage[1] == 'image' && <Image className="w-full h-full" src={showImage[0]} alt='' view="cover" />}
                    {showImage && showImage[1] == 'video' && <Video className="w-full h-full" src={showImage[0]}  ></Video>}
                </View>
            </Modal>
            <Row className="relative gap-4 flex-wrap p-4 sm:my-0 bg-neocard dark:bg-neocard-dark border-b border-neoborder dark:border-neoborder-dark w-full mx-auto max-w-5xl">
                {aImages}
            </Row>
        </>
    );
   
    function getLink(data, index){
        return getContainer(<Link href={data.url} ><Text>{data.file_name}</Text></Link>, index)
    }

    function getImage(data, index){
        return getContainer(<Pressable className="w-full h-full" onPress={() => handleShowImage([data.src, 'image'])} ><Image sizes="96px" src={data.src} alt='' view="cover"    /></Pressable>, index)
    }

    function getVideo(data, index){
        return getContainer(<Pressable className="w-full h-full" onPress={() => handleShowImage([data.src, 'video'])} ><Video src={data.src}  ></Video></Pressable>, index)
    }

    function getContainer(obj, index){
        return (<View key={index} className="aspect-video w-36 lg:w-64 rounded overflow-hidden border border-neoborder dark:border-neoborder-dark items-center justify-center" >
            {obj}
        </View>);
    }
}
