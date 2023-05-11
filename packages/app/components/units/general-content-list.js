import Image from '../../ui/atoms/image';
import Link from '../../ui/atoms/link';
import Profile from '../../ui/molecules/profile';
import { appSetting } from 'app/lib/util';
import { Text } from 'app/design/typography'
import { View } from 'app/design/view'
import Menu from 'app/components/menu';
import { Button } from 'app/design/controls';


export default function Unit(props) {
    let data = props.data;
   
    
    function getImageSizes(){
        const perLineSettings = appSetting('browse', 'per_line');
        let str ="";
        for (let i = perLineSettings.length-1; i >= 0; i--) {

            if (i == perLineSettings.length-1)
                str += " (max-width:" + perLineSettings[i].width + "px) 100vw, ";
            else{
   
                str += "(max-width:" + perLineSettings[i].width + "px) "+Math.round(100/perLineSettings[i+1].count)+"vw, ";
            }
        }
        str += '' + (1280/perLineSettings[0].count) + 'px';
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
            sMeta = <Menu {...data.meta} displayType="link" />
        else
            sMeta = <Profile {...data.author_data} displayType="unit" displaySize="xs" showInfo="false" />

        return (
            
                
                <View className="
                    shadow-sm hover:shadow-md active:shadow-none 
                    mt-2 mx-2             
                    group duration-200  rounded-lg  
                    bg-backgroundcard dark:bg-backgroundcard-dark active:bg-backgroundcard-active dark:active:bg-backgroundcard-darkactive 
                    hover:bg-backgroundcard-hover dark:hover:bg-backgroundcard-darkhover
                       
                   justify-between 
                    active:translate-y-0.5 ">
                    <Link href={data.url}>  
                    <View className='justify-between h-full sm:aspect-square'>    
                        {data.image && (
                
                                

                                <><View><View className="relative  m-0.5 rounded-md aspect-video overflow-hidden  ">
                                <Image {...data.image} alt={data.title} view="cover" className="u-cover" sizes={imageSizes} />
                            </View><View className="p-2.5 flex-col gap-2  ">

                                    <Text numberOfLines={2} className='text-neutral-950 dark:text-neutral-50 hover:text-accent dark:hover:text-accent-dark sm:leading-5  text-lg sm:text-base  font-bold'>
                                        {data.title}
                                    </Text>
                                    <Text numberOfLines={1} className="text-neutral-700 dark:text-neutral-300   text-sm   ">{data.summary_plain}</Text>
                                    </View>

                                </View><View className=" p-2.5  ">{sMeta}</View></>
           
                               )
                          
                        } 
                        
                        {!data.image &&<>
                        
                        <View className="  ">
                                


                                
                                    <View className="p-2.5 my-0.5 flex-col gap-2  ">
                                       
                                        <Text numberOfLines={2} className='mt-auto text-neutral-950  dark:text-neutral-50 hover:text-accent dark:hover:text-accent-dark sm:leading-5  text-lg sm:text-base  font-bold'>
                                            {data.title}
                                        </Text>
                                    </View>
                                    
                                        <Text numberOfLines={10} className="px-2.5  sm:aspect-video text-neutral-700 dark:text-neutral-300   text-sm   ">{data.summary_plain}</Text>
                                        

                                    
                                    
                                    


                                </View>
                                <View className=" p-2.5    ">{sMeta}</View>
                               

                        
                        
                        </>}


                        </View>      
                    </Link>
                
                
            </View>  
        )
    }
}