import Link from '../atoms/link';
import Profile from './profile';

import { Text} from 'app/design/typography'
import { View } from 'app/design/view'

export default function AtomProfile(oProps) {
    return <View><Text>{oProps.display_name}</Text></View>
/*
    var sResult = '';

    //--- display type
    const sDisplayType = oProps.displayType ? oProps.displayType : oProps.display_type;
    
    //--- the profile image size
    const sDisplaySize = oProps.displaySize ? oProps.displaySize : 'base';

    var sSize = '';
    switch(sDisplaySize) {
        case 'xs':
            sSize = 'w-6 h-6';
            break;

        case 'sm':
            sSize = 'w-10 h-10';
            break;

        case 'base':
            sSize = 'w-12 h-12';
            break;

        case 'lg':
            sSize = 'w-14 h-14';
            break;

        case 'xl':
            sSize = 'w-20 h-20';
            break;
    }
    sSize += ' rounded-full border border-gray-500/30 ';

    //--- with clickable Username (or not)
    const bShowLinks = !oProps.showLinks || oProps.showLinks === 'true';

    function DisplayNameLink(oProps) {
        return (
            <Link className="bx-def-unit-title hover:underline" href={oProps.url}>{oProps.title}</Link>
        );
    }

    function DisplayNameText(oProps) {
        return (
            <span className="bx-def-unit-title">{oProps.title}</span>
        );
    }

    //--- with custom or default info section
    function DisplayInfo(oProps) {
        return (
            <div className="bx-def-unit-info flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M9.664 1.319a.75.75 0 01.672 0 41.059 41.059 0 018.198 5.424.75.75 0 01-.254 1.285 31.372 31.372 0 00-7.86 3.83.75.75 0 01-.84 0 31.508 31.508 0 00-2.08-1.287V9.394c0-.244.116-.463.302-.592a35.504 35.504 0 013.305-2.033.75.75 0 00-.714-1.319 37 37 0 00-3.446 2.12A2.216 2.216 0 006 9.393v.38a31.293 31.293 0 00-4.28-1.746.75.75 0 01-.254-1.285 41.059 41.059 0 018.198-5.424zM6 11.459a29.848 29.848 0 00-2.455-1.158 41.029 41.029 0 00-.39 3.114.75.75 0 00.419.74c.528.256 1.046.53 1.554.82-.21.324-.455.63-.739.914a.75.75 0 101.06 1.06c.37-.369.69-.77.96-1.193a26.61 26.61 0 013.095 2.348.75.75 0 00.992 0 26.547 26.547 0 015.93-3.95.75.75 0 00.42-.739 41.053 41.053 0 00-.39-3.114 29.925 29.925 0 00-5.199 2.801 2.25 2.25 0 01-2.514 0c-.41-.275-.826-.541-1.25-.797a6.985 6.985 0 01-1.084 3.45 26.503 26.503 0 00-1.281-.78A5.487 5.487 0 006 12v-.54z" clipRule="evenodd" />
                </svg>
                <span className="pl-1">Dermatology</span>
            </div>
        );
    }

    let sShowInfo = '';
    if(oProps.showInfo != undefined)
        sShowInfo = oProps.showInfo !== 'false' ? oProps.showInfo : '';
    else
        sShowInfo = <DisplayInfo {...oProps} />

    switch(sDisplayType) {
        case 'unit':
            sResult = (
                <div className="flex items-center w-full gap-2">
                    <div className="flex-none relative">
                        <Profile {...oProps} displayType="unit_wo_info"  />
                    </div>
                    <div className="flex-auto mb-auto mt-0.5 sm:my-auto">
                        <Profile {...oProps} displayType="unit_wo_image" />
                    </div>
                </div>
            );
            break;

        case 'unit_wo_info':
            sResult = (
                <div className="flex relative">
                    <img className={sSize} src={oProps.url_avatar} alt={oProps.display_name} />
                </div>
            );
            break;

        case 'unit_wo_image':
            sResult = (
                <div className="flex sm:flex-col gap-2">
                    <div className='flex gap-x-2 gap-y-1'>
                        <div className="flex-none font-semibold text-sm my-auto dark:hover:text-white hover:text-gray-900 text-gray-700 dark:text-gray-300">{bShowLinks ? <DisplayNameLink title={oProps.display_name} url={oProps.url} /> : <DisplayNameText title={oProps.display_name} />}</div>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500 text-xs sm:inline-flex font-medium tracking-tight">
                        <div className="flex gap-1 font-medium tracking-tight my-auto  text-xs sm:inline-flex items-center rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" className=" h-3 w-4 rounded-sm my-auto" id="flag-icons-au" viewBox="0 0 640 480">
                                <path fill="#00008B" d="M0 0h640v480H0z"/>
                                <path fill="#fff" d="m37.5 0 122 90.5L281 0h39v31l-120 89.5 120 89V240h-40l-120-89.5L40.5 240H0v-30l119.5-89L0 32V0z"/>
                                <path fill="red" d="M212 140.5 320 220v20l-135.5-99.5zm-92 10 3 17.5-96 72H0zM320 0v1.5l-124.5 94 1-22L295 0zM0 0l119.5 88h-30L0 21z"/>
                                <path fill="#fff" d="M120.5 0v240h80V0h-80ZM0 80v80h320V80H0Z"/>
                                <path fill="red" d="M0 96.5v48h320v-48zM136.5 0v240h48V0z"/>
                                <path fill="#fff" d="m527 396.7-20.5 2.6 2.2 20.5-14.8-14.4-14.7 14.5 2-20.5-20.5-2.4 17.3-11.2-10.9-17.5 19.6 6.5 6.9-19.5 7.1 19.4 19.5-6.7-10.7 17.6 17.4 11.1Zm-3.7-117.2 2.7-13-9.8-9 13.2-1.5 5.5-12.1 5.5 12.1 13.2 1.5-9.8 9 2.7 13-11.6-6.6-11.6 6.6Zm-104.1-60-20.3 2.2 1.8 20.3-14.4-14.5-14.8 14.1 2.4-20.3-20.2-2.7 17.3-10.8-10.5-17.5 19.3 6.8L387 178l6.7 19.3 19.4-6.3-10.9 17.3 17.1 11.2ZM623 186.7l-20.9 2.7 2.3 20.9-15.1-14.7-15 14.8 2.1-21-20.9-2.4 17.7-11.5-11.1-17.9 20 6.7 7-19.8 7.2 19.8 19.9-6.9-11 18 17.8 11.3Zm-96.1-83.5-20.7 2.3 1.9 20.8-14.7-14.8-15.1 14.4 2.4-20.7-20.7-2.8 17.7-11L467 73.5l19.7 6.9 7.3-19.5 6.8 19.7 19.8-6.5-11.1 17.6 17.4 11.5ZM234 385.7l-45.8 5.4 4.6 45.9-32.8-32.4-33 32.2 4.9-45.9-45.8-5.8 38.9-24.8-24-39.4 43.6 15 15.8-43.4 15.5 43.5 43.7-14.7-24.3 39.2 38.8 25.1Z"/>
                            </svg>
                            <span className="">AU</span>
                        </div>
                        <div className='sm:inline-flex items-center text-xs'>{sShowInfo}</div>
                     </div>
                </div>
            );
            break;

        default:
            sResult = (
                <div className="flex relative">
                    <div className={sSize}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                            <path d="M256 512c141.4 0 256-114.6 256-256S397.4 0 256 0S0 114.6 0 256S114.6 512 256 512zM169.8 165.3c7.9-22.3 29.1-37.3 52.8-37.3h58.3c34.9 0 63.1 28.3 63.1 63.1c0 22.6-12.1 43.5-31.7 54.8L280 264.4c-.2 13-10.9 23.6-24 23.6c-13.3 0-24-10.7-24-24V250.5c0-8.6 4.6-16.5 12.1-20.8l44.3-25.4c4.7-2.7 7.6-7.7 7.6-13.1c0-8.4-6.8-15.1-15.1-15.1H222.6c-3.4 0-6.4 2.1-7.5 5.3l-.4 1.2c-4.4 12.5-18.2 19-30.6 14.6s-19-18.2-14.6-30.6l.4-1.2zM288 352c0 17.7-14.3 32-32 32s-32-14.3-32-32s14.3-32 32-32s32 14.3 32 32z"/>
                        </svg>
                    </div>
                </div>
            );
    }

    return sResult;
*/
}
