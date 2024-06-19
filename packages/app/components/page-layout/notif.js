import {BlockByName} from 'app/components/block';
import { clearNotif } from 'app/lib/util'
import React, { useEffect } from "react";
export default function PageLayout(props) {
    useEffect(() => {
        clearNotif();
    }, [])
    return (  <><BlockByName data={props.data} name={props.blocks.browse} /></>)
}
