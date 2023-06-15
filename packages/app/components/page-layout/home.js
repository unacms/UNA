import { View } from 'app/design/view';
import { BlockByName} from 'app/components/block';
import { Platform } from 'react-native'
import { useState, useEffect } from 'react';
import { appSetting } from 'app/lib/util'
import  LayoutDataContext from 'app/context/layout';
import { useCurrentUser } from 'app/context/user';
import {BlackBox} from 'app/ui/molecules/blackbox';
import {Text} from 'app/design/typography';
import { Button } from 'app/design/controls';

export default function PageLayout(props) {
    const isWeb = Platform.OS == 'web'
    const [isDesktop, setIsDesktop] = useState(false);
    const [renderBlock, setRenderBlock] = useState(false);
    let { currentUser, setCurrentUser } = useCurrentUser();
    
    useEffect(() => {
        if (isWeb){
            const handleResize = () => {
                setIsDesktop(window.innerWidth > 768);
            };
            
            window.addEventListener('resize', handleResize);
            handleResize();
            
            return () => window.removeEventListener('resize', handleResize);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (!currentUser)
                setRenderBlock(true);
        }, 100);
    
        return () => clearTimeout(timer); // This will clear the timer when the component is unmounted.
      }, []);


    if (isWeb){
        if (currentUser === null && renderBlock)
            return (<View className={ appSetting('layout', 'max_width') + ' mx-auto w-full pt-4'} >
                <BlockByName name={props.blocks.home}  />
                </View>);
        if (currentUser)
        return (<View className={ appSetting('layout', 'max_width') + ' mx-auto w-full'} >
            <View className="flex-auto relative w-full flex-row mx-auto  ">

            <View className="hidden md:block  w-1/4 xl:w-1/5 mt-4   duration-200 sticky  top-0 ">
                <BlockByName data={props.data} name={props.blocks.menu}  />
            </View>
            <View className="flex-auto  w-3/4 xl:w-4/5 flex-row duration-200">
                <View className="flex-auto w-2/3">
                <LayoutDataContext>
                    <BlockByName data={props.data} name={props.blocks.posts2} />
                    <BlockByName data={props.data} name={props.blocks.feed} />
                </LayoutDataContext>
                </View>

                <View className="hidden xl:block w-1/3  flex-none duration-200">
                    <View className=" w-full  pt-4 px-2 ">
                            <View className=" p-6 shadow-sm top-0 overflow-hidden  flex-col  w-full aspect-video bg-primary/20 rounded-lg ">
                                <View className="mt-auto w-full gap-y-4 flex-col align-justify  ">      
                                      
                                        <Text className="text-3xl  font-bold text-neutral-800 dark:text-neutral-200 ">
                                            Go Premium!
                                        </Text>
                                        

                                        <Text className="text-lg  text-neutral-600 dark:text-neutral-400 ">
                                        Connect, create, discover, learn, share and grow together with your community.
                                        </Text>
                                        <View className="mt-auto flex-auto">
                                        <Button variant="primary" title="Upgrade Membership" startDecorator="RocketLaunch" className="mt-auto" />
                                        </View>
                               
                                </View>
                               
                                <View className="absolute -top-2/3 -right-2/3 aspect-square w-full bg-primary/5  p-8 rounded-full">
                                    <View className=" aspect-square w-full bg-primary/5 p-8 rounded-full">
                                        <View className=" aspect-square w-full bg-primary/5  p-8 rounded-full">
                                         
                                        </View>
                                    </View>
                                </View>
                                <View className="absolute top-0  aspect-square w-full rotate-12 rounded-lg bg-primary/5   "></View>
                                <View className="absolute top-1/4 -left-1/4 aspect-square w-3/4 rotate-12 rounded-lg bg-primary/5  "></View>
                                <View className="absolute top-3/4 -left-1/4 aspect-square w-full rotate-12 rounded-lg bg-primary/5   "></View>

                               



                                
                            </View>
                    </View>
                    <BlockByName no_scroll={true} data={props.data} name={props.blocks.posts} />
                </View>
            </View>
            </View>
            </View>)
    }

    let sect =[{"name":"", "title":"Top"}];

    const menuItems  = sect
        .map((obj, index) => {
        const key = Object.keys(obj)[0];
        return {
            id: index + 1,
            name: obj.name,
            title: obj.title,
            link: 'home',
            icon: ''
        }
    });  
    let data = {...props.data};
    if (!isWeb){
        delete data.elements.cell_1;
        delete data.elements.cell_2;
        delete data.elements.cell_4;
    }

    let menu={
        object:'search',
        items:menuItems
    }

    return (<View className="w-full ">
        <LayoutDataContext>
            {!currentUser && renderBlock && <BlockByName name={props.blocks.home}  />}
            {!!currentUser && <>
                <BlackBox 
                minHeaderHeight={0} 
                isHideDefaultHeader={false} 
                menu={menu} 
                data={data} 
                blocks={props.blocks}
            />
                
            </>}
        </LayoutDataContext>
    </View>)

}