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

    //TODO: rework url
    let url = '/' + data.url;
    
    return (
        <Link href={url} className="flex-col ">
            <View className='flex-col mx-2 my-1 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700/60  rounded-lg  '>
                <View className='flex-row mx-4 my-3'>
                    <View className="flex-col flex-1">
                        <View className="">       
                            <Profile {...data.author_data} showLinks="false" className="" />
                        </View>    
                        
                        <View className="">
                            <Time className="" ts={data.date}></Time>
                        </View>

                        
                    </View> 
                    <View className="flex-none flex-col  bg-blue-500 rounded-full  mr-auto px-1.5 mb-auto ">    
                            <Text className=" text-xs font-bold text-white dark:text-gray-800">{data.cmts.count}</Text>  
                    </View>
                </View>


                {oImage &&
                    <View className=" flex-row mb-3 "><Image {...oImage} alt={data.title} resizeMode="cover" className="  w-full aspect-video " /></View>
                }  
                <View className="flex-col ">
                    <Text className="hidden  ">{data.description}</Text>
                    <Text className="mx-4 mb-3 text-lg  font-bold tracking-tight leading-6 text-gray-800 dark:text-gray-100 ">{data.content.title}</Text>
                    
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
