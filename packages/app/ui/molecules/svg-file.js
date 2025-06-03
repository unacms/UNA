import { SvgXml } from 'react-native-svg';
import { useEffect, useState } from 'react';
import { Text } from 'app/design/typography'
import { appSetting } from 'app/lib/util';
import { useColorScheme } from 'react-native'

export default function ({ src_dark, src_default, width, height }) {
    const [xml, setXml] = useState(null);

    const scheme = useColorScheme();
    const src = scheme === 'dark' ? src_dark : src_default;

    useEffect(() => {
        fetch(appSetting('config', 'native_app_images_url') + '/svg/' + src).then(res => res.text()).then(setXml);
    }, [src]);

    return xml ? <SvgXml xml={xml} width={width} height={height} /> : null;
};