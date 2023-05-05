import { settings } from 'app/settings';
import { useColorScheme } from 'react-native';
import { Button } from 'app/design/controls';
import Link from 'app/ui/atoms/link'
import { View, Row, Pressable } from 'app/design/view'; 
import { Text } from 'app/design/typography'
import { Icon } from 'app/ui/atoms/icon'; 
import { useWindowDimensions} from 'react-native';

export function appSetting(section, name, path) {
    if (path)
        return settings[section] ? settings[section][name][path] : '';
    return settings[section] ? settings[section][name] : '';
}

export function SvgLogoNative() {
    const scheme = useColorScheme();
    if (scheme === 'dark'){
        return appSetting('theme', 'svg', 'logo-native')
    }
    else{
        return appSetting('theme', 'svg', 'logo-native-dark')
    }
};

export function updateRightHeader(items, navigation) {

    const addButtons = items?.map((button) => {
        let btn = <Button title={button.title} variant='text' startDecorator={button.icon} size="sm"/>;
        btn = button.link ? <Link href={button.link } >{btn}</Link> : btn
        return (
            <View  key={`add-${button.icon}`} >{btn}</View>
    )});

    if (addButtons){
        navigation.setOptions({ headerRight: () => (addButtons) });
    }
};

export function updateCenterHeader(_path, header, backButtonPresented, navigation, routerExpo, colors, icon) {
    let type = typeof header;
    const backButton =  backButtonPresented ? <Pressable className="mr-4   rounded-full justify-center items-center" onPress={routerExpo.back} >
    <Icon icon="left" width={24} height={24} color={colors.barsColor} /></Pressable> :<></>
    if (type == 'string'){
        header = (
            <Row className='w-auto w-full   items-center '>
                {backButton}
                { icon ? <Icon icon={icon} width={24} height={24} color={colors.barsColor} /> : <></>}
                { _path =='/home' ? <SvgLogoNative/> : <Text className='font-bold  ml-2 text-neutral-800 dark:text-neutral-200 text-xl'>{header}</Text>}
            </Row>
        )
    }
    else{
        header = ( <Row  className=' flex-1   items-center '>
                {backButton}
                {header}
        </Row> );
    }
    navigation.setOptions({ 
        headerBackVisible: false, 
        headerTitle:(props) => header
    });
};