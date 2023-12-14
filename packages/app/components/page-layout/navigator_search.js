import { Conductor } from 'app/ui/molecules/conductor';
import { useState, useRef } from 'react';
import { BlockByName, DataByName } from 'app/components/block';
import { Text } from 'app/design/typography'
import { View, Row } from 'app/design/view'
import { Button, Input } from 'app/design/controls';
import Redirect from 'app/ui/atoms/redirect';
import {SearchPanel} from 'app/ui/molecules/search';
import { appSetting, parseUrl, parseQueryString} from 'app/lib/util';

export default function PageLayout(props) {
    const searchData = DataByName(props.data, props.blocks.browse);

    //const [keyword, setKeyword] = useState(searchData.content[0].data.params.keyword ? searchData.content[0].data.params.keyword : '');
    const [section, setSection] = useState(searchData.content[0].data.params.section.length == 1 ? searchData.content[0].data.params.section[0] : '');

    const keyword = searchData.content[0].data.params.keyword ? searchData.content[0].data.params.keyword : '';
    /*function changeKey(val){

        console.log(val);
        if (val != keyword)
            setKeyword(val)
    }*/

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
            link: 'search-keyword?keyword=' + keyword.replace(' ','') + (obj.name != '' ? '&section=' +obj.name : ''),
            icon: ''
        }
    });  
    let menu={
        object:'search',
        items:menuItems
    }

    return (<Conductor 
        layoutName={props.layoutName}
        header={header} 
        minHeaderHeight={0} 
        offsetTop={130}
        isHideDefaultHeader={false} 
        menu={menu} 
        data={props.data} 
        blocks={props.blocks}
        useSectionAsMenu={true}
        onChangeRoute={changeRoute}
    />)
}
