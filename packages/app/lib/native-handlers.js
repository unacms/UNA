import { useColorScheme } from 'react-native';
import { Button } from 'app/design/controls';
import Link from 'app/ui/atoms/link'
import { View, Row, Pressable } from 'app/design/view'; 
import { Text } from 'app/design/typography'
import { Icon } from 'app/ui/atoms/icon'; 
import { appStatic } from 'app/lib/util';

export function SvgLogoNative() {
    const scheme = useColorScheme();
    if (scheme === 'dark'){
        return appStatic('logo', 'native')
    }
    else{
        return appStatic('logo', 'nativedark')
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

export function updateCenterHeader(_path, header, backButtonPresented, navigation, routerExpo, colors, icon, leftComponent) {
    let type = typeof header;
    const backButton =  backButtonPresented ? <Pressable className="mr-4   rounded-full justify-center items-center" onPress={routerExpo.back} >
    <Icon icon="left" width={24} height={24} color={colors.barsColor} /></Pressable> :<></>
    if (type == 'string'){
        header = (
            <Row className='w-auto w-full items-center '>
                { backButton }
                { leftComponent }
                { icon ? <Icon icon={icon} width={24} height={24} color={colors.barsColor} /> : <></>}
                { _path =='/home' ? <SvgLogoNative/> : <Text className='font-bold  ml-2 text-neutral-800 dark:text-neutral-200 text-xl'>{header}</Text>}
            </Row>
        )
    }
    else{
        header = ( <Row className=' flex-1 items-center '>
                {backButton}
                {header}
        </Row> );
    }
    navigation.setOptions({ 
        headerBackVisible: false, 
        headerTitle:(props) => header
    });
};