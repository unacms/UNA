import React from 'react';
import { useEffect } from 'react';
//import { Dropdown } from 'flowbite';
import Menu from '../menu';

export default function MenuMore(oProps) {
    return <View><Text>TODO:Dropdown menu</Text></View>;
    const handleDo = (event, oProps) => {

        const oReactionsPopup = new Dropdown(document.getElementById(getName('ddm')), document.getElementById(getName('ddb')));
        if(oReactionsPopup != undefined)
            oReactionsPopup.hide();
    };

    useEffect(() => {
        const oReactionsPopup = new Dropdown(document.getElementById('mm-menu'), document.getElementById('mm-button'), {placement: 'bottom-end', trigger:'click'});
    }, []);

    return (
        <>
            <button id="mm-button" type="button" className="group inline-flex items-center p-1.5 text-xs font-medium text-gray-700 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 dark:active:bg-gray-700 bg-transparent active:bg-gray-200 active:shadow-inner hover:text-gray-900 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:text-gray-300 dark:hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5  group-active/button:scale-150 duration-200">
                    <path d="M3 10a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zM8.5 10a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zM15.5 8.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" />
                </svg>
            </button>
            <div id="mm-menu" className="z-10 hidden bg-white divide-y divide-gray-100 rounded-lg shadow dark:bg-gray-700">
                <Menu {...oProps} displayType="link" showSelected="undefined" except={['more-auto']} params={{showVertical: true, showTitleOnly: true, onclick: handleDo}} />
            </div>
        </>
    );
}
