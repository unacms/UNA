import { useColorScheme } from 'react-native';
import { Button } from 'app/design/controls';
import Link from 'app/ui/atoms/link'
import { View, Row, Pressable } from 'app/design/view'; 
import { Text } from 'app/design/typography'
import { Icon } from 'app/ui/atoms/icon'; 
import { appStatic } from 'app/lib/app-static';
import Search from 'app/ui/molecules/search';

export function SvgLogoNative() {
    const scheme = useColorScheme();
    if (scheme === 'dark'){
        return appStatic('logo_native')
    }
    else{
        return appStatic('logo_nativedark')
    }
};

export function updateRightHeader(items, navigation, routerExpo, path) {
    let addButtons = items?.map((button) => {
        let btn = undefined;
        if(button.section || button.link == 'search')
            btn = <Search section={button.section} params={{trigger: {size: 'sm'}}} />
        else {
            btn = <Button rounded title={button.title} variant='outline' startDecorator={button.icon} size="sm" />;
            btn = button.link ? <Link href={button.link } >{btn}</Link> : btn
        }

        return (
            <View className="w-8 ml-2"  key={`add-${button.icon}`} >{btn}</View>
        )
    });

   
    if (addButtons) {
        navigation.setOptions({ headerRight: () => (addButtons) });
    }
};
/*
export function updateRightHeaderObj(addButtons, navigation) {

    if (addButtons){
        navigation.setOptions({ headerRight: () => (addButtons) });
    }
};
*/
export function updateCenterHeader(_path, header, backButtonPresented, navigation, routerExpo, colors, icon, leftComponent) {
    let type = typeof header;
    const backButton =  backButtonPresented ? <Pressable className="mr-4   rounded-full justify-center items-center" onPress={routerExpo.back} >
    <Icon icon="ArrowLeft" width={24} height={24} color={colors.barsColor} /></Pressable> :<></>
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