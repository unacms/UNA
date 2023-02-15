import { siteTitle } from "./layout";
import Link from './atoms/link';
import { View } from 'app/design/view'
import { Text } from 'app/design/typography'

export default function () {
    let year = new Date().getFullYear();
 	return <View><Text>TODO:footer</Text></View>
    return (
        <View className="fixed sm:relative z-10 bottom-0 left-0  w-full">
            <View className=" sm:flex  flex-wrap gap-4 w-full sm:w-auto  sm:p-4 bg-white border-t sm:border sm:m-4 sm:rounded-lg border-gray-200  md:p-6 dark:bg-gray-800 dark:border-gray-600/50">
                <span className="hidden sm:block  flex-auto text-sm text-gray-500  dark:text-gray-400">Powered by <a href="https://una.io" className="hover:underline text-gray-900 dark:text-gray-50 font-semibold">UNA</a>
                </span>
                <ul className="hidden sm:flex z-10 flex-wrap items-center mt-3 text-sm text-gray-500 dark:text-gray-400 sm:mt-0">
                    <li>
                        <Link href="/about" title="About" className="mr-4 hover:underline md:mr-6">About</Link>
                    </li>
                    <li>
                        <Link href="/privacy" title="Privacy Policy" className="mr-4 hover:underline md:mr-6">Privacy Policy</Link>
                    </li>
                    <li>
                        <Link href="/licensing" title="" className="mr-4 hover:underline md:mr-6">Licensing</Link>
                    </li>
                    <li>
                        <Link href="/contact" title="Contact" className="mr-4 hover:underline md:mr-6">Contact</Link>
                    </li>
                </ul>
                <View className="flex sm:hidden justify-between items-center ">
                    <View data-dial-init className="fixed right-6 bottom-24 group">
                        <View id="speed-dial-menu-default" className="flex flex-col items-center hidden mb-4 space-y-2">
                            <button type="button" data-tooltip-target="tooltip-share" data-tooltip-placement="left" className="flex justify-center items-center w-[52px] h-[52px] text-gray-500 hover:text-gray-900 bg-white rounded-full border border-gray-200 dark:border-gray-600 shadow-sm dark:hover:text-white dark:text-gray-400 hover:bg-gray-50 dark:bg-gray-700 dark:hover:bg-gray-600 focus:ring-4 focus:ring-gray-300 focus:outline-none dark:focus:ring-gray-400">
                                <svg aria-hidden="true" className="w-6 h-6 -ml-px " fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z"></path></svg>
                                <span className="sr-only">Share</span>
                            </button>
                            <View id="tooltip-share" role="tooltip" className="absolute z-10 invisible inline-block w-auto px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700">
                                Share
                                <View className="tooltip-arrow" data-popper-arrow></View>
                            </View>
                            <button type="button" data-tooltip-target="tooltip-print" data-tooltip-placement="left" className="flex justify-center items-center w-[52px] h-[52px] text-gray-500 hover:text-gray-900 bg-white rounded-full border border-gray-200 dark:border-gray-600 shadow-sm dark:hover:text-white dark:text-gray-400 hover:bg-gray-50 dark:bg-gray-700 dark:hover:bg-gray-600 focus:ring-4 focus:ring-gray-300 focus:outline-none dark:focus:ring-gray-400">
                                <svg aria-hidden="true" className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd"></path></svg>
                                <span className="sr-only">Print</span>
                            </button>
                            <View id="tooltip-print" role="tooltip" className="absolute z-10 invisible inline-block w-auto px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700">
                                Print
                                <View className="tooltip-arrow" data-popper-arrow></View>
                            </View>
                            <button type="button" data-tooltip-target="tooltip-download" data-tooltip-placement="left" className="flex justify-center items-center w-[52px] h-[52px] text-gray-500 hover:text-gray-900 bg-white rounded-full border border-gray-200 dark:border-gray-600 shadow-sm dark:hover:text-white dark:text-gray-400 hover:bg-gray-50 dark:bg-gray-700 dark:hover:bg-gray-600 focus:ring-4 focus:ring-gray-300 focus:outline-none dark:focus:ring-gray-400">
                                <svg aria-hidden="true" className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path clipRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V8a2 2 0 00-2-2h-5L9 4H4zm7 5a1 1 0 00-2 0v1.586l-.293-.293a.999.999 0 10-1.414 1.414l2 2a.999.999 0 001.414 0l2-2a.999.999 0 10-1.414-1.414l-.293.293V9z" fillRule="evenodd"></path></svg>
                                <span className="sr-only">Download</span>
                            </button>
                            <View id="tooltip-download" role="tooltip" className="absolute z-10 invisible inline-block w-auto px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700">
                                Download
                                <View className="tooltip-arrow" data-popper-arrow></View>
                            </View>
                            <button type="button" data-tooltip-target="tooltip-copy" data-tooltip-placement="left" className="flex justify-center items-center w-[52px] h-[52px] text-gray-500 hover:text-gray-900 bg-white rounded-full border border-gray-200 dark:border-gray-600 dark:hover:text-white shadow-sm dark:text-gray-400 hover:bg-gray-50 dark:bg-gray-700 dark:hover:bg-gray-600 focus:ring-4 focus:ring-gray-300 focus:outline-none dark:focus:ring-gray-400">
                                <svg aria-hidden="true" className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z"></path><path d="M5 3a2 2 0 00-2 2v6a2 2 0 002 2V5h8a2 2 0 00-2-2H5z"></path></svg>
                                <span className="sr-only">Copy</span>
                            </button>
                            <View id="tooltip-copy" role="tooltip" className="absolute z-10 invisible inline-block w-auto px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700">
                                Copy
                                <View className="tooltip-arrow" data-popper-arrow></View>
                            </View>
                        </View>
                        <button type="button" data-dial-toggle="speed-dial-menu-default" aria-controls="speed-dial-menu-default" aria-expanded="false" className="shadow-xl flex items-center justify-center text-white bg-primary rounded-full w-14 h-14 hover:bg-primary-docus dark:bg-primary-dark dark:hover:bg-primary-focus-dark focus:ring-4 focus:ring-blue-300 focus:outline-none dark:focus:ring-blue-800">
                            <svg aria-hidden="true" className="w-8 h-8 transition-transform group-hover:rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                            <span className="sr-only">Open actions menu</span>
                        </button>
                    </View>
                        <View className="flex items-center px-1 sm:px-4 pb-1  flex-auto flex-row w-full">
                            <button type="button" className=" flex-auto text-blue-600 hover:bg-gray-50 active:bg-gray-100 dark:hover:bg-gray-700/50 dark:active:bg-gray-700 cursor-pointer hover:text-gray-900  dark:hover:text-white ">
                                <View className='w-full flex flex-col'>
                                        <View className="h-1 flex-none rounded-full bg-blue-500 "></View>
                                        <View className="flex-auto items-center  px-4   rounded-full leading-6 py-2 mb-2.5 mt-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 mx-auto">
                                                <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" />
                                                <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z" />
                                            </svg>
                                        </View>
                                        
                                </View>
                                <span className="sr-only">Home</span>
                            </button>
                            <button type="button" className="flex-auto group text-gray-500 hover:text-gray-900 hover:bg-gray-50 active:bg-gray-100 dark:hover:bg-gray-700/50 dark:active:bg-gray-700 cursor-pointer   dark:hover:text-white">
                                <View className='w-full flex flex-col'>
                                        <View className="h-1 flex-none rounded-full group-active:bg-blue-500 "></View>
                                        <View className="flex-auto items-center  px-4   rounded-full leading-6 py-2 mb-2 mt-1">
                                            
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6 mx-auto">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                                            </svg>
                                        </View>
                                        
                                </View>
                            </button>
                            <button type="button" className="flex-auto group text-gray-500 hover:text-gray-900 hover:bg-gray-50 active:bg-gray-100 dark:hover:bg-gray-700/50 dark:active:bg-gray-700 cursor-pointer   dark:hover:text-white">
                                <View className='w-full flex flex-col'>
                                        <View className="h-1 flex-none rounded-full group-active:bg-blue-500 "></View>
                                        <View className="flex-auto items-center  px-4   rounded-full leading-6 py-2 mb-2 mt-1">
                                            
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6 mx-auto">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                                        </svg>
                                        </View>
                                </View>
                            </button>
                            <button type="button" className="flex-auto group text-gray-500 hover:text-gray-900 hover:bg-gray-50 active:bg-gray-100 dark:hover:bg-gray-700/50 dark:active:bg-gray-700 cursor-pointer   dark:hover:text-white">
                                <View className='w-full flex flex-col'>
                                        <View className="h-1 flex-none rounded-full group-active:bg-blue-500 "></View>
                                        <View className="flex-auto items-center  px-4   rounded-full leading-6 py-2 mb-2 mt-1">
                                            
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6 mx-auto">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                            </svg>
                                        </View>
                                        
                                </View>
                            </button>
                            <button type="button" className="flex-auto group text-gray-500 hover:text-gray-900 hover:bg-gray-50 active:bg-gray-100 dark:hover:bg-gray-700/50 dark:active:bg-gray-700 cursor-pointer   dark:hover:text-white">
                                <View className='w-full flex flex-col'>
                                        <View className="h-1 flex-none rounded-full group-active:bg-blue-500 "></View>
                                        <View className="flex-auto items-center  px-4   rounded-full leading-6 py-2 mb-2 mt-1">
                                            
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6 mx-auto">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                                        </svg>
                                        </View>  
                                </View>
                            </button>
                        </View>      
                </View>
            </View>
        </View>
    );
} 
