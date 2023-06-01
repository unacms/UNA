import {BlackBox} from 'app/ui/molecules/blackbox';
import { useState, useRef } from 'react';
import {BlockByName, DataByName} from 'app/components/block';
import { appSetting } from 'app/lib/util'
import { Text } from 'app/design/typography'
import { View, Row } from 'app/design/view'
import { Button, Input } from 'app/design/controls';
import Redirect from 'app/ui/atoms/redirect';
import {SearchPanel} from 'app/ui/molecules/search';

export default function PageLayout(props) {
    
    const searchData = DataByName(props.data, props.blocks.browse);
    
    let header = <SearchPanel value={searchData.content[0].data.params.keyword}/>;
    let smallHeader = header
    let sect = searchData.content[0].data.params.sections;
    sect =[{"name":"", "title":"Top"}, ...sect];

    const menuItems  = sect
        .map((obj, index) => {
        const key = Object.keys(obj)[0];
        return {
            id: index + 1,
            name: obj.name,
            title: obj.title,
            link: 'search-keyword?keyword='+ searchData.content[0].data.params.keyword + (obj.name != '' ? '&section=' +obj.name : ''),
            icon: ''
        }
    });  
    let menu={
        object:'search',
        items:menuItems
    }

    return (<BlackBox 
        header={header} 
        minHeaderHeight={76} 
        offsetTop={120}
        isHideDefaultHeader={true} 
        menu={menu} 
        data={props.data} 
        blocks={props.blocks}
        useSectionAsMenu={true}

    />)
}
