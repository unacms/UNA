import { useWindowDimensions } from "react-native";

const sTablet = 'tablet',
    sPhone = 'phone',
    sDesktop = 'desktop';

function getScreenMode(){
    const { width } = useWindowDimensions(),
        aModePrefixes = {[sPhone]: { pfx: '', width: 0 }, [sTablet]: { pfx: 'md', width: 768 }, [sDesktop]: { pfx: 'xl', width: 1280 }};

    let sMode = sDesktop;
    if (width > aModePrefixes[sPhone].width && width <= aModePrefixes[sTablet].width)
        sMode = sPhone;

    if (width > aModePrefixes[sTablet].width && width <= aModePrefixes[sDesktop].width)
        sMode = sTablet;

    return sMode;
}

function getSpace(sMode) {
    let iSpace = 0;

    const iHeader = 4*16,
        iFooter = 4*16;

    switch(sMode){
        case sDesktop:
            iSpace = iHeader;
            break;
        case sTablet:
            iSpace = iFooter;
            break;
        case sPhone:
            iSpace = iFooter;
            break;
    }

    return iSpace;
};

function getGrid(sMode, sPanel = false){
    const aMainViewScheme = {
        history: {
            [sDesktop]: { view: 'col-span-5', enabled: true },
            [sTablet]: { view : 'col-span-6', enabled: true },
            [sPhone]: { view : 'col-span-10', columns: { list: 'hidden' }},
        },
        list: {
            [sDesktop]: { view: 'col-span-3', enabled: true },
            [sTablet]: { view: 'col-span-4', enabled: true },
            [sPhone]: { view: 'col-span-10', enabled: true, columns: { history: 'hidden' }},
        },
        menu: {
            [sDesktop]: { view: 'col-span-2', enabled: true, columns: { list: 'col-span-2', history: 'col-span-3' }},
            [sTablet]: {
                view: 'col-span-3',
                columns: { list: 'col-span-3', history: 'col-span-4' }
            },
            [sPhone]: {
                view: 'col-span-8', columns: { list: 'col-span-2' }
            },
        },
        info: {
            [sDesktop]: {
                view: 'col-span-3',
                columns: {
                    menu: 'col-span-2',
                    list: 'col-span-2',
                    history: 'col-span-3'
                }
            },
            [sTablet]: {
                view: 'col-span-4',
                columns: {
                    list: 'col-span-3',
                    history: 'col-span-3'
                }
            },
            [sPhone]: {
                view: 'col-span-10',
                columns: {
                    history: 'hidden'
                }
            },
        },
    };

    const getStyle = (sColumn) => {
        let sValue = aMainViewScheme[sColumn][sMode].enabled ? aMainViewScheme[sColumn][sMode].view : 'hidden';

        if (sPanel && typeof aMainViewScheme[sPanel][sMode] !== 'undefined') {
            if (sPanel === sColumn)
                sValue = typeof aMainViewScheme[sPanel][sMode].view !== 'undefined' ? aMainViewScheme[sPanel][sMode].view : 'hidden';
            else
                sValue = typeof aMainViewScheme[sPanel][sMode].columns[sColumn] !== 'undefined' ? aMainViewScheme[sPanel][sMode].columns[sColumn] : 'hidden';
        }

        return { [sColumn + 'Col'] : sValue };
    };

    console.log('----- log execute dimension  -----');
    return Object.assign( getStyle('history'), getStyle('list'), getStyle('menu') );
}

export { getScreenMode, getGrid, getSpace, sTablet, sDesktop, sPhone };