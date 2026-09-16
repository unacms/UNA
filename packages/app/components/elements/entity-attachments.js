import { View, Row, Pressable } from 'app/design/view';
import { useState } from 'react';
import Image from 'app/ui/atoms/image';
import { Text } from 'app/design/typography';
import Link from 'app/ui/atoms/link';
import { Modal } from 'app/design/controls'
import Video from 'app/ui/atoms/video';
import { FeedbackHaptics } from 'app/lib/util';
import { BlockWrapper } from 'app/components/block-wrapper'
import { useTranslation } from 'react-i18next'

const AttachmentContainer = ({ children }) => (
    <View className="p-1 w-1/4">
        <View className="aspect-video rounded-lg shadow-btn-outline dark:shadow-btn-outline-deep items-center justify-center">
            <View className="h-full w-full overflow-hidden rounded-lg">
                {children}
            </View>
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
    const { t } = useTranslation();
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
            <Modal id={'file-preview'} title={t('Preview title')} onVisible={!!showImage} onClose={() => {setShowImage(null)}}>
                <View className="w-full h-64 lg:h-96" >
                    {showImage && showImage[1] == 'image' && <Image className="w-full h-full" src={showImage[0]} alt='' view="cover" />}
                    {showImage && showImage[1] == 'video' && <Video className="w-full h-full" src={showImage[0]}  ></Video>}
                </View>
            </Modal>
            <Row className="relative flex-wrap w-full mx-auto max-w-4xl">
                {aImages}
            </Row>
        </BlockWrapper>
    );
   
    
}
