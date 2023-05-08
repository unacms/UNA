import { View, ScrollView, FlashList, Row } from 'app/design/view';
import {BlockByName, DataByName} from 'app/components/block';
import { Text } from 'app/design/typography'

import { useState, useContext, useRef, useEffect } from 'react';
import UnitComments from 'app/components/units/comments';
import { Button, Modal } from 'app/design/controls'
import useSWR from "swr";
import { fetcher } from 'app/lib/fetcher';
import Loading from 'app/ui/atoms/loading'
import Form from 'app/components/elements/form';
import { stripTags } from 'app/lib/util';
import { useTheme } from '@react-navigation/native';
import { Platform, Keyboard } from 'react-native'
import Dropdown from 'app/ui/atoms/dropdown'

export function findParent (data, c, o, insert) {
    if (Array.isArray(data)){
        //for first level
        data.map(function(d, k){ 
            if (o.data.cmt_vparent_id == d[Object.keys(d)[0]].id){
                if (insert == 'before')
                    data[k][Object.keys(data[k])[0]].items = {...c, ...data[k][Object.keys(data[k])[0]].items};
                else
                    data[k][Object.keys(data[k])[0]].items = {...data[k][Object.keys(data[k])[0]].items, ...c};
                
            }
            data[k][Object.keys(data[k])[0]].items = findParent(data[k][Object.keys(data[k])[0]].items, c, o, insert)
        }) 
    }
    else{
        //for another levels
        Object.keys(data).forEach(function (k) { 
            if (o.data.cmt_vparent_id == data[k].id){
                if (insert == 'before')
                    data[k].items = {...c, ...data[k].items};
                else
                data[k].items = {...data[k].items, ...c};
            }
            data[k].items = findParent(data[k].items, c, o)
        });

    }
    return data;
}

export function parseData (browse, dynamicData) {
    
    if (dynamicData.data.browse.new){
        // to do
    }
    dynamicData.data.browse.data.data.map(function(c, kc){
        let o = c[Object.keys(c)[0]];
        // add in root
        if(o.data.cmt_vparent_id == 0){
            let bPresent = false;
            browse.data.data.forEach(function (k) { 
                if(Object.keys(k)[0] == Object.keys(c)[0])
                bPresent = true;
            });

            if (!bPresent){
                
                if (dynamicData.data.browse.insert == 'before'){
                    browse.data.data = browse.data.data.concat([c]);
                }
                else{
                    browse.data.data = [c].concat(browse.data.data);
                }
            }
        }
        else{
            browse.data.data = findParent(browse.data.data, c, o, dynamicData.data.browse.insert);
        }
    });
    return browse;
}



