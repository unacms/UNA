import React from 'react';
import { Theme } from 'app/design/theme';
import { Text } from 'app/design/typography'
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css'; // optional
import 'app/styles/tippyjs.css'

export default function Tooltip(props) {
    return (
        <Tippy theme='tooltip' content={props.content}>{props.children}</Tippy>
    );
}