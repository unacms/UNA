import { useContext } from 'react';
import CardDataContext from 'app/context/card';
import { CardData } from 'app/context/card';
import Image from '../../ui/atoms/image';
import Link from '../../ui/atoms/link';
import Profile from '../../ui/molecules/profile';
import { appSetting, getImageSizes } from 'app/lib/util';
import { Text } from 'app/design/typography'
import { View } from 'app/design/view'
import Menu from 'app/components/menu';


export default function Unit(props) {
    let data = props.data;

    const imageSizes = getImageSizes();
    const module = !!data?.module ? data.module : props.module;

    switch (module) {
        case 'bx_groups':
        case 'bx_events':
        case 'bx_channels':
            return groupUnit();  

        case 'bx_persons':
            return (
                <CardDataContext>
                    <UnitPerson {...props} />
                </CardDataContext>
            );

        default:
            return defaultUnit();
    }

    function groupUnit() {
        let sMeta = <></>;
        if(data?.meta)
            sMeta = (
                <View className="pb-2">
                    <Menu {...data.meta} displayType="mixed" params={{showVertical: true}} />
                </View>
            );

        return (
                <View className="
                    mb-4 sm:mb-2 mx-4 sm:mx-2 group duration-200 overflow-hidden rounded-xl 
                    bg-backgroundcard dark:bg-backgroundcard-dark active:bg-backgroundcard-active dark:active:bg-backgroundcard-darkactive 
                    sm:hover:bg-backgroundcard-hover sm:dark:hover:bg-backgroundcard-darkhover
                    sm:hover:shadow-sm aspect-square
                    active:opacity-50 border
                    border-bordercolorcard dark:border-bordercolorcard-dark 
                    sm:hover:border-bordercolorcard-hover sm:dark:hover:border-bordercolorcard-darkhover 
                    
                ">
                <View className='flex-col pb-4 h-full '>
                    <Link href={data.url} >
                        <View className="w-full  aspect-video bg-primary/50" >
                        {data.cover && ( <><Image {...data.cover} alt={data.title} view="cover" className="absolute u-cover" sizes={imageSizes}   /></>)}  
                        </View>
                        <View className=" pt-3 px-4">
                                <Text numberOfLines={2} className=" text-base font-bold text-neutral-800 dark:text-neutral-200 ">{data.title}</Text>
                        </View>
                        
                    </Link>
                    
                        {data?.meta &&
                            <View className="px-4 mt-auto ">
                                <Menu {...data.meta} displayType="mixed" params={{showVertical: true, button_size:'base', button_full_width: true, button_rounded: false}} />
                            </View>
                        }
                    
                </View>
            </View>
        )
    }

    function defaultUnit(){
        let sMeta = <Profile showLink={true} {...data.author_data} displayType="unit" displaySize="xs" showInfo="false" />

        return (
            <View className="
                mt-4 sm:mt-2 mx-2 group duration-200 overflow-hidden rounded-lg 
                bg-backgroundcard dark:bg-backgroundcard-dark active:bg-backgroundcard-active dark:active:bg-backgroundcard-darkactive 
                hover:bg-backgroundcard-hover dark:hover:bg-backgroundcard-darkhover
                hover:shadow-sm active:shadow-none 
                active:translate-y-0.5 border
                border-bordercolorcard dark:border-bordercolorcard-dark 
                sm:hover:border-bordercolorcard-hover sm:dark:hover:border-bordercolorcard-darkhover 
                active:border-bordercolorcard-active dark:active:border-bordercolorcard-darkactive
            ">
                <View className='flex-col'> 
                    <Link href={data.url} >  
                    {data.image && (
                        <>
                            <View className="relative  aspect-video  overflow-hidden w-full ">
                                <Image {...data.image} alt={data.title} view="cover" className="u-cover" sizes={imageSizes} />
                            </View>
                        </>
                        ) 
                    } 
                    {!data.image && 
                        <>
                            <View className="relative bg-primary-100 dark:bg-primary-900 rounded aspect-video  overflow-hidden w-full "></View> 
                        </>
                    }
                    <View className="flex flex-col sm:h-28 gap-1 p-3 ">
                        <Text numberOfLines={2} className=' text-neutral-950 dark:text-neutral-50 sm:hover:text-primary sm:dark:hover:text-primary-dark sm:leading-5  text-lg sm:text-base  font-bold'>
                            {data.title}
                        </Text>
                        <Text numberOfLines={2} className="text-neutral-700 dark:text-neutral-300   text-sm   ">{data.summary_plain}</Text>
                    </View>
                    </Link>
                    <View className=" px-3 pb-3  ">{sMeta}</View>          
                </View>      
            </View>  
        )
    }
}

export function UnitPerson(props) {
    let data = props.data;

    const { cardData, setCardData } = useContext(CardData);

    if(!!cardData?.hidden)
        return;

    const imageSizes = getImageSizes();
    return (
            <View className="
                mb-4 mx-4 sm:mx-2 group duration-200 overflow-hidden rounded-xl 
                bg-backgroundcard dark:bg-backgroundcard-dark active:bg-backgroundcard-active dark:active:bg-backgroundcard-darkactive 
                hover:bg-backgroundcard-hover dark:hover:bg-backgroundcard-darkhover
                hover:shadow-sm active:shadow-none 
                active:translate-y-0.5 border
                border-bordercolorcard dark:border-bordercolorcard-dark 
                sm:hover:border-bordercolorcard-hover sm:dark:hover:border-bordercolorcard-darkhover 
                active:border-bordercolorcard-active dark:active:border-bordercolorcard-darkactive
            ">
            <View className='flex-col pb-4  '>
                <Link href={data.url} >
                    <View className="w-full rounded aspect-video bg-blue-500/50" >
                    {data.cover && (
                        <><Image {...data.cover} alt={data.title} view="cover" className="absolute u-cover" sizes={imageSizes}   />
                        <View className="mx-auto o w-min  absolute -bottom-16 left-0 right-0    p-1 bg-backgroundcard dark:bg-backgroundcard-dark rounded-full ">
                            <Profile  url_avatar={data?.image?.src} displayType="unit_wo_info" displaySize="3xl" />
                        </View></>
                        )
                    }  
                    </View>
                    <View className="mt-12">
                        <View className="mx-auto w-fit  p-2 my-3 ">
                            <Text className=" text-xl sm:text-lg  font-bold text-neutral-800  sm:text-center dark:text-neutral-100 ">{data.title}</Text>
                        </View>
                    </View>
                </Link>
                <View>
                    {data?.meta &&
                        <View className="px-3">
                            <Menu {...data.meta} displayType="mixed" params={{showVertical: true, button_size:'base', button_full_width: true, button_rounded: false}} />
                        </View>
                    }
                </View>
            </View>
        </View>
    )
}