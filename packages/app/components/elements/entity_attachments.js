import { View, Row } from 'app/design/view';
import Image from '../../ui/atoms/image';
import Html from '../../ui/atoms/html';
import { Text, H1, H2 } from 'app/design/typography';
import Link from '../../ui/atoms/link';

export default function ElementEntityAttachments(props) {
    console.log(props);

    let aImages = [];
    props.data.forEach(function (item) { 
        /*if (item.type == 'image'){
            aImages.push(getImage(item.data));
        }*/
        aImages.push(getLink(item));
    });
    if (aImages){
        return (
            <View className="relative p-4 sm:my-0 bg-card dark:bg-card-dark border-t border-bordercolor/10 dark:border-bordercolor-dark/10 sm:border-x w-full mx-auto max-w-5xl">
                <H2>Attachments</H2>
                {aImages}
            </View>
        );
    }

    function getLink(data){
        return <View >
            <Link href={data.url} ><Text>{data.file_name}</Text></Link>
        </View>
    }
    function getImage(data){
        return <View className="aspect-video w-full rounded mt-4 overflow-hidden" >
            <Image src={data.src} alt='' view="cover"    />
        </View>

    }
}
