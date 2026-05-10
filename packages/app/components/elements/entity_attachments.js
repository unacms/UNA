import { View, Row, Pressable } from 'app/design/view';
import { useState } from 'react';
import Image from 'app/ui/atoms/image';
import { Text, H2 } from 'app/design/typography';
import Link from 'app/ui/atoms/link';
import { Modal } from 'app/design/controls'
import Video from 'app/ui/atoms/video';
import { FeedbackHaptics } from 'app/lib/util';
import { BlockWrapper } from 'app/components/block-wrapper'

const AttachmentContainer = ({ children }) => (
    <View className='p-1 w-1/4'>
        <View className="aspect-video rounded-lg overflow-hidden border border-border/60  items-center justify-center">
            {children}
        </View>
    </View>
);

const LinkItem = ({ data }) => (
    <AttachmentContainer>
        <Link href={data.url}>
            <Text>{data.file_name}</Text>
        </Link>
    </AttachmentContainer>
);

const ImageItem = ({ data, handleShowImage }) => (
    <AttachmentContainer>
        <Pressable className="w-full h-full" onPress={() => handleShowImage([data.src, 'image'])}>
            <Image sizes="160px" src={data.src} alt='' view="cover" />
        </Pressable>
    </AttachmentContainer>
);

const VideoItem = ({ data, handleShowImage }) => (
    <AttachmentContainer>
        <Pressable className="w-full h-full" onPress={() => handleShowImage([data.src, 'video'])}>
            <Video src={data.src} />
        </Pressable>
    </AttachmentContainer>
);

export default function ElementEntityAttachments({ data, blockWrapperProps }) {

    const [showImage, setShowImage] = useState(false);

    const handleShowImage = (img) => {
        FeedbackHaptics('Medium');
        setShowImage(img);
    } 
    
    const aImages = data.map((item, index) => {
        switch(item.type) {
            case 'image':
                return <ImageItem data={item.data} key={`link-${index}`} handleShowImage={handleShowImage} />;
            case 'video':
                return <VideoItem data={item.data} key={`link-${index}`} handleShowImage={handleShowImage} />;
            default:
                return <LinkItem data={item} key={`link-${index}`} />;
        }
    });

    if (aImages.length === 0) {
        return null;
    }
    
    return (
        <BlockWrapper {...blockWrapperProps}>
            <Modal id={'file-preview'} title="Preview title" onVisible={!!showImage} onClose={() => {setShowImage(null)}}>
                <View className="w-full h-64 lg:h-96" >
                    {showImage && showImage[1] == 'image' && <Image className="w-full h-full" src={showImage[0]} alt='' view="cover" />}
                    {showImage && showImage[1] == 'video' && <Video className="w-full h-full" src={showImage[0]}  ></Video>}
                </View>
            </Modal>
            <Row className="relative  flex-wrap lg:p-4 p-2 sm:my-0 bg-card  w-full mx-auto max-w-4xl">
                {aImages}
            </Row>
        </BlockWrapper>
    );
   
    
}
