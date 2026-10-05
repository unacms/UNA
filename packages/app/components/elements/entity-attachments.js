import { View, Row, Pressable } from 'app/design/view';
import { useState } from 'react';
import Image from 'app/ui/atoms/image';
import { Modal } from 'app/design/controls'
import Video from 'app/ui/atoms/video';
import VideoThumb from 'app/ui/atoms/video-thumb';
import FileCard from 'app/ui/molecules/content/file-card';
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

// API `ext` can be a mime subtype (e.g. "x-zip-compressed"), so FileCard prefers the name's extension.
const FileItem = ({ data }) => (
    <View className="p-1 w-full">
        <FileCard href={data.url} name={data.file_name} size={data.size} ext={data.ext} />
    </View>
);

const ImageItem = ({ data, handleShowImage }) => (
    <AttachmentContainer>
        <Pressable className="w-full h-full" onPress={() => handleShowImage({ ...data, type: 'image' })}>
            <Image sizes="160px" src={data.src} alt='' view="cover" />
        </Pressable>
    </AttachmentContainer>
);

const VideoItem = ({ data, handleShowImage }) => (
    <AttachmentContainer>
        <Pressable className="w-full h-full" onPress={() => handleShowImage({ ...data, type: 'video' })}>
            {/* Poster only: decoding a frame from the video itself downloaded part of every file. */}
            <VideoThumb src={data.src} poster={data.src_poster || data.poster} sizes="(max-width:768px) 25vw, 224px" />
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
    
    // Media go to the thumbnail grid, everything else to a file list below it.
    const aMedia = [];
    const aFiles = [];
    data.forEach((item, index) => {
        switch(item.type) {
            case 'image':
                aMedia.push(<ImageItem data={item.data} key={`link-${index}`} handleShowImage={handleShowImage} />);
                break;
            case 'video':
                aMedia.push(<VideoItem data={item.data} key={`link-${index}`} handleShowImage={handleShowImage} />);
                break;
            default:
                aFiles.push(<FileItem data={item} key={`link-${index}`} />);
        }
    });

    if (aMedia.length === 0 && aFiles.length === 0) {
        return null;
    }
    
    return (
        <BlockWrapper {...blockWrapperProps}>
            <Modal id={'file-preview'} title={t('Media')} onVisible={!!showImage} onClose={() => {setShowImage(null)}}>
                {showImage && (
                    // Real proportions from API width/height; contain so nothing is cropped even when capped by max-h.
                    <View className="w-full max-h-[75vh]" style={{ aspectRatio: showImage.width && showImage.height ? showImage.width / showImage.height : 16 / 9 }}>
                        {showImage.type == 'image' && <Image src={showImage.src} alt='' view="cover" contentFit="contain" />}
                        {showImage.type == 'video' && <Video fill controls autoplay src={showImage.src} poster={showImage.src_poster || showImage.poster} />}
                    </View>
                )}
            </Modal>
            {aMedia.length > 0 && (
                // Stretched with -mx-1 so the tiles' p-1 gutter doesn't inset the outer edges from the post text.
                <Row className="relative flex-wrap -mx-1 max-w-4xl">
                    {aMedia}
                </Row>
            )}
            {aFiles.length > 0 && (
                <Row className={`flex-wrap -mx-1 max-w-4xl${aMedia.length > 0 ? ' mt-2' : ''}`}>
                    {aFiles}
                </Row>
            )}
        </BlockWrapper>
    );
   
    
}
