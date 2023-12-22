import React from 'react';
import { Theme } from 'app/design/theme';
import { Text } from 'app/design/typography'
import 'tippy.js/themes/light.css';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css'; // optional

export default function Tooltip(props) {
    return (
        <Tippy theme='light' content={props.content}>{props.children}</Tippy>
    );
}