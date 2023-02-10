import React from 'react';
import { useEffect, useState, useContext } from 'react';
// import { Dropdown } from 'flowbite';
import { fetcher } from '../../lib/util';
import { GlobalsData } from '../../context/context';
import Menu from '../menu';
import Profile from './profile';

import { Text} from 'app/design/typography'
import { View } from 'app/design/view'

export default function ElementLikes(oProps) {
    return <View><Text>TODO:Likes</Text></View>;
/*
    const getName = (sName) => {
        let aName = [oProps.type, oProps.system.replace(/_/g, '-'), oProps.object_id];
        if(sName != undefined && sName.length > 0)
            aName.push(sName);

        return [].concat(aName).join('-');
    };

    const [ performedBy, setPerformedBy ] = useState();
    const { globals, setGlobals } = useContext(GlobalsData);

    const isGlobalVar = (sName) => {
        const sGlobalsKey = getName();

        return globals && globals[sGlobalsKey] != undefined && globals[sGlobalsKey][sName] != undefined;
    };

    const getGlobalVar = (sName) => {
        const sGlobalsKey = getName();

        return globals[sGlobalsKey][sName];
    };

    const setGlobalVars = (mValue) => {
        const sGlobalsKey = getName();

        let oValue = {};
        oValue[sGlobalsKey] = mValue;

        if(!globals)
            setGlobals(oValue);
        else
            setGlobals({...globals, ...oValue});
    };

    const oParams = oProps.params;
    const oAction = oProps.action;
    const oCounter = oProps.counter;

    const performAction = async (sAction, aParams, onLoad) => {
        const aParamsDefault = {s: oProps.system, o:oProps.object_id};
        if(aParams)
            aParams = aParams ? {...aParamsDefault, ...aParams} : aParamsDefault;

        const sRequest = '/api.php?r=system/' + sAction + '/TemplVoteServices&params[]=' + JSON.stringify(aParams);

        const sResponse = await fetcher(sRequest);
        if(typeof onLoad === 'function')
            onLoad(sResponse?.data);
    };

    const handleDo = (event, oProps) => {
        event.preventDefault();

        performAction('do', {value: 1}, (oData) => {
            setGlobalVars(oData);
        });
    };

    const handleUndo = (event) => {
        event.preventDefault();

        performAction('do', {value: 1}, (oData) => {
            setGlobalVars(oData);
        });
    };

    const handleGetPerformedBy = (event) => {
        event.preventDefault();

        performAction('get_performed_by', {}, (oData) => {
            if(!oData?.performed_by)
                return;

            setPerformedBy(oData.performed_by);
        });
    };

    const getSkeleton = () => {
        return (
            <li className="space-y-2">
            {[...Array(3)].map( _ => 
                <div className="flex flex-col p-2 bg-gray-500/5 sm:rounded-lg">
                    <div className="animate-pulse flex items-center gap-3">
                        <div className="rounded-full bg-gray-600/20 h-10 w-10"></div>
                        <div className="flex-1 space-y-1">
                            <div className="h-4 w-1/2 bg-gray-600/20 rounded-full"></div>    
                            <div className="h-3 w-1/3 bg-gray-600/20 rounded-full"></div>
                        </div>
                    </div>
                </div>
            )}
            </li>
        );
    };

    //--- default display type: action, counter, both.
    const sDisplayType = oProps.displayType ? oProps.displayType : 'both';

    //--- show action
    const bShowAction = (oParams.show_action == undefined || oParams.show_action === true) && (sDisplayType == 'action' || sDisplayType == 'both');

    const bShowActionUndo = oAction?.is_undo === true;
    const bShowActionVoted = oAction?.is_voted === true || (isGlobalVar('is_voted') && getGlobalVar('is_voted') === true);
    const bShowActionDisabled = oAction?.is_disabled === true || (isGlobalVar('is_disabled') && getGlobalVar('is_disabled') === true);

    let sIcon = oAction?.icon || '';
    if(isGlobalVar('icon'))
        sIcon = getGlobalVar('icon');

    let sTitle = oAction?.title || '';
    if(isGlobalVar('title'))
        sTitle = getGlobalVar('title');

    let sAction = '';
    if(bShowActionUndo && bShowActionVoted) {
        sAction = (
            <button type="button" className="group inline-flex flex-auto shadow-sm hover:shadow active:opacity-80 active:shadow-none items-center p-2    dark:hover:bg-gray-800 dark:active:bg-gray-700 active:bg-gray-200 text-sm focus:outline-none font-medium text-gray-700 bg-white border focus:z-10 focus:ring-4 focus:ring-gray-200  border-gray-200 hover:border-gray-300 rounded-lg hover:bg-gray-100 bg-transparent hover:text-gray-900  focus:text-blue-700 dark:bg-gray-800 dark:border-gray-700/50 dark:hover:border-gray-700 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700/80 dark:focus:text-white" onClick={handleUndo}>
                <div className="flex gap-1 mx-auto">
                    {sIcon && <p className='w-6 h-6 group-active:-rotate-45 group-active:-translate-y-2 group-active:scale-150 duration-200 fill-current text-base'>{sIcon}</p>}
                    {sTitle && <p className='hidden xl/cell:block pl-1.5 pr-0.5 my-auto'>{sTitle}</p>}
                </div>
            </button>
        );
    }
    else {
        let sClassNameDo = '';
        if(bShowActionDisabled)
            sClassNameDo = 'group flex-auto inline-flex items-center p-2 shadow-sm bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-700/50 rounded-lg text-sm font-medium text-blue-600 dark:text-blue-500 cursor-not-allowed';
        else
            sClassNameDo = 'group flex-auto inline-flex items-center p-2 shadow-sm hover:shadow active:opacity-80 active:shadow-none dark:hover:bg-gray-800 dark:active:bg-gray-700 active:bg-gray-200 text-sm focus:outline-none font-medium text-gray-700 bg-white border focus:z-10 focus:ring-4 focus:ring-gray-200  border-gray-200 hover:border-gray-300 rounded-lg hover:bg-gray-100 hover:text-gray-900  focus:text-blue-700 dark:bg-gray-800 dark:border-gray-700/50 dark:hover:border-gray-700 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700/80 dark:focus:text-white';

        sAction = (
            <button id={getName('action-ddb')} type="button" disabled={bShowActionDisabled ? 'disabled' : ''} className={sClassNameDo} onClick={!bShowActionDisabled ? handleDo : () => {}}>
                <div className="flex gap-1 mx-auto">
                    {sIcon && <p className='w-6 h-6 group-active:-rotate-45 group-active:-translate-y-2 group-active:scale-150 duration-200 fill-current text-base'>{sIcon}</p>}
                    {sTitle && <p className='hidden xl/cell:block pl-1.5 pr-0.5 my-auto'>{sTitle}</p>}
                </div>
            </button>
        );
    }

    //--- show counter
    const bShowCounter = oParams.show_counter != undefined && oParams.show_counter === true && (sDisplayType == 'counter' || sDisplayType == 'both');

    //--- Counter
    let sCounter = '';
    if(bShowCounter) {
        let iCount = oCounter.count;

        if(isGlobalVar('counter')) {
            const oCounterGlobal = getGlobalVar('counter');
            if(oCounterGlobal?.count)
                iCount = oCounterGlobal.count;
        }

        let sUsers = '';
        if(performedBy) {
            sUsers = performedBy.map(aUser => {
                return (
                    <li><Profile {...aUser} /></li>
                );
            });
        }

        if(!sUsers)
            sUsers = getSkeleton();

        return (
            <div className={'inline-flex flex-none' + (!iCount ? ' hidden' : '')}>
                <button id={getName('performed-by-ddb')} type="button" className="group inline-flex flex-none active:opacity-80 active:shadow-none items-center p-1.5 dark:hover:bg-gray-800 dark:active:bg-gray-700 active:bg-gray-200 text-sm focus:outline-none font-medium text-gray-700 bg-white focus:z-10 focus:ring-4 focus:ring-gray-200  border-gray-200 hover:border-gray-300 rounded-full hover:bg-gray-100 bg-transparent hover:text-gray-900  focus:text-blue-700 dark:border-gray-700/50 dark:hover:border-gray-700 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700/80 dark:focus:text-white" onClick={(event) => {handleGetPerformedBy(event)}}>
                    {oCounter?.icon && <p className='w-6 h-6 text-base'>{oCounter.icon}</p>}
                    <p className='pl-1.5 pr-0.5'>{iCount}</p>
                </button>
                <div id={getName('performed-by-ddp')} className="z-10 hidden bg-white rounded-lg shadow w-60 dark:bg-gray-700">
                    <ul className="p-2 space-y-2 overflow-y-auto text-gray-700 dark:text-gray-200">{sUsers}</ul>
                </div>
            </div>
        );
    }
        

    //--- CSR: Initialize Flowbite components.
    useEffect(() => {
        //--- Performed By dropdown.
        const oCntTarget = document.getElementById(getName('performed-by-ddp'));
        const oCntTrigger = document.getElementById(getName('performed-by-ddb'));
        if(oCntTarget && oCntTrigger)
            new Dropdown(oCntTarget, oCntTrigger, {placement: 'bottom-start', trigger:'click'});
    }, []);

    return (
        <div className="inline-flex gap-1 xl/cell:gap-0 ">
            {bShowAction && <div>{sAction}</div>}
            {bShowCounter && <div>{sCounter}</div>}
        </div>
    );
*/
 }
