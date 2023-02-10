import Router from "next/router";
import { useEffect, useState } from 'react'

export default function (props) {
    const [loading, setLoading] = useState(false);
    const [url, setUrl] = useState(false);
    useEffect(() => {
        Router.events.on("routeChangeStart", (url, { shallow }) => {
            setLoading(true);
            setUrl(url);
        });
        Router.events.on("routeChangeComplete", (url, { shallow }) => {
            setLoading(false);
        });
        Router.events.on("routeChangeError", (url, { shallow }) => {
            setLoading(false);
        });
        
    }, []);
    
    var skeleton = '';
    if (url){
        skeleton = (url == '/posts-home' ? 'posts-home' : skeleton);
        skeleton = (url == '/groups-home' ? 'groups-home' : skeleton);
        skeleton = (url == '/persons-home' ? 'persons-home' : skeleton);
        skeleton = (url.includes('view-post') ? 'view-post' : skeleton);
        skeleton = (url.includes('view-group-profile') ? 'view-group' : skeleton);
        skeleton = (url.includes('view-persons-profile') ? 'view-person' : skeleton);
    }

    var skeletons = {
        '' : <>
        <div className="sticky z-40 bg-opacity-70 dark:bg-opacity-70 backdrop-blur-md top-0 bg-gray-50 dark:bg-gray-900 text-sm font-semibold text-center text-gray-500 border-b border-gray-300 dark:text-gray-400 dark:border-gray-800">
            <ul className="flex -mb-px">
                <li className="w-full">
                    <a href="/persons-home" key="u" title="Collegues" className="w-full inline-block p-4 border-b-2 border-transparent rounded-t-lg hover:text-gray-800 dark:hover:text-100 hover:border-gray-400 dark:hover:border-gray-700 dark:hover:text-gray-300">&nbsp;</a>
                </li>
            </ul>
        </div>
        <div className="bg-gray-500/5 @xl/cell:rounded-lg p-4 mt-[1px] @xl/cell:mx-4 @xl/cell:mt-4 flex flex-col gap-6">
            <div className="animate-pulse flex gap-3">
                <div className="rounded-full bg-gray-600/20 h-12 w-12"></div>
                <div className="flex-1 space-y-2 py-1">
                    <div className="h-5 w-1/2 bg-gray-600/20 rounded"></div>    
                    <div className="h-3 w-1/3 bg-gray-600/20 rounded"></div>
                </div>
            </div>
            <div className="flex-1 animate-pulse space-y-4 py-1">
                <div className="h-6 w-2/3 bg-gray-600/20 rounded"></div>
                <div className="space-y-2">
                    <div className="h-4 bg-gray-600/20 rounded"></div>
                    <div className="h-4 bg-gray-600/20 rounded"></div>
                    <div className="h-4 bg-gray-600/20 rounded"></div>
                </div>
            </div>
        </div>
    </>, 
    'posts-home' : <div className="flex flex-col @xl/cell:gap-2">
        <div className="bg-gray-500/5 @xl/cell:rounded-lg p-4 @xl/cell:h-48 @xl/cell:mx-4 mt-[1px] @xl/cell:mt-4">
            <div className="animate-pulse h-full flex @xl/cell:flex-col-reverse gap-4">
                <div className=" flex-none  flex gap-3">
                    <div className="rounded-full bg-gray-600/20 h-12 w-12 flex-none"></div>
                    <div className="hidden @xl/cell:flex flex-auto flex-col gap-2 my-auto">
                        <div className="h-4 w-1/3 bg-gray-600/20 rounded-full"></div>
                        <div className="h-3 w-1/4 bg-gray-600/20 rounded-full"></div>
                    </div>
                </div>
                

                <div className="flex-auto flex flex-col gap-y-2.5 ">
                    <div className="@xl/cell:hidden h-4 w-1/2 bg-gray-600/20 rounded-full"></div>
                    <div className="h-5 w-2/3 bg-gray-600/30 rounded-full"></div>
                    <div className="space-y-1.5 ">
                        <div className="h-3 bg-gray-600/20 rounded-full"></div>
                        <div className="h-3 bg-gray-600/20 rounded-full"></div>
                    </div>
                </div>
            </div>
        </div>
        <div className="bg-gray-500/5 @xl/cell:rounded-lg p-4 @xl/cell:h-48 @xl/cell:mx-4 mt-[1px]">
            <div className="animate-pulse h-full flex @xl/cell:flex-col-reverse gap-4">
                <div className=" flex-none  flex gap-3">
                    <div className="rounded-full bg-gray-600/20 h-12 w-12 flex-none"></div>
                    <div className="hidden @xl/cell:flex flex-auto flex-col gap-2 my-auto">
                        <div className="h-4 w-1/3 bg-gray-600/20 rounded-full"></div>
                        <div className="h-3 w-1/4 bg-gray-600/20 rounded-full"></div>
                    </div>
                </div>
                

                <div className="flex-auto flex flex-col gap-y-2.5 ">
                    <div className="@xl/cell:hidden h-4 w-1/2 bg-gray-600/20 rounded-full"></div>
                    <div className="h-5 w-2/3 bg-gray-600/30 rounded-full"></div>
                    <div className="space-y-1.5 ">
                        <div className="h-3 bg-gray-600/20 rounded-full"></div>
                        <div className="h-3 bg-gray-600/20 rounded-full"></div>
                    </div>
                </div>
            </div>
        </div>
        <div className="bg-gray-500/5 @xl/cell:rounded-lg p-4 @xl/cell:h-48 @xl/cell:mx-4 mt-[1px]">
            <div className="animate-pulse h-full flex @xl/cell:flex-col-reverse gap-4">
                <div className=" flex-none  flex gap-3">
                    <div className="rounded-full bg-gray-600/20 h-12 w-12 flex-none"></div>
                    <div className="hidden @xl/cell:flex flex-auto flex-col gap-2 my-auto">
                        <div className="h-4 w-1/3 bg-gray-600/20 rounded-full"></div>
                        <div className="h-3 w-1/4 bg-gray-600/20 rounded-full"></div>
                    </div>
                </div>
                

                <div className="flex-auto flex flex-col gap-y-2.5 ">
                    <div className="@xl/cell:hidden h-4 w-1/2 bg-gray-600/20 rounded-full"></div>
                    <div className="h-5 w-2/3 bg-gray-600/30 rounded-full"></div>
                    <div className="space-y-1.5 ">
                        <div className="h-3 bg-gray-600/20 rounded-full"></div>
                        <div className="h-3 bg-gray-600/20 rounded-full"></div>
                    </div>
                </div>
            </div>
        </div>
     

    </div>,
    'groups-home' : <div>
        <div className="bg-gray-500/5 @xl/cell:rounded-lg p-4  @xl/cell:mx-4 mt-[1px] @xl/cell:mt-4">groups-home
            <div className="animate-pulse flex gap-3">
                <div className="rounded-full bg-gray-600/20 h-10 w-10"></div>
                <div className="flex-1 space-y-2 py-1">
                    <div className="h-5 w-1/2 bg-gray-600/20 rounded"></div>
                    <div className="space-y-1">
                        <div className="h-3 bg-gray-600/20 rounded"></div>
                        <div className="h-3 bg-gray-600/20 rounded"></div>
                        <div className="h-3 bg-gray-600/20 rounded"></div>
                    </div>
                </div>
            </div>
        </div>
        <div className="bg-gray-500/5 @xl/cell:rounded-lg p-4  @xl/cell:mx-4 mt-[1px] @xl/cell:mt-4">
            <div className="animate-pulse flex gap-3">
                <div className="rounded-full bg-gray-600/20 h-10 w-10"></div>
                <div className="flex-1 space-y-2 py-1">
                    <div className="h-5 w-1/2 bg-gray-600/20 rounded"></div>
                    <div className="space-y-1">
                        <div className="h-3 bg-gray-600/20 rounded"></div>
                        <div className="h-3 bg-gray-600/20 rounded"></div>
                        <div className="h-3 bg-gray-600/20 rounded"></div>
                    </div>
                </div>
            </div>
        </div>
        <div className="bg-gray-500/5 @xl/cell:rounded-lg p-4  @xl/cell:mx-4 mt-[1px] @xl/cell:mt-4">
            <div className="animate-pulse flex gap-3">
                <div className="rounded-full bg-gray-600/20 h-10 w-10"></div>
                <div className="flex-1 space-y-2 py-1">
                    <div className="h-5 w-1/2 bg-gray-600/20 rounded"></div>
                    <div className="space-y-1">
                        <div className="h-3 bg-gray-600/20 rounded"></div>
                        <div className="h-3 bg-gray-600/20 rounded"></div>
                        <div className="h-3 bg-gray-600/20 rounded"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>,
    'persons-home' : <div>
        <div className="bg-gray-500/5 @xl/cell:rounded-lg p-4  @xl/cell:mx-4 mt-[1px] @xl/cell:mt-4">persons-home
            <div className="animate-pulse flex gap-3">
                <div className="rounded-full bg-gray-600/20 h-10 w-10"></div>
                <div className="flex-1 space-y-2 py-1">
                    <div className="h-5 w-1/2 bg-gray-600/20 rounded"></div>
                    <div className="space-y-1">
                        <div className="h-3 bg-gray-600/20 rounded"></div>
                        <div className="h-3 bg-gray-600/20 rounded"></div>
                        <div className="h-3 bg-gray-600/20 rounded"></div>
                    </div>
                </div>
            </div>
        </div>
        <div className="bg-gray-500/5 @xl/cell:rounded-lg p-4  @xl/cell:mx-4 mt-[1px] @xl/cell:mt-4">
            <div className="animate-pulse flex gap-3">
                <div className="rounded-full bg-gray-600/20 h-10 w-10"></div>
                <div className="flex-1 space-y-2 py-1">
                    <div className="h-5 w-1/2 bg-gray-600/20 rounded"></div>
                    <div className="space-y-1">
                        <div className="h-3 bg-gray-600/20 rounded"></div>
                        <div className="h-3 bg-gray-600/20 rounded"></div>
                        <div className="h-3 bg-gray-600/20 rounded"></div>
                    </div>
                </div>
            </div>
        </div>
        <div className="bg-gray-500/5 @xl/cell:rounded-lg p-4  @xl/cell:mx-4 mt-[1px] @xl/cell:mt-4">
            <div className="animate-pulse flex gap-3">
                <div className="rounded-full bg-gray-600/20 h-10 w-10"></div>
                <div className="flex-1 space-y-2 py-1">
                    <div className="h-5 w-1/2 bg-gray-600/20 rounded"></div>
                    <div className="space-y-1">
                        <div className="h-3 bg-gray-600/20 rounded"></div>
                        <div className="h-3 bg-gray-600/20 rounded"></div>
                        <div className="h-3 bg-gray-600/20 rounded"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>,
    'view-post' : 
            <div>
           <div className="bg-gray-500/5 @xl/cell:rounded-lg p-4 mt-[1px] @xl/cell:mx-4 @xl/cell:mt-4 flex flex-col gap-6">
            <div className="animate-pulse flex gap-3">
                <div className="rounded-full bg-gray-600/20 h-12 w-12"></div>
                <div className="flex-1 space-y-2 py-1">
                    <div className="h-5 w-1/2 bg-gray-600/20 rounded-full"></div>    
                    <div className="h-3 w-1/3 bg-gray-600/20 rounded-full"></div>
                </div>
            </div>
            <div className="flex-1 animate-pulse space-y-2 py-1">
                <div className="h-6  bg-gray-600/20 rounded-full"></div>
                <div className="h-6 w-2/3 bg-gray-600/20 rounded-full"></div>
                <div className="space-y-2.5 pt-3">
                    <div className="h-4 bg-gray-600/20 rounded-full"></div>
                    <div className="h-4 bg-gray-600/20 rounded-full"></div>
                    <div className="h-4 bg-gray-600/20 rounded-full"></div>
                    <div className="h-4 bg-gray-600/20 rounded-full"></div>
                    <div className="h-4 bg-gray-600/20 rounded-full"></div>
                    <div className="h-4 bg-gray-600/20 rounded-full w-2/3"></div>
                </div>
            </div>
 
    </div>
    </div>,
    'view-group' : <div>
        <div className="bg-gray-500/5 @xl/cell:rounded-lg p-4  @xl/cell:mx-4 mt-[1px] @xl/cell:mt-4">view-group
            <div className="animate-pulse flex gap-3">
                <div className="rounded-full bg-gray-600/20 h-10 w-10"></div>
                <div className="flex-1 space-y-2 py-1">
                    <div className="h-5 w-1/2 bg-gray-600/20 rounded"></div>
                    <div className="space-y-1">
                        <div className="h-3 bg-gray-600/20 rounded"></div>
                        <div className="h-3 bg-gray-600/20 rounded"></div>
                        <div className="h-3 bg-gray-600/20 rounded"></div>
                    </div>
                </div>
            </div>
        </div>
        <div className="bg-gray-500/5 @xl/cell:rounded-lg p-4  @xl/cell:mx-4 mt-[1px] @xl/cell:mt-4">
            <div className="animate-pulse flex gap-3">
                <div className="rounded-full bg-gray-600/20 h-10 w-10"></div>
                <div className="flex-1 space-y-2 py-1">
                    <div className="h-5 w-1/2 bg-gray-600/20 rounded"></div>
                    <div className="space-y-1">
                        <div className="h-3 bg-gray-600/20 rounded"></div>
                        <div className="h-3 bg-gray-600/20 rounded"></div>
                        <div className="h-3 bg-gray-600/20 rounded"></div>
                    </div>
                </div>
            </div>
        </div>
        <div className="bg-gray-500/5 @xl/cell:rounded-lg p-4  @xl/cell:mx-4 mt-[1px] @xl/cell:mt-4">
            <div className="animate-pulse flex gap-3">
                <div className="rounded-full bg-gray-600/20 h-10 w-10"></div>
                <div className="flex-1 space-y-2 py-1">
                    <div className="h-5 w-1/2 bg-gray-600/20 rounded"></div>
                    <div className="space-y-1">
                        <div className="h-3 bg-gray-600/20 rounded"></div>
                        <div className="h-3 bg-gray-600/20 rounded"></div>
                        <div className="h-3 bg-gray-600/20 rounded"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>,
    'view-person' : <div>
        <div className="bg-gray-500/5 @xl/cell:rounded-lg p-4  @xl/cell:mx-4 mt-[1px] @xl/cell:mt-4">view-person
            <div className="animate-pulse flex gap-3">
                <div className="rounded-full bg-gray-600/20 h-10 w-10"></div>
                <div className="flex-1 space-y-2 py-1">
                    <div className="h-5 w-1/2 bg-gray-600/20 rounded"></div>
                    <div className="space-y-1">
                        <div className="h-3 bg-gray-600/20 rounded"></div>
                        <div className="h-3 bg-gray-600/20 rounded"></div>
                        <div className="h-3 bg-gray-600/20 rounded"></div>
                    </div>
                </div>
            </div>
        </div>
        <div className="bg-gray-500/5 @xl/cell:rounded-lg p-4  @xl/cell:mx-4 mt-[1px] @xl/cell:mt-4">
            <div className="animate-pulse flex gap-3">
                <div className="rounded-full bg-gray-600/20 h-10 w-10"></div>
                <div className="flex-1 space-y-2 py-1">
                    <div className="h-5 w-1/2 bg-gray-600/20 rounded"></div>
                    <div className="space-y-1">
                        <div className="h-3 bg-gray-600/20 rounded"></div>
                        <div className="h-3 bg-gray-600/20 rounded"></div>
                        <div className="h-3 bg-gray-600/20 rounded"></div>
                    </div>
                </div>
            </div>
        </div>
        <div className="bg-gray-500/5 @xl/cell:rounded-lg p-4  @xl/cell:mx-4 mt-[1px] @xl/cell:mt-4">
            <div className="animate-pulse flex gap-3">
                <div className="rounded-full bg-gray-600/20 h-10 w-10"></div>
                <div className="flex-1 space-y-2 py-1">
                    <div className="h-5 w-1/2 bg-gray-600/20 rounded"></div>
                    <div className="space-y-1">
                        <div className="h-3 bg-gray-600/20 rounded"></div>
                        <div className="h-3 bg-gray-600/20 rounded"></div>
                        <div className="h-3 bg-gray-600/20 rounded"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    };

    return [loading, skeletons[skeleton]];
}