import { Conductor } from 'app/ui/molecules/sections/conductor';
import { useState } from 'react';
import { DataByName } from 'app/components/block';
import { SearchPanel } from 'app/ui/molecules/sections/search';
import { appSetting, parseUrl, parseQueryString } from 'app/lib/util';
import { useCurrentUser } from 'app/context/user'
import { View } from 'app/design/view';
import { PageTitle } from 'app/ui/molecules/page/page-title';
import { PageCoverBand } from 'app/components/elements/covers/page-cover-band';

export default function PageLayout(props) {
    const { currentUser, setCurrentUser } = useCurrentUser();
    const searchData = DataByName(props.data, props.blocks.browse);

    const [section, setSection] = useState(searchData.content[0].data.params.section.length == 1 ? searchData.content[0].data.params.section[0] : '');

    const keyword = searchData.content[0].data.params.keyword ? searchData.content[0].data.params.keyword : '';

    function changeRoute(route){
        let b = parseUrl(route.link);
        let d = parseQueryString(b?.queryString);
        if (d?.section != section)
            setSection(d?.section)
    }
    
    let header = <SearchPanel value={keyword} section={section}  />;
    let sect = searchData.content[0].data.params.sections;
    sect =[{"name":"", "title":"Top"}, ...sect];

    const menuItems  = sect
        .map((obj, index) => {
        const key = Object.keys(obj)[0];
        return {
            id: index + 1,
            name: obj.name,
            title: obj.title,
            link: 'search-keyword?keyword=' + keyword.replace(' ','+') + (obj.name != '' ? '&section=' +obj.name : ''),
            icon: ''
        }
    });  
    let menu={
        object:'search',
        items:menuItems
    }

    // As UNA's search page: its title (desktop; phones and tablets show it in the header) and the search field above
    // the results, so a search can be changed where its results are.
    return (<View className="w-full flex-1">
        {/* The page's cover band above its title, as on the site (desktop); the Conductor below draws none. */}
        <PageCoverBand data={props.data} />
        <View className={appSetting('layout', 'max_width_block') + ' mx-auto w-full gap-3 px-3 pt-4 pb-3 sm:px-4'}>
            <PageTitle data={props.data} />
        </View>
        {header}
        <Conductor 
        layoutName={props.layoutName}
        //minHeaderHeight={0} 
        //offsetTop={130}
        isHideDefaultHeader={false} 
        menu={menu} 
        data={props.data} 
        blocks={props.blocks}
        useSectionAsMenu={true}
        showCoverBand={false}
        onChangeRoute={changeRoute}
    />
    </View>)
}
