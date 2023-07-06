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
            return groupUnit();

        case 'bx_persons':
            return personUnit();

        case 'bx_channels':
            return channelUnit();

        default:
            return defaultUnit();
    }

    function groupUnit() {
        let sMeta = <></>;
        if(data?.meta)
            sMeta = (
                <View className="text-center px-4 mt-4">
                    <Menu {...data.meta} displayType="mixed" params={{showVertical: true}} />
                </View>
            );

        return (
            
                
            <View className="
                shadow-sm hover:shadow-lg active:shadow-none 
                m-4            
                group duration-200  rounded-lg 
                bg-backgroundcard dark:bg-backgroundcard-dark active:bg-backgroundcard-active dark:active:bg-backgroundcard-darkactive 
                hover:bg-backgroundcard-hover dark:hover:bg-backgroundcard-darkhover
                   border-2 border-transparent 
               justify-between 
                active:translate-y-0.5 
                
                ">
                    <Link href={data.url} emulate={true}> 
                    <View>  
                    <View className=''>  
                    {data.cover &&
                            <View className="w-full bg-neutral-500/20 rounded-md aspect-video overflow-hidden items-center absolute" >
                                <Image {...data.cover} alt={data.title} view="cover" className="u-cover" sizes={imageSizes}   />
                            </View>
                        } 
                        {!data.image &&<View className="bg-primary/10 dark:bg-primary-dark/10 absolute w-full rounded aspect-video"></View> }
                        <View className=" aspect-video mb-4 w-full items-center justify-center">
                           
                        </View>
                        </View>
                        <Link href={data.url} ><Text numberOfLines={2}  className=" px-4 text-base font-bold text-neutral-800 sm:h-12 dark:text-neutral-100">{data.group_name}</Text></Link>
                        {sMeta}
                    </View>
                </Link>
            </View>
            
        )
    }

    function channelUnit() {
        let sMeta = <></>;
        if(data?.meta)
            sMeta = (
                <View className="text-center px-4 mt-4">
                    <Menu {...data.meta} displayType="mixed" params={{showVertical: true}} />
                </View>
            );

        return (
            <View className="u-card" >
                
                <View className="
                    flex-auto
                    p-1 mt-1 sm:mx-2 sm:mt-2                   
                    group duration-200 overflow-hidden sm:rounded-lg  sm:hover:shadow-sm
                    bg-backgroundcard dark:bg-backgroundcard-dark active:bg-neocard-active dark:active:bg-neocard-darkactive 
                    hover:bg-backgroundcard-hover dark:hover:bg-backgroundcard-darkhover
                    border  
                    active:translate-y-0.5
                    border-bordercolorcard dark:border-bordercolorcard-dark 
                    sm:hover:border-bordercolorcard-hover sm:dark:hover:border-bordercolorcard-darkhover 
                    active:border-bordercolorcard-active dark:active:border-bordercolorcard-darkactive
                ">
                    <Link href={data.url} emulate={true}> 
                    <View>  
                    <View className='mb-2'>  
                    {data.cover &&
                            <View className="w-full bg-neutral-500/20 rounded aspect-video overflow-hidden items-center absolute" >
                                <Image {...data.cover} alt={data.title} view="cover" className="u-cover" sizes={imageSizes}   />
                            </View>
                        } 
                        {!data.image &&<View className="bg-primary/10 dark:bg-primary-dark/10 absolute w-full rounded aspect-video"></View> }
                        <View className=" aspect-video w-full items-center justify-center">
                           
                        </View>
                        </View>
                        <Link href={data.url} ><Text className="px-4 text-lg font-bold text-neutral-800 text-center dark:text-neutral-100">{data.channel_name}</Text></Link>
                        {sMeta}
                    </View>
                </Link>
            </View>
            </View>
        )
    }

    function personUnit(){
        let sMeta = <></>;
        if(data?.meta)
            sMeta = (
                <View className="px-3">
                    <Menu {...data.meta} displayType="mixed" params={{showVertical: true, button_size:'base', button_full_width: true, button_rounded: false}} />
                </View>
            );

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
                    <Link href={data.url} emulate={true}> 
                    <View className='flex-col pb-4  '>  
                        
                        {data.cover &&
                                <View className="w-full bg-neutral-500/20 rounded  " >
                                    <Image {...data.cover} alt={data.title} view="cover" className="absolute u-cover" sizes={imageSizes}   />
                                    <View className="sm:mx-auto mr-3 ml-auto translate-y-14    p-1 bg-backgroundcard dark:bg-backgroundcard-dark rounded-full ">

                                    <Profile class url_avatar={data?.image?.src} displayType="unit_wo_info" displaySize="3xl" />
                                    </View>
                                </View>
                            } 
                               
                                <View className="sm:mt-12">

                            <Link href={data.url} >
                                <View className="sm:mx-auto w-fit mr-auto bg-backgroundcard/80 dark:bg-backgroundcard-dark/80 backdrop-blur rounded-lg p-2 my-3 ml-2">
                                <Text className=" text-xl sm:text-lg  font-bold text-neutral-800  sm:text-center dark:text-neutral-100 ">{data.title}</Text>
                                </View>
                            </Link>
                            <View className=''>{sMeta}</View></View>
                    </View>
                </Link>
            </View>
            
        )
    }

    function defaultUnit(){
        let sMeta = <Profile showLink={true} {...data.author_data} displayType="unit" displaySize="xs" showInfo="false" />

        
        return (
            <View className="
                hover:shadow-sm active:shadow-none 
                mt-4 mx-2             
                  group duration-200 overflow-hidden rounded-lg  
                bg-backgroundcard dark:bg-backgroundcard-dark active:bg-backgroundcard-active dark:active:bg-backgroundcard-darkactive 
                hover:bg-backgroundcard-hover dark:hover:bg-backgroundcard-darkhover
                active:translate-y-0.5 border
                border-bordercolorcard dark:border-bordercolorcard-dark 
                sm:hover:border-bordercolorcard-hover sm:dark:hover:border-bordercolorcard-darkhover 
                active:border-bordercolorcard-active dark:active:border-bordercolorcard-darkactive
                ">
               
                    <View className='flex-col    '> 
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