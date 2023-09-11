import { useContext } from 'react';
import CardDataContext from 'app/context/card';
import { CardData } from 'app/context/card';
import Image from '../../ui/atoms/image';
import Link from '../../ui/atoms/link';
import Profile from '../../ui/molecules/profile';
import { getImageSizes } from 'app/lib/util';
import { Text } from 'app/design/typography'
import { View } from 'app/design/view'
import Menu from 'app/components/menu';
import Card from 'app/components/card'

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
            <Card margin=' mb-2  sm:mx-2 mx-4 ' rounded=" rounded-2xl ">
                <View className='flex-col pb-4 h-full '>
                    <Link href={data.url} >
                        <View className="w-full  aspect-video bg-primary/50" >
                        {data.cover && ( <><Image {...data.cover} alt={data.title} view="cover" className="absolute u-cover" sizes={imageSizes}   /></>)}  
                        </View>
                        <View className=" sm:h-20 pt-3 px-4 ">
                                <Text numberOfLines={2} className="text-center text-base font-bold text-neutral-800 dark:text-neutral-200 ">{data.title}</Text>
                        </View>
                        
                    </Link>
                    
                    
                        {data?.meta &&
                            <View className="px-4 mt-auto ">
                                <Menu {...data.meta} displayType="mixed" params={{showVertical: true, button_size:'base', button_full_width: true, button_rounded: false}} />
                            </View>
                        }
                    
                </View>
            </Card>
        )
    }

    function defaultUnit(){
        let sMeta = <Profile showLink={true} {...data.author_data} displayType="unit" displaySize="sm" showInfo="false" />

        return (
            <Card margin=' mb-2 mx-2 ' rounded=" rounded-2xl ">
                <View className='flex-col'> 
                    <Link href={data.url} >  
                    
                    {data.image && (
                        <>  <View className="flex-row-reverse sm:flex-col w-full p-1">
                            <View className="relative  aspect-video rounded-xl p-2 overflow-hidden w-2/5 sm:w-full  ">
                                <Image {...data.image} alt={data.title} view="cover" className="u-cover" sizes={imageSizes} />

                            </View>
                            <View className="flex-auto flex-col h-40 gap-y-3 p-3 ">
                            {sMeta}

                            <Text numberOfLines={2} className=' text-neutral-950 dark:text-neutral-50 sm:hover:text-primary sm:dark:hover:text-primary-dark leading-5 text-base font-bold'>
                                {data.title}
                            </Text>
                            <Text numberOfLines={2} className="text-neutral-700 dark:text-neutral-300  mb-auto  text-sm   ">{data.summary_plain}</Text>
                              
                        </View>
                        </View>
                        </>
                        ) 
                    } 
                    {!data.image && 
                        <> <View className="flex-col w-full p-1 ">
                            
                            <View className="relative px-3 pt-3 rounded-xl sm:aspect-video   overflow-hidden text-center justify-center sm:w-full gap-y-2  ">
                                <View className=" w-min mb-auto  ">{sMeta}</View>  
                                <Text numberOfLines={4} className=' text-neutral-950 dark:text-neutral-50 sm:hover:text-primary sm:dark:hover:text-primary-dark leading-5 text-base font-bold'>
                                    {data.title}
                                </Text>                          
                            </View>
                            <View className="flex-auto flex-col sm:h-40 mb-auto p-3 ">
                            
                            <Text numberOfLines={6} className="text-neutral-700 dark:text-neutral-300   text-sm   ">{data.summary_plain}</Text>
                            
                            </View>
                        </View>
                        </>
                    }
                        
                    
                    </Link>
                </View>      
            </Card>  
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
        <Card margin=' mx-1 sm:mx-2 sm:mb-2 ' rounded=" rounded-2xl ">
                <View className='flex-col pb-4  '>
                    <Link href={data.url} >
                        <View className="w-full rounded aspect-video bg-blue-500/50" >
                        {data.cover && (
                            <><Image {...data.cover} alt={data.title} view="cover" className="absolute u-cover" sizes={imageSizes}   />
                            <View className="mx-auto w-min  absolute -bottom-16 left-0 right-0 bg-white   p-1  dark:bg-bgrcard-d rounded-full ">
                                <Profile  url_avatar={data?.image?.src} displayType="unit_wo_info" displaySize="3xl" />
                            </View></>
                            )
                        }  
                        </View>
                        <View className="mt-14">
                            <View className="mx-auto w-fit sm:h-12  p-2 my-3 ">
                                <Text className=" text-base sm:text-lg  font-bold text-neutral-800  sm:text-center dark:text-neutral-100 ">{data.title}</Text>
                            </View>
                        </View>
                    </Link>
                    <View>
                        {data?.meta &&
                            <View className="px-4 items-center">
                                <Menu {...data.meta} displayType="mixed" params={{showVertical: false, button_size:'sm', button_full_width: true, button_rounded: false}} />
                            </View>
                        }
                    </View>
                </View>
        </Card>
    )
}