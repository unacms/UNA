import { View } from 'app/design/view';
import { Link } from 'app/ui/atoms/link';
import { memo, useRef, useMemo, useEffect, useContext, useCallback } from 'react';
import { MenuColumn } from 'app/components/elements/messenger/menu';
import { ConvosList } from 'app/components/elements/messenger/convos-list';
import { HistoryComponent as History }  from 'app/components/elements/messenger/history';
import { PageContext, PageData, MenuContext, MenuData } from './context/messenger-сontext';
import { getGrid, getSpace, isPhone, isDesktop }  from './grid-utils';
import useBrowserHistory from './hooks/useBrowserHistory';
import { useCurrentUser } from 'app/context/user';
import {useQueryClient} from "@tanstack/react-query";
import {ConvoKeys} from "./hooks/useConvos";
import {HistoryKeys} from "./hooks/useHistory";
import { MenuServices } from "./services";

function PageLayout() {
    const { setMenuItems, menuItem, setMenuItem } = useContext(MenuData),
          { panel, setPanel, pageHeight, screenMode, convoInfo, setConvoId, convoId, setHistoryArea, historyArea } = useContext(PageData),
          queryClient = useQueryClient();

    /* Web Routing begin */
    const handlerOnPopState = useCallback(() => {
        const bIsPhone = isPhone(screenMode);
        if (bIsPhone)
            setPanel(false);

        return !bIsPhone;
    }, [screenMode]),

    { action:sUriAction, profile:aUriProfile, convoId:iConvoIdUri, menuItem:sMenuUri, updateState }  = useBrowserHistory(handlerOnPopState),

    { currentUser } = useCurrentUser();

    const handlerNewMessage = useCallback((oData) => {
        const { id, convo, user_id, lot_id } = oData;

        console.log('------- incomming data ------', oData);

        /*if (id) {
            queryClient.invalidateQueries({ queryKey: ConvoKeys.convoByMenu(menuItem)} );
            queryClient.invalidateQueries({ queryKey: HistoryKeys.messagesByConvo(id)} );
        }*/
    }, [convoId, menuItem, queryClient]);

    useEffect(() => {
        let jotServer = null;
        if (currentUser ) {
            const { pusher : jotServer } = currentUser;
            if (jotServer) {
                const channel = jotServer.subscribe("bx_messenger");
                      channel.bind('new-message', handlerNewMessage);

                /*jotServer.allChannels().forEach(channel => console.log(channel.name));

                channel.bind('pusher:subscription_succeeded', (members) => {
                    console.log('-------- members connected --------', members);
                    //setChannel(channel);
                });

                channel.bind('pusher:subscription_error', (error) => {
                    console.log('-------- pusher:subscription_error --------', error);
                });

                channel.bind('pusher:member_added', (member) => {
                    console.log('-------- member is added --------', channel.members);
                });*/



                /*jotServer.connection.bind('state_change', function(states) {
                    console.log('---------- pusher status ------', states);
                });*/
            }
        }

       return () => {
            if (jotServer) {
                jotServer.subscribe("bx_messenger");
                jotServer.bind('new-message');
            }
        };

    }, [currentUser, queryClient]);

    useEffect(() => {
         if (iConvoIdUri) {
             setConvoId(iConvoIdUri);
             if (!convoId && isPhone(screenMode)) {
                 setPanel('history');
             }
         }

         if (sMenuUri)
             setMenuItem(sMenuUri);

     }, [iConvoIdUri, sMenuUri, convoId]);

    useEffect(() => {
        if (sUriAction && aUriProfile) {
            setHistoryArea({ action: 'create-convo', profile: aUriProfile });
        }
    }, [sUriAction]);

    useEffect(() => {
        if (convoId && convoId !== iConvoIdUri) {
            setConvoId();
        }

        if (historyArea)
            setHistoryArea(false);

    }, [menuItem]);
    /* Web Routing end */

    const oWindowRef = useRef(),
          iSpace = useMemo(() => getSpace(screenMode), [screenMode]),
          iHeight = pageHeight - iSpace;

    useEffect( () => {
        const initMenu = async () => setMenuItems(await MenuServices.getMenu());
        initMenu();
    }, []);

    useEffect(() => {
       const { item, manually } = convoInfo;

       if (isPhone(screenMode) && manually)
            setPanel((convoId == iConvoIdUri) && 'history');

        // Web Routing
        const { id, title } = item || {};
        if (item && typeof updateState === 'function') {
            updateState({ id, title, menu: menuItem });
        }

    }, [convoInfo]);

    useEffect(() => {
        if (!isPhone(screenMode) && panel)
            setPanel(false);
    }, [screenMode]);

    return  <View ref={oWindowRef} style={{ height: iHeight }} className="w-full h-full overflow-hidden">
                <Layout mode={ screenMode } panel={ panel } />
            </View>
}

const Layout = memo(({ mode, panel }) => {
    const { historyCol, listCol } = getGrid( mode, panel );
    const bDesktop = isDesktop(mode);
    const bPhone = isPhone(mode);
    const bAllowHistoryView = !bPhone || bPhone &&  panel === 'history';

    return <View className="w-full h-full mx-auto flex flex-row bg-bgrcard dark:bg-bgrcard-d">
             <View className={"xl:w-2/12 hidden xl:block border-r border-bdrnavbar dark:border-bdrnavbar-d" }>
                { bDesktop && <MenuColumn /> }
             </View>
             <View className={ listCol }>
                { listCol !== 'hidden' && <ConvosList /> }
             </View>
             <View className={ historyCol }>
             <View className="max-h-full flex w-full h-full flex-col relative border-l border-bdrnavbar dark:border-bdrnavbar-d">
                 { historyCol !== 'hidden' && <History /> }
             </View>
             </View>
           </View>
});

export default (props) => {
    return <PageContext>
                <MenuContext>
                    <PageLayout {...props} />
                </MenuContext>
           </PageContext>
};