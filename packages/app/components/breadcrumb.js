import Link from './atoms/link';
//import { useRouter } from 'next/router';
import {Text} from 'app/design/typography'

export default function (props) {
    //const router = useRouter();
    return <Text>TODO: breadcrumbs here</Text>
/*
    return (
        <div className="sticky top-0 z-40 bg-opacity-70 dark:bg-opacity-70 backdrop-blur-md  bg-gray-50 dark:bg-gray-800 text-sm font-semibold text-center text-gray-500 border-b border-gray-300 dark:text-gray-400  dark:border-gray-800/50">
            <ul className="flex  ">
                <li className="">
                    <button className="inline-block p-2 m-2  hover:bg-gray-300/50 dark:hover:bg-gray-700/50 rounded-full  hover:text-gray-800 dark:hover:text-100 dark:hover:text-gray-300"
                        onClick={() => router.back()}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                        </svg>
                    </button> 
                </li>
                <li className="my-auto">
                    <Link href={props.content.url} key="u" title="Collegues" className="w-full group flex items-center p-1 m-1 leading-6 hover:bg-gray-300/50 dark:hover:bg-gray-700/50 rounded-full hover:text-gray-800 dark:hover:text-100  dark:hover:text-gray-300"> 
                        <div className="flex  h-8 w-8 rounded-full items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                                         <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
                                    </svg>

                        </div>
                        
                        {props.content.name}

                
                    </Link>
                </li>
                <li className="my-auto opacity-50 ml-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                      <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                    </svg>
                </li>
                <li className="my-auto">
                    <Link href={props.content.url} key="u" title="Collegues" className="w-full group flex items-center  p-1 m-1 leading-6 hover:bg-gray-300/50 dark:hover:bg-gray-700/50 rounded-full hover:text-gray-800 dark:hover:text-100  dark:hover:text-gray-300"> 
                        <div className="flex  h-8 w-8 rounded-full items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                                 <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                                </svg>


                        </div>
                        
                        Category

                
                    </Link>
                </li>
            </ul>
        </div>
    );
*/
}
