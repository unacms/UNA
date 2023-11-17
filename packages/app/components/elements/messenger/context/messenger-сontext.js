import {createContext, useState} from 'react';
import { useWindowDimensions } from "react-native";
import { getScreenMode } from 'app/components/elements/messenger/grid-utils';

const PageData = createContext({});
const MenuData = createContext({});

function PageContext({ children }) {
    const [panel, setPanel] = useState(false),
          [convoInfo, setConvoItem] = useState({}),
          [historyArea, setHistoryArea] = useState(),
          [channel, setChannel] = useState(),
          [convoId, setConvoId] = useState();

    const { height } = useWindowDimensions();
    return <PageData.Provider value={{
                                        pageHeight: height,
                                        screenMode: getScreenMode(),
                                        historyArea, setHistoryArea,
                                        convoId, setConvoId,
                                        panel, setPanel,
                                        convoInfo, setConvoItem,
                                        channel, setChannel,
                                     }}>{children}</PageData.Provider>;
}

function MenuContext({ children }) {
    const [menuItem, setMenuItem] = useState('index');
    const [menuView, setMenuView] = useState(false);
    const [menuItems, setMenuItems] = useState();

    return <MenuData.Provider value={{
                                       menuItems, setMenuItems,
                                       menuItem, setMenuItem,
                                       menuView, setMenuView
                                     }}>{children}</MenuData.Provider>;
}

export { PageData, PageContext, MenuData, MenuContext };