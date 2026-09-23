import { View, Row, Pressable } from 'app/design/view';
import { useState } from 'react';
import Image from 'app/ui/atoms/image';
import { Text } from 'app/design/typography';
import Link from 'app/ui/atoms/link';
import { Modal } from 'app/design/controls'
import Video from 'app/ui/atoms/video';
import { FeedbackHaptics, formatFileSize } from 'app/lib/util';
import { BlockWrapper } from 'app/components/block-wrapper'
import { Icon } from 'app/ui/atoms/icon';
import { useTranslation } from 'react-i18next'

const AttachmentContainer = ({ children }) => (
    <View className="p-1 w-1/4">
        <View className="aspect-square rounded-lg shadow-btn-outline dark:shadow-btn-outline-deep items-center justify-center">
            <View className="h-full w-full overflow-hidden rounded-lg">
                {children}
            </View>
        </View>
    </View>
);

// Extension from the stored name first: API `ext` can be a mime subtype (e.g. "x-zip-compressed").
const fileExt = (data) => {
    const fromName = String(data.file_name || '').match(/\.([a-z0-9]{1,8})$/i)?.[1];
    return (fromName || data.ext || '').toLowerCase();
};

const FileItem = ({ data }) => {
    const ext = fileExt(data);
    const meta = [ext.toUpperCase(), formatFileSize(data.size)].filter(Boolean).join(' · ');

    return (
        <View className="p-1 w-full">
            <Link href={data.url} mode="plain" className="block">
                <Row className="items-center gap-3 rounded-lg p-2 shadow-btn-outline dark:shadow-btn-outline-deep">
                    <View className="h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
                        <Icon icon="File" size={20} className="text-muted-foreground" />
                    </View>
                    <View className="min-w-0 flex-1">
                        <Text numberOfLines={1} className="text-sm text-foreground">{data.file_name}</Text>
                        {meta ? <Text numberOfLines={1} className="text-xs text-muted-foreground">{meta}</Text> : null}
                    </View>
                    <Icon icon="Download" size={16} className="text-muted-foreground" />
                </Row>
            </Link>
        </View>
    );
};

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
            <View className="w-full h-full pointer-events-none">
                <Video fill cover muted src={data.src} poster={data.src_poster || data.poster} />
            </View>
            <View className="absolute inset-0 items-center justify-center pointer-events-none">
                <View className="rounded-full bg-black/50 p-2">
                    <Icon icon="Play" size={16} color="white" fill="white" />
                </View>
            </View>
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
            <Modal id={'file-preview'} title={t('Preview title')} onVisible={!!showImage} onClose={() => {setShowImage(null)}}>
                {showImage && (
                    // Real proportions from API width/height; contain so nothing is cropped even when capped by max-h.
                    <View className="w-full max-h-[75vh]" style={{ aspectRatio: showImage.width && showImage.height ? showImage.width / showImage.height : 16 / 9 }}>
                        {showImage.type == 'image' && <Image src={showImage.src} alt='' view="cover" contentFit="contain" />}
                        {showImage.type == 'video' && <Video fill controls autoplay src={showImage.src} />}
                    </View>
                )}
            </Modal>
            {aMedia.length > 0 && (
                <Row className="relative flex-wrap w-full mx-auto max-w-4xl">
                    {aMedia}
                </Row>
            )}
            {aFiles.length > 0 && (
                <Row className={`flex-wrap w-full mx-auto max-w-4xl${aMedia.length > 0 ? ' mt-2' : ''}`}>
                    {aFiles}
                </Row>
            )}
        </BlockWrapper>
    );
   
    
}
