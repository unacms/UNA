import Image from '../atoms/image';
import Link from '../atoms/link';
import Time from '../atoms/time';
import Profile from '../atoms/profile';

import { Text} from 'app/design/typography'
import { View } from 'app/design/view'


// g-med style browsing
export default function UnitFeed({data}) {
    var oImage = data.content.images.length > 0 ? data.content.images[0] : null;
    if (oImage == null)
        oImage = data.content.images_attach ? data.content.images_attach[0] : null;
    
        var oCmt = null;
    if (data.cmts.data.length > 0){
        oCmt = data.cmts.data[0][Object.keys(data.cmts.data[0])[0]].data;
    }

    return <View><Row><Text>TODO:feed unit</Text></Row></View>
    
    return (
        <Link href={data.url} className="mt-[1px] @xl/cell:mt-2 @xl/cell:first:mt-4 overflow-hidden border-gray-300/80 hover:border-gray-300  bg-white active:bg-gray-100 @xl/cell:hover:bg-gray-50 dark:active:bg-gray-700 dark:bg-gray-900 @xl/cell:dark:hover:bg-gray-800 dark:border-gray-800/50 dark:hover:border-gray-700/50 p-4  @xl/cell:hover:-translate-y-0.5 @xl/cell:hover:shadow-sm @xl/cell:border  @xl/cell:active:translate-y-1 @xl/cell:duration-300   @xl/cell:rounded-lg   gap-4 w-full">
            <div className='flex flex-col gap-2 @xl/cell:gap-4 flex-auto'>
                <div className="flex  flex-none gap-1">
                    <div className="flex-auto gap- block relative">       
                        <Profile {...data.author_data} showLinks="false" />
                    </div>    
                    <div className='flex-none flex flex-col mb-auto gap-1.5 mt-0.5  '>
                        <div className="whitespace-nowrap ml-auto flex-none font-medium tracking-tight  text-sm    ">
                            <Time className="" ts={data.date}></Time>
                        </div>
                        <div className="text-sm -mt-4 ring ring-white dark:ring-gray-900 -mr-1.5 @xl/cell:m-0 flex-none hidden @xl/cell:block font-medium   bg-blue-500 h-min  rounded-xl rounded-br-sm  ml-auto px-2  text-white dark:text-gray-800  ">{data.cmts.count}</div>

                    </div>
                </div> 
                {oImage &&
                    <div className="hidden @xl/cell:block  w-full aspect-video flex-none"><Image {...oImage} scale="width" alt={data.title} className="rounded-md aspect-video" /></div>
                }  
                <div className="flex flex-col flex-auto gap-2 @xl/cell:gap-4 -mt-8 @xl/cell:mt-0">                                
                    <p className="text-sm hidden  text-gray-600 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-blue-300  ">{data.description}</p>
                    <div className='flex gap-2 '>
                        <h2 className="text-base flex-auto mt-auto ml-14 @xl/cell:m-0  leading-tight @xl/cell:text-xl @xl/cell:leading-snug  font-bold tracking-tight text-gray-800 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400  ">{data.content.title}</h2>
                        <div className="text-sm hidden flex-none @xl/cell:hidden font-medium mt-auto  bg-blue-500 h-min  rounded-xl rounded-br  ml-auto px-2  text-white dark:text-gray-800  ">{data.cmts.count}</div>
                    </div>
                    {oCmt &&
                        <div className='flex gap-1  ml-12 @xl/cell:m-0'>
                            <div className='flex-none hidden @xl/cell:block'><Profile {...data.author_data} displayType="unit_wo_info" displaySize="sm" /></div>
                            <div className='flex w-full'>  
                                <div className='flex relative flex-none @xl/cell:flex-wrap gap-x-2  ml-1  w-full text-sm  bg-gray-300/50 dark:bg-gray-700/50 py-0.5 px-1.5  @xl/cell:py-1.5 @xl/cell:px-2.5 rounded-lg     '>
                                    <p className=' flex-none  hidden @xl/cell:line-clamp-1 my-auto font-semibold '>{oCmt.author_data.display_name}</p>
                                    <div className='flex-auto line-clamp-1 @xl/cell:line-clamp-2 text-gray-600 dark:text-gray-400  my-auto' dangerouslySetInnerHTML={{__html:oCmt.cmt_text}}/>
                                    <div className="text-sm -mt-4 ring ring-white dark:ring-gray-900 -mr-1.5 flex-none @xl/cell:hidden font-medium   bg-blue-500 h-min  rounded-xl rounded-br-sm  ml-auto px-2  text-white dark:text-gray-800  ">{data.cmts.count}</div>
                                </div>  
                            </div> 
                        </div>
                    }
                </div>
            </div> 
        </Link>     
    );
}
