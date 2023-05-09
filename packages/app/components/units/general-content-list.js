import Image from '../../ui/atoms/image';
import Link from '../../ui/atoms/link';
import Profile from '../../ui/molecules/profile';
import { appSetting } from 'app/lib/util';
import { Text } from 'app/design/typography'
import { View } from 'app/design/view'
import Menu from 'app/components/menu';


export default function Unit(props) {
    let data = props.data;
   
    
    function getImageSizes(){
        const perLineSettings = appSetting('browse', 'per_line');
        //console.log('!!!',perLineSettings);
        let str ="";
        for (let i = perLineSettings.length-1; i >= 0; i--) {

            if (i == perLineSettings.length-1)
                str += " (max-width:" + perLineSettings[i].width + "px) 100vw, ";
            else{
   
                str += "(max-width:" + perLineSettings[i].width + "px) "+(100/perLineSettings[i+1].count)+"vw, ";
            }
        }
        str += (100/perLineSettings[0].count)+"vw";
        return str
    }
    
    const imageSizes = getImageSizes();

    switch (props.module) {
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
            <View className="u-card" >
                
                <View className="
                flex-auto
                 p-1 mt-1 sm:mx-2 sm:mt-2                   
                 group duration-200 overflow-hidden sm:rounded-lg  
                 bg-backgroundcard dark:bg-backgroundcard-dark active:bg-neocard-active dark:active:bg-neocard-darkactive 
                 hover:bg-backgroundcard-hover dark:hover:bg-backgroundcard-darkhover
                 border  
                 active:translate-y-0.5
                 border-bordercolorcard dark:border-bordercolorcard-dark 
                 sm:hover:border-bordercolorcard-hover sm:dark:hover:border-bordercolorcard-darkhover 
                 active:border-bordercolorcard-active dark:active:border-bordercolorcard-darkactive
                
                
                ">
                    <Link href={data.url}> 
                    <View>  
                    <View className='mb-2'>  
                    {data.cover &&
                            <View className="w-full bg-gray-500/20 rounded aspect-video overflow-hidden items-center absolute" >
                                <Image {...data.cover} alt={data.title} view="cover" className="u-cover" sizes={imageSizes}   />
                            </View>
                        } 
                        {!data.image &&<View className="bg-primary/10 dark:bg-primary-dark/10 absolute w-full rounded aspect-video"></View> }
                        <View className=" aspect-video w-full items-center justify-center">
                           
                        </View>
                        </View>
                        <Text className="px-4 text-lg font-bold text-gray-800 text-center dark:text-gray-100">{data.group_name}</Text>
                        {sMeta}
                    </View>
                </Link>
            </View>
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
                    <Link href={data.url}> 
                    <View>  
                    <View className='mb-2'>  
                    {data.cover &&
                            <View className="w-full bg-gray-500/20 rounded aspect-video overflow-hidden items-center absolute" >
                                <Image {...data.cover} alt={data.title} view="cover" className="u-cover" sizes={imageSizes}   />
                            </View>
                        } 
                        {!data.image &&<View className="bg-primary/10 dark:bg-primary-dark/10 absolute w-full rounded aspect-video"></View> }
                        <View className=" aspect-video w-full items-center justify-center">
                           
                        </View>
                        </View>
                        <Text className="px-4 text-lg font-bold text-gray-800 text-center dark:text-gray-100">{data.channel_name}</Text>
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
                <View className="text-center h-auto px-4 mb-2">
                    <Menu {...data.meta} displayType="mixed" params={{showVertical: true}} />
                </View>
            );

        return (
            <View className="u-card self-stretch" >
                
                <View className="
                flex-auto h-full
                 p-1 mt-1 sm:mx-2 sm:mt-2                   
                 group duration-200 overflow-hidden sm:rounded-lg  
                 bg-backgroundcard dark:bg-backgroundcard-dark active:bg-neocard-active dark:active:bg-neocard-darkactive 
                 hover:bg-backgroundcard-hover dark:hover:bg-backgroundcard-darkhover
                 border  
                 active:translate-y-0.5
                 border-bordercolorcard dark:border-bordercolorcard-dark 
                 sm:hover:border-bordercolorcard-hover sm:dark:hover:border-bordercolorcard-darkhover 
                 active:border-bordercolorcard-active dark:active:border-bordercolorcard-darkactive
                
                
                ">
                    <Link href={data.url}> 
                    <View>  
                    <View className='mb-2'>  
                    {data.cover &&
                            <View className="w-full bg-gray-500/20 rounded aspect-video overflow-hidden items-center absolute" >
                                <Image {...data.cover} alt={data.title} view="cover" className="u-cover" sizes={imageSizes}   />
                            </View>
                        } 
                        {!data.image &&<View className="bg-primary/10 dark:bg-primary-dark/10 absolute w-full rounded aspect-video"></View> }
                        <View className=" aspect-video w-full items-center justify-center">
                            <Profile url_avatar={data.image} displayType="unit_wo_info" displaySize="3xl" />
                        </View>
                        </View>
                        <Text className="px-4 text-base font-bold text-gray-800 text-center dark:text-gray-100 mb-1">{data.fullname}</Text>
                        {sMeta}
                    </View>
                </Link>
            </View>
            </View>
        )
    }

    function defaultUnit(){
        let sMeta = '';

        if(data?.meta)
            sMeta = <Menu {...data.meta} displayType="link" itemsStart={true} />
        else
            sMeta = <Profile {...data.author_data} displayType="unit" displaySize="xs" showInfo="false" />

        return (
            <View className="u-card" >
                
                <View className="
                    flex-auto
                    mx-2 mt-2                   
                    group duration-200 overflow-hidden rounded-lg  
                    border  
                    border-bordercolorcard dark:border-bordercolorcard-dark 
                    sm:hover:border-bordercolorcard-hover sm:dark:hover:border-bordercolorcard-darkhover 
                    active:border-bordercolorcard-active dark:active:border-bordercolorcard-darkactive
                    active:translate-y-0.5 ">
                    <Link href={data.url}>            
                        {data.image &&
                            <><View className="relative w-full  rounded-lg aspect-video overflow-hidden p-1 justify-between">
                                <Image {...data.image} alt={data.title} view="cover" className="u-cover" sizes={imageSizes} />
                                <View className="backdrop-blur-sm mr-auto p-0.5  flex-none bg-white/80 dark:bg-neutral-950/50    shadow-sm  rounded-full ">
                                    {sMeta}
                                </View>

                                    <View className="backdrop-blur bg-white/80 dark:bg-neutral-950/80  px-1 py-1 rounded-md overflow-hidden gap-0.5  flex-col ">
                                        <Text numberOfLines={2} className='text-neutral-950 dark:text-neutral-50 leading-[22px] sm:leading-[18px]  text-base sm:text-sm  font-semibold'>
                                            {data.title}
                                        </Text>
                                        <Text numberOfLines={2} className="text-neutral-700 dark:text-neutral-300 leading-[18px] sm:leading-[14px] text-sm sm:text-xs  ">{data.summary_plain}</Text>
                                    </View>

                                
                            </View></>
                        } 
                        
                        {!data.image &&<>
                        
                        <View className="  p-1 w-full overflow-hidden rounded aspect-video  justify-between
                                 
                 group duration-200 overflow-hidden rounded-lg  
                 bg-backgroundcard dark:bg-backgroundcard-dark active:bg-neocard-active dark:active:bg-neocard-darkactive 
                 hover:bg-backgroundcard-hover dark:hover:bg-backgroundcard-darkhover
                 
                 ">
                                <View className=" mr-auto p-0.5 ">
                                    {sMeta}
                                </View>
                                <View className="  p-1 overflow-hidden gap-0.5  flex-col ">
                                        <Text numberOfLines={3} className='text-neutral-950 dark:text-neutral-50  leading-[22px] sm:leading-[18px]  text-base sm:text-sm  font-semibold'>
                                            {data.title}
                                        </Text>
                                        <Text numberOfLines={5} className="text-neutral-700 dark:text-neutral-300 leading-[18px] sm:leading-[14px] text-sm sm:text-xs   ">{data.summary_plain}</Text>
                                    </View>
                        </View>
                        
                        </>}


                   
                    </Link>
                </View>
                
            </View>  
        )
    }
}