import Link from './atoms/link';
//import {useRouter} from "next/router";
import { View } from 'app/design/view'
import { Text } from 'app/design/typography'

export default function ({ children }) {

//    const router = useRouter()
//    const path = router.asPath;
  
    return <View><Text>TODO:native tabbar</Text></View>
    return (

            <View className="sticky z-40 bg-opacity-70 dark:bg-opacity-70 backdrop-blur-md top-0 bg-gray-50 dark:bg-gray-800 text-sm font-semibold text-center text-gray-500 border-b border-gray-300 dark:text-gray-400 dark:border-gray-800/50">
                <View className="flex-row">
                <View className="flex-auto">
                        <Link href="/" key="x" title="Feed" className=" group flex flex-col w-full  text-gray-800 dark:text-gray-200   items-center">
                            <View>
                                <View className="flex-auto items-center w-full px-4 mx-auto group-hover:bg-gray-300/50  dark:group-hover:bg-gray-700/50 rounded-full leading-6 py-2 mt-2 mb-1"><Text>Feed</Text></View>
                             
                            </View>
                        </Link>
                    </View>
                    <View className="flex-auto">
                        <Link href="/groups-home" key="y" title="Groups" className="group flex flex-col w-full    hover:text-gray-800 dark:hover:text-100 items-center  dark:hover:text-gray-200">
                            <View>
                                <View className="flex-auto items-center w-full px-4 mx-auto group-hover:bg-gray-300/50  dark:group-hover:bg-gray-700/50 rounded-full leading-6 py-2 mt-2 mb-1"><Text>Groups</Text></View>
                              
                            </View>
                        </Link>
                    </View>
                    <View className="flex-auto">
                        <Link href="/posts-home" key="z" title="Posts" className="group flex flex-col w-full    hover:text-gray-800 dark:hover:text-100 items-center  dark:hover:text-gray-200">
                        <View>
                                <View className="flex-auto items-center px-4  group-hover:bg-gray-300/50  dark:group-hover:bg-gray-700/50 rounded-full leading-6 py-2 mt-2 mb-1"><Text>Posts</Text></View>
                               
                            </View>
                        </Link>
                    </View>
                    <View className="flex-auto">
                        <Link href="/persons-home" key="u" title="Collegues" className="group flex flex-col w-full hover:text-gray-800 dark:hover:text-100 items-center  dark:hover:text-gray-200">
                        <View>
                                <View className="flex-auto items-center px-4  group-hover:bg-gray-300/50  dark:group-hover:bg-gray-700/50 rounded-full leading-6 py-2 mt-2 mb-1"><Text>Collegues</Text></View>
                               
                            </View>
                        </Link>
                    </View>
                </View>
            </View>
    );
}
