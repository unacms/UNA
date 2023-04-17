import { View } from 'app/design/view';
import Image from '../../ui/atoms/image';
import { Text, H2 } from 'app/design/typography';
import Link from '../../ui/atoms/link';

export default function ElementEntityAttachments(props) {
    let aImages = [];
    props.data.forEach(function (item) { 
        /*if (item.type == 'image'){
            aImages.push(getImage(item.data));
        }*/
        aImages.push(getLink(item));
    });
    if (aImages.length > 0){
        return (
            <View className="relative p-4 sm:my-0 bg-neocard dark:bg-neocard-dark border-t border-neoborder dark:border-neoborder-dark sm:border-x w-full mx-auto max-w-5xl">
                <H2>Attachments</H2>
                {aImages}
            </View>
        );
    }

    function getLink(data){
        return <View key={"file" + data.url}>
            <Link href={data.url} ><Text>{data.file_name}</Text></Link>
        </View>
    }
    function getImage(data){
        return <View className="aspect-video w-full rounded mt-4 overflow-hidden" >
            <Image src={data.src} alt='' view="cover"    />
        </View>

    }
}
