import { View } from 'app/design/view';
import { Link } from 'app/ui/atoms/link';
import { memo, useRef, useMemo, useEffect, useContext } from 'react';
import { MenuColumn } from 'app/components/elements/messenger/menu';
import { ConvosList } from 'app/components/elements/messenger/convos-list';
import { HistoryComponent as History }  from 'app/components/elements/messenger/history';
import { PageContext, PageData, MenuContext, MenuData } from './context/messenger-сontext';
import { getGrid, getSpace, isPhone, isDesktop }  from './grid-utils';
import {fetcher} from "app/lib/fetcher";
import Redirect from "app/ui/atoms/redirect";

function PageLayout({ data }) {
    const { menuView, setMenuView, setMenuItems } = useContext(MenuData);
    const { panel, setPanel, pageHeight, screenMode, convoInfo } = useContext(PageData);

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
       const { manually } = convoInfo;
        if (isPhone(screenMode) && manually)
            setPanel('history');
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
             <View className={"xl:w-2/12 hidden xl:block border-r border-bdrnavbar dark:border-bdrnavbar-dark" }>
                { bDesktop && <MenuColumn test={"column"}/> }
             </View>
             <View className={ listCol }>
                { listCol !== 'hidden' && <ConvosList /> }
             </View>
             <View className={ historyCol }>
                <View className="max-h-full flex w-full h-full flex-col relative border-l border-bdrnavbar dark:border-bdrnavbar-dark">
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