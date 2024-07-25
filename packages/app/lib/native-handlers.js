import { useColorScheme } from 'react-native';
import { Button } from 'app/design/controls';
import Link from 'app/ui/atoms/link'
import { View, Row, Pressable } from 'app/design/view'; 
import { Text } from 'app/design/typography'
import { Icon } from 'app/ui/atoms/icon'; 
import { appStatic } from 'app/lib/app-static';
import Search from 'app/ui/molecules/search';
import { FeedbackHaptics } from 'app/lib/util';
import { appSetting } from 'app/lib/util'
import { useRouter } from "expo-router";
import Header from 'app/components/nav/header';

export function updateRightHeader(items, navigation) {
    let addButtons = items?.map((button) => {
        let btn = undefined;
        if(button.section || button.link == 'search')
            btn = <Search section={button.section} params={{trigger: {size: 'base', variant: 'secondary' }}} />
        else {
            btn = <Button rounded title={button.title} variant='secondary' startDecorator={button.icon} size="base" />;
            btn = button.link ? <Link href={button.link } >{btn}</Link> : btn
        }

        return (
            <View className=" ml-2"  key={`add-${button.icon}`} >{btn}</View>
        )
    });

   
    if (addButtons) {
        navigation.setOptions({ headerRight: () => (addButtons) });
    }
};

/*export function updateRightHeaderObj(addButtons, navigation) {

    if (addButtons){
     //   navigation.setOptions({ headerRight: () => (addButtons) });
    }
};*/

export function getRightHeader(items) {
    let addButtons = items?.map((button) => {
        let btn = undefined;
        if(button.section || button.link == 'search')
            btn = <Search section={button.section} params={{trigger: {size: 'base', variant: 'secondary' }}} />
        else {
            btn = <Button rounded title={button.title} variant='secondary' startDecorator={button.icon} size="base" />;
            btn = button.link ? <Link href={button.link } >{btn}</Link> : btn
        }

        return (
            <View className="w-10"  key={`add-${button.icon}`} >{btn}</View>
        )
    });

    return addButtons;
};

export function updateCenterHeader(_path, header, backButtonPresented, navigation, rightComponents) {
    console.log("updateCenterHeader",_path,header,  rightComponents)
    navigation.setOptions({ 
        headerBackVisible: false, 
        header:(props) => <Header backButtonPresented={backButtonPresented} header={header} pagePath={_path} rightComponents={rightComponents}/>,
        headerShown: true
    });
}

/*export function updateCenterHeader(_path, header, backButtonPresented, navigation, routerExpo, colors, icon, leftComponent, currentUser) {
    let type = typeof header;

    const backButton =  backButtonPresented ? <Pressable className=" mr-4 rounded-full justify-center items-center" onPress={() => { FeedbackHaptics('Medium'); routerExpo.back(); }}>
    <Icon icon="ArrowLeft" width={24} height={24} color={colors.barsColor} /></Pressable> :<></>
    if (type == 'string'){
        header = (
            <Row className='w-full items-center bg-blue-500'>
                { backButton }
                { leftComponent }
                { icon ? <Icon icon={icon} width={24} height={24} color={colors.barsColor} /> : <></>}
                { _path =='/home' ? <Pressable onPress={() => {navigation.navigate('tab0')}}><SvgLogoNative/></Pressable> : <Text className='font-bold  tracking-tighter text-neutral-800 dark:text-neutral-200 text-2xl'>{header.replace('__notification__', '')}</Text>}
            </Row>
        )
    }
    else{
        header = ( <Row className=' flex-1 items-center bg-green-500'>
                {backButton}
                {header}
        </Row> );
    }


    if (!currentUser)
        header = <><Text className='font-bold ml-2 text-neutral-800 dark:text-neutral-200 text-xl'>Log in</Text></>


    navigation.setOptions({ 
        headerBackVisible: false, 
        headerTitle:(props) => header,
        headerShown: true
    });
};*/