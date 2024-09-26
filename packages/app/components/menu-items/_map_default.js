import Link from './link';
import Button from './button';
import Element from './element';
import Callback from './callback';
import { memo } from "react";

export const componentsMapDefault = {
    link: memo(Link),
    button: memo(Button),
    element: memo(Element),
    callback: memo(Callback)
};

