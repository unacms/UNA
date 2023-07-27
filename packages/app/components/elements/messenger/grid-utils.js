import { useWindowDimensions } from "react-native";
import { memo } from "react";

const sTablet = 'tablet',
    sTablet2 = 'tablet2',
    sPhone = 'phone',
    sDesktop = 'desktop';

function getScreenMode(){
    const { width } = useWindowDimensions(),
        aModePrefixes = {[sPhone]: { pfx: '', width: 0 }, [sTablet]: { pfx: 'md', width: 768 }, [sTablet2]: { pfx: 'md', width: 1024 }, [sDesktop]: { pfx: 'xl', width: 1280 }};

    let sMode = sDesktop;
    if (width > aModePrefixes[sPhone].width && width <= aModePrefixes[sTablet].width)
        sMode = sPhone;

    if (width > aModePrefixes[sTablet].width && width <= aModePrefixes[sTablet2].width)
        sMode = sTablet;

    if (width > aModePrefixes[sTablet2].width && width <= aModePrefixes[sDesktop].width)
        sMode = sTablet2;

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
            iSpace = 0;//iFooter + iHeader;
            break;
        case sTablet2:
            iSpace = iHeader;
            break;
        case sPhone:
            iSpace = iFooter;
            break;
    }

    return iSpace;
};

function getGrid(sMode, sPanel = false) {
    const aMainViewScheme = {
        history: {
            [sDesktop]: { view: 'w-6/12', enabled: true },
            [sTablet]: { view : 'w-8/12', enabled: true },
            [sTablet2]: { view : 'w-8/12', enabled: true },
            [sPhone]: { view : 'w-full', columns: { list: 'hidden' }},
        },
        list: {
            [sDesktop]: { view: 'w-4/12', enabled: true },
            [sTablet]: { view: 'w-4/12', enabled: true },
            [sTablet2]: { view: 'w-4/12', enabled: true },
            [sPhone]: { view: 'w-full', enabled: true, columns: { history: 'hidden' }},
        }
    };

    const getStyle = (sColumn) => {
        let sValue = aMainViewScheme[sColumn][sMode].enabled ? aMainViewScheme[sColumn][sMode].view : 'hidden';
        if (sPanel && typeof aMainViewScheme[sPanel][sMode] !== 'undefined') {
            const { view, columns } = aMainViewScheme[sPanel][sMode];
            if (sPanel === sColumn)
                sValue = view ? view : 'hidden';
            else
                sValue = columns && columns[sColumn] !== 'undefined' ? columns[sColumn] : 'hidden';
        }

        //console.log('----- log execute dimension  -----', aMainViewScheme, sMode, sColumn, sPanel, sValue);

        return { [sColumn + 'Col'] : sValue };
    };


    return Object.assign( getStyle('history'), getStyle('list') );
};

export { getScreenMode, getGrid, getSpace, sTablet, sDesktop, sPhone };