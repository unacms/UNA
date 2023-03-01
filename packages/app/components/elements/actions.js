import { Platform } from 'react-native';
import { A, Text } from 'app/design/typography';
import { View } from 'app/design/view';
import Menu from '../menu';

export default function ElementActions(props) {
    return (
        <View className="relative sm:my-0 sm:rounded-b-lg bg-card dark:bg-card-dark border-b border-bordercolor/10 dark:border-bordercolor-dark/10 sm:border-x w-full mx-auto max-w-5xl">
            <View className="flex flex-col divide-y divide-gray-500/5 w-full">
                <View className='flex-none flex flex-wrap flex-row items-center h-min my-auto p-2'>
                    <Menu {...props.data} displayType="element" showMatched="true" params={{show_action: false, show_counter: true}} />
                    <View className='flex-auto flex-row justify-end items-end'>
                        <A className="ml-auto inline-flex flex-none group  active:opacity-80 active:shadow-none items-center p-1.5   dark:hover:bg-gray-800 dark:active:bg-gray-700  active:bg-gray-200   text-sm focus:outline-none font-medium text-gray-700 bg-white  focus:z-10 focus:ring-4 focus:ring-gray-200  border-gray-200 hover:border-gray-300 rounded-full hover:bg-gray-100 bg-transparent hover:text-gray-900  focus:text-blue-700 dark:border-gray-700/50 dark:hover:border-gray-700 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700/80 dark:focus:text-white">
                            {Platform.OS == 'web' && 
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5  group-active:scale-150 duration-200 fill-current">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                            </svg>
                            }
                            <Text className=' pl-1 pr-0.5'>24</Text><Text className='hidden @3xl/cell:block pr-0.5 truncate'>comments </Text>
                        </A>
                        <A className="inline-flex flex-none group  active:opacity-80 active:shadow-none items-center p-1.5   dark:hover:bg-gray-800 dark:active:bg-gray-700  active:bg-gray-200   text-sm focus:outline-none font-medium text-gray-700 bg-white  focus:z-10 focus:ring-4 focus:ring-gray-200  border-gray-200 hover:border-gray-300 rounded-full hover:bg-gray-100 bg-transparent hover:text-gray-900  focus:text-blue-700 dark:border-gray-700/50 dark:hover:border-gray-700 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700/80 dark:focus:text-white">
                            {Platform.OS == 'web' && 
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"  className="w-5 h-5 group-active:-rotate-45  group-active:-translate-y-2 group-active:scale-150 duration-200 fill-current">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75A2.25 2.25 0 0116.5 4.5c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.904M14.25 9h2.25M5.904 18.75c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 01-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 10.203 4.167 9.75 5 9.75h1.053c.472 0 .745.556.5.96a8.958 8.958 0 00-1.302 4.665c0 1.194.232 2.333.654 3.375z" />
                            </svg>
                            }
                            <Text className=' pl-1 pr-0.5'>98K</Text>
                        </A>
                        <A className="inline-flex flex-none group  active:opacity-80 active:shadow-none items-center p-1.5   dark:hover:bg-gray-800 dark:active:bg-gray-700  active:bg-gray-200   text-sm focus:outline-none font-medium text-gray-700 bg-white  focus:z-10 focus:ring-4 focus:ring-gray-200  border-gray-200 hover:border-gray-300 rounded-full hover:bg-gray-100 bg-transparent hover:text-gray-900  focus:text-blue-700 dark:border-gray-700/50 dark:hover:border-gray-700 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700/80 dark:focus:text-white">
                            {Platform.OS == 'web' && 
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5  group-active:scale-150 duration-200 fill-current">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                            </svg>
                            }
                            <Text className=' pl-1 pr-0.5'>249K</Text><Text className='hidden @3xl/cell:block pr-0.5 truncate'>views </Text>
                        </A>
                    </View>
                </View>
                <View className="flex flex-wrap flex-auto p-2">
                    <Menu {...props.data} displayType="element" showMatched="true" params={{show_action: true, show_counter: false}} />
                </View>
            </View>
        </View>
    );
}