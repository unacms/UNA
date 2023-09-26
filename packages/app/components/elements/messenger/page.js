import { View } from 'app/design/view';
import { Link } from 'app/ui/atoms/link';
import {memo, useRef, useMemo, useEffect, useContext, useCallback,} from 'react';
import { MenuColumn } from 'app/components/elements/messenger/menu';
import { ConvosList } from 'app/components/elements/messenger/convos-list';
import { HistoryComponent as History }  from 'app/components/elements/messenger/history';
import { PageContext, PageData, MenuContext, MenuData } from './context/messenger-сontext';
import { getGrid, getSpace, isPhone, isDesktop }  from './grid-utils';
import { fetcher } from "app/lib/fetcher";
import useBrowserHistory from './hooks/useBrowserHistory';

function PageLayout() {
    const { setMenuItems, menuItem, setMenuItem } = useContext(MenuData),
          { panel, setPanel, pageHeight, screenMode, convoInfo, setConvoId, convoId } = useContext(PageData);

    /* Web Routing begin */
    const handlerOnPopState = useCallback(() => {
        const bIsPhone = isPhone(screenMode);
        if (bIsPhone)
            setPanel(false);

        return !bIsPhone;
    }, [screenMode]),

    { convoId:iConvoIdUri, menuItem:sMenuUri, updateState }  = useBrowserHistory(handlerOnPopState);

    useEffect(() => {
         if (iConvoIdUri) {
             setConvoId(iConvoIdUri);
             if (!convoId && isPhone(screenMode)) {
                 setPanel('history');
             }
         }

         if (sMenuUri) {
             setMenuItem(sMenuUri);
         }

     }, [iConvoIdUri, sMenuUri]);


    useEffect(() => {
        if (convoId && +convoId !== +iConvoIdUri)
            setConvoId();
    }, [menuItem]);
    /* Web Routing end */

    const oWindowRef = useRef(),
          iSpace = useMemo(() => getSpace(screenMode), [screenMode]),
          iHeight = pageHeight - iSpace;

    useEffect(() => {
        const initMenu = async () => {
            const { data } =  await fetcher('/api.php?r=bx_messenger/get_messenger_menu');
            setMenuItems(data);
        }

        initMenu();

    }, []);

    useEffect(() => {
       const { item, manually } = convoInfo;

       if (isPhone(screenMode))
            setPanel((manually || +convoId === +iConvoIdUri) && 'history');

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

    return <View className="w-full h-full mx-auto flex flex-row bg-neutral-50 dark:bg-neutral-900">
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