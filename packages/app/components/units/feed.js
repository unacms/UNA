import Image from '../atoms/image';
import Link from '../atoms/link';
import Time from '../atoms/time';
import Profile from '../atoms/profile';

import { Text, H1 } from 'app/design/typography'
import { View } from 'app/design/view'


// g-med style browsing
/**
 * It renders a link to the post, which contains a profile picture, a title, a description, and a
 * comment
 * @returns A React component.
 */
export default function UnitFeed({data}) {
    var oImage = data.content.images.length > 0 ? data.content.images[0] : null;
    if (oImage == null)
        oImage = data.content.images_attach ? data.content.images_attach[0] : null;
    
        var oCmt = null;
    if (data.cmts.data.length > 0){
        oCmt = data.cmts.data[0][Object.keys(data.cmts.data[0])[0]].data;
    }

    //return <View><Row><Text>TODO:feed unit</Text></Row></View>
    
    return (
        <Link href={data.url} className="flex-col ">
            <View className='flex-col p-2 mx-2 my-1 bg-white dark:bg-gray-800 dark:border-gray-700 border border-gray-200  rounded-lg  '>
                <View className="flex-row mb-2 flex-wrap">
                    <View className="mr-2">       
                        <Profile {...data.author_data} showLinks="false" className="" />
                    </View>    
                    
                    <View className="  ">
                        <Time className="" ts={data.date}></Time>
                    </View>

                    
                </View> 
                {oImage &&
                    <View className=" flex-row bg-green-200 "><Image {...oImage} alt={data.title} resizeMode="cover" className=" border-2 border-gray-500 rounded-lg  w-full aspect-video " /></View>
                }  
                <View className="flex-col gap-1 bg-red-200/20">
                    <Text className="text-sm hidden text-gray-600 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-blue-300  ">{data.description}</Text>
                    <View className="">
                        <H1 className="text-lg  mt-auto font-bold tracking-tight text-gray-800 dark:text-gray-100 ">{data.content.title}</H1>
                        <View className=' bg-blue-500 rounded-full ml-auto px-2'>
                            <Text className="text-xs font-medium text-white">{data.cmts.count}</Text>
                        </View>
                        
                    </View>
                    {/* oCmt &&
                        <View className='flex gap-1  ml-12 @xl/cell:m-0'>
                            <View className='flex-none hidden @xl/cell:block'><Profile {...data.author_data} displayType="unit_wo_info" displaySize="sm" /></View>
                            <View className='flex w-full'>  
                                <View className='flex relative flex-none @xl/cell:flex-wrap gap-x-2  ml-1  w-full text-sm  bg-gray-300/50 dark:bg-gray-700/50 py-0.5 px-1.5  @xl/cell:py-1.5 @xl/cell:px-2.5 rounded-lg     '>
                                    <Text className=' flex-none  hidden @xl/cell:line-clamp-1 my-auto font-semibold '>{oCmt.author_data.display_name}</Text>
                                    <View className='flex-auto line-clamp-1 @xl/cell:line-clamp-2 text-gray-600 dark:text-gray-400  my-auto' dangerouslySetInnerHTML={{__html:oCmt.cmt_text}}/>
                                    <View className="text-sm -mt-4 ring ring-white dark:ring-gray-900 -mr-1.5 flex-none @xl/cell:hidden font-medium   bg-blue-500 h-min  rounded-xl rounded-br-sm  ml-auto px-2  text-white dark:text-gray-800  ">{data.cmts.count}</View>
                                </View>  
                            </View> 
                        </View>
            */}
                </View>
            </View> 
        </Link>     
    );
}
