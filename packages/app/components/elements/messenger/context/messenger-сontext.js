import { createContext, useState } from 'react';
import { useWindowDimensions } from "react-native";
import {getScreenMode} from "../grid-utils";

const PageData = createContext({});
const MenuData = createContext({});

function PageContext({ children }) {
    const [panel, setPanel] = useState(false);
    const [convoId, setConvoId] = useState(0);
    const [convoInfo, setConvoItem] = useState({}); //item: {}, manually: false

    const { height } = useWindowDimensions();
    return <PageData.Provider value={{
                                        pageHeight: height,
                                        screenMode: getScreenMode(),
                                        panel, setPanel,
                                        convoId, setConvoId,
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