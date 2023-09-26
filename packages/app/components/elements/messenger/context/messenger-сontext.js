import {createContext, useCallback, useEffect, useState} from 'react';
import { useWindowDimensions } from "react-native";
import { getScreenMode } from '../grid-utils';
//import useBrowserHistory from '../hooks/useBrowserHistory';

const PageData = createContext({});
const MenuData = createContext({});

function PageContext({ children }) {
    const [panel, setPanel] = useState(false);
    const [convoInfo, setConvoItem] = useState({});
    const [convoId, setConvoId] = useState();

    const { height } = useWindowDimensions();
    return <PageData.Provider value={{
                                        pageHeight: height,
                                        screenMode: getScreenMode(),
                                        convoId, setConvoId,
                                        panel, setPanel,
                                        convoInfo, setConvoItem,
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