import { useCallback, useEffect, useState, useRef } from 'react';
import { Platform } from 'react-native';
import { ConvoServices as Services } from 'app/components/elements/messenger/services';

function useBrowserHistory(onPopState){
    if (Platform.OS !== 'web')
        return {};

    const [stateData, setStateData] = useState({});
    const { location: { pathname }, history } = window;

    const parseUrl = useCallback((sUrl) => {
        const aData = (typeof sUrl !== 'undefined' ? sUrl : window.location.pathname).split('/').slice(2);
        return aData;
    }, [pathname]);

    const updateState = useCallback(({ id, title, menu }) => {
         const { convoId, isBack } = stateData;

         document.title = title;
         if (convoId === id && isBack) {
             setStateData({});
             return {};
         }

         const sHref = `/messenger/${menu}/${id}`;
         if (sHref !== pathname)
             history.pushState(null, null, sHref);

    }, [pathname, stateData]);

    useEffect(() => {
        const handlerLocationChange = (oEvent) => {
            const oData = parseUrl(),
                  isPopState = oEvent?.type === 'popstate';

            let bUpdateState = true;
            if (isPopState && typeof onPopState === 'function')
                bUpdateState = onPopState();

            if (oData.length && bUpdateState) {
                if (oData.length === 1){
                    Services.findConvo(oData[0]).then(({ convo, profile }) => {
                        if (convo){
                            setStateData({ menuItem: 'inbox', convoId: convo.id });
                        } else if (profile){
                            setStateData({ convoId: 0, action: 'create-convo', profile });
                        }
                    });
                }
                else
                    if (oData.length === 2)
                        setStateData({ menuItem: oData[0], convoId: oData[1], isBack: isPopState });
            }
        };

        window.addEventListener('popstate', handlerLocationChange);

        // check browser url in order to find convo id to load it as start conversation
        handlerLocationChange();
        return () => {
           window.removeEventListener('popstate', handlerLocationChange);
        };
    }, []);

    return { ...stateData, updateState };
}

export default useBrowserHistory;
