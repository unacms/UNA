import React, { useCallback, useState, useEffect, useMemo } from "react";
import { appSetting, deepEqual, getUnitModeBySource, parseUrl, parseQueryString, getURI  } from 'app/lib/util';
import { menuItemsByName } from 'app/lib/util'
import Link from 'app/ui/atoms/link'
import { Button } from 'app/design/controls'
import { BlockByName, DataByName } from 'app/components/block'
import { View, Row, Pressable, ScrollView } from 'app/design/view'
import { Text } from 'app/design/typography'

import { Platform } from 'react-native'
import { updateRightHeader } from 'app/lib/native-handlers';
import { useNavigation } from '@react-navigation/native';
import { fetcher } from 'app/lib/fetcher';

async function parseData(link) {
    let path = link;
    if (link.includes('?')){
        const urlObj = parseUrl(link); // Base URL is required if your URL is relative
        const queryString = urlObj.queryString;

        let obj= parseQueryString(urlObj.queryString)
        path = urlObj.path.replace('/', '');
        link = path + '&params[]=&params[]='+JSON.stringify(obj);

    }
    
    const sResponse = await fetcher('/api.php?r=system/get_page_by_request/TemplServicePages&params[]=' + link);
    let settings = appSetting('layouts', path);
    return {data: sResponse.data, blocks : settings.blocks}
}

export default function PageLayout(props) {
    const isWeb = Platform.OS == 'web'
    const [pageData, setPageData] = useState({data: props.data, blocks: props.blocks});
    const [pageUrl, setPageUrl] = useState(props.data.url);

    const menuSettings = appSetting('menu_items', pageData.data.menu.object);

    useEffect(() => {
        async function fetchData() {
            if (pageUrl){
                const data = await parseData(pageUrl);
                setPageData(data);
            }
        }

        fetchData();
    }, [pageUrl]);     

    console.log('props.data', props.data, pageData);

    const Menu = (props) => {
        return ( <Row className='lg:hidden'>
            {menuItemsByName(props.data.menu.object, props.data.menu.items, '').map((item, index) =>
                <View key={index} className='py-2 items-center'> 
                    <Link href={item.link} key={`menu-${index}`} alt={item.title}>
                        <Button fullWidth={true} variant={props.uri == item.link ? 'outline': "text"} rounded size='sm' title={item.title}   />
                    </Link>
                </View>
            )}
        </Row>)
    }

    const MenuNative = (props) =>{
        const navigation = useNavigation();
        useEffect(() => {
            if (!isWeb){   
                updateRightHeader(menuSettings?.add, navigation);
            }
        }, []);


        return ( <Row className='lg:hidden w-full'>
            {menuItemsByName(props.data.menu.object, props.data.menu.items, '').map((item, index) =>
                <View key={index} className='py-2 items-center'> 
                    <Link href={item.link} key={`menu-${index}`} alt={item.title}>
                        <Button  variant={props.uri == item.link ? 'primary': "text"} rounded size='sm' title={item.title}   />
                    </Link>
                </View>
            )}
        </Row>)
    }

    const Header = (props) => {
        let categories = DataByName(props.data, props.blocks.categories);
       
        const addButtons = menuSettings?.add?.map((button) => {
            let btn = <Button title={button.title} startDecorator={button.icon} variant="outline" rounded size="sm"/>;
            btn = button.link ? <Link href={button.link } >{btn}</Link> : btn
            return (
                <View className=" ml-2 " key={`add-${button.icon}`} >{btn}</View>
        )});

        return (
            <View className='bg-white  dark:bg-neutral-900 border-b border-bdrnavbar dark:border-bdrnavbar-d lg:bg-transparent lg:border-0'>
                <Row className="lg:hidden flex-row gap-x-1 flex-none items-center justify-between h-16  ">
                    <Row className="items-center">
                    <View className=" "></View>
                    </Row> 
                    <Row className="pr-4">
                        {addButtons}
                    </Row>
                </Row>
                <View className="flex-row  lg:w-1/4 px-4 lg:pt-4 lg:flex-auto lg:flex-col gap-y-2 gap-x-2 lg:max-h-screen lg:overflow-scroll lg:fixed lg:top-16">
                                    
                        <Text className="text-xl my-auto font-bold mx-2.5 text-neutral-700 dark:text-neutral-300 hidden lg:flex flex-row items-center gap-x-2 ">
                                    <Button
                                        variant="outline"
                                        size="base"
                                        rounded
                                        align="start"
                                        startDecorator="Storefront"
                                    />
                        {menuSettings?.name}
                        
                        </Text>
                        


                    <Menu {...props}/>
                    <View className='hidden lg:block'>
                        {menuItemsByName(props.data.menu.object, props.data.menu.items, '').map((item, index) =>
                                <Link href={item.link} key={`menu-${index}`} alt={item.title}>
                                    <Button
                                        variant="text"
                                        size="lg"
                                        fullWidth
                                        title = {item.title}
                                        align="start"
                                        startDecorator="CirclesFour"
                                    />
                                </Link>
                        )}
                    </View>
                    <View className='ml-10 hidden lg:block'>
                        {categories?.content[0]?.data && categories.content[0].data.map((item, index) =>
                            <Link href={item.url} key={`menu-${index}`} alt={item.name}>
                                <Pressable onPress={(event) => {
                                    setPageUrl(item.url);
                                    window.history.pushState({ }, '', item.url);
                                    event.preventDefault()
                                }}>
                                    <Button
                                        variant="text"
                                        size="base"
                                        fullWidth
                                        title = {item.name+ ' (' + item.num + ')'}
                                        align="start"
                                        
                                    />
                                </Pressable>
                            </Link>
                        )}
                    </View>
                </View>
            </View>
        )
    }
    if (isWeb){
        return (
            <View className={appSetting('layout', 'max_width') + ' mx-auto w-full '}>
                <View className="lg:flex-row">
                    <View className='w-full lg:w-1/3 xl:w-1/5 lg:border-r border-dashed border-neutral-500/10 lg:flex-none   fixed lg:relative top-0 z-50 '>
                        <Header {...props}/>
                    </View>
                    <View className='w-full px-2 lg:flex-auto lg:flex-auto mt-32 lg:mt-4'>
                        <BlockByName data={props.data} name={props.blocks.browse} />
                    </View>
                </View>
            </View>
        </View>
        }, [pageData]); 

        return Content;
    }
    else{

        const MenuNative = () => {
            const navigation = useNavigation();
            useEffect(() => {
                if (!isWeb){   
                    updateRightHeader(menuSettings?.add, navigation);
                }
            }, []);
    
    
            return ( <Row className='lg:hidden w-full'>
                {menuItemsByName(pageData.data.menu.object, pageData.data.menu.items, '').map((item, index) =>
                    <View key={index} className='py-2 items-center'> 
                            <Pressable onPress={(event) => {
                                setPageUrl(item.link);
                                event.preventDefault()
                            }}>
                                <Button  variant={pageUrl == item.link ? 'primary': "text"} rounded size='sm' title={item.title}   />
                            </Pressable>
                    </View>
                )}
            </Row>)
        }

        const Content = useCallback(({ pageData }) => <View className='w-full flex-1'>
        <BlockByName contentContainerStyle={{ paddingTop: 60, paddingBottom:20 }} data={pageData.data} name={pageData.blocks.browse} />
        <View className='absolute  h-14 top-0 w-full z-50'>
            <View className='w-full h-14 bg-white dark:bg-neutral-900 pt-1'>
                <ScrollView  horizontal={true} className=" ml-4">
                    <MenuNative {...props}/>
                </ScrollView>
            </View>
        </View>
    </View>, [pageData]);

        /*const Content = useMemo(() => {
            return  <View className='w-full flex-1'>
                <BlockByName contentContainerStyle={{ paddingTop: 60, paddingBottom:20 }} data={pageData.data} name={pageData.blocks.browse} />
                <View className='absolute  h-14 top-0 w-full z-50'>
                    <View className='w-full h-14 bg-white dark:bg-neutral-900 pt-1'>
                        <ScrollView  horizontal={true} className=" ml-4">
                            <MenuNative {...props}/>
                        </ScrollView>
                    </View>
                </View>
            </View>
        }, [pageData]);*/

        return <Content pageData={pageData}/>;
    }
}
