import { View } from 'app/design/view';
import { BlockByName} from 'app/components/block';
import { Platform } from 'react-native'
import { useState, useEffect } from 'react';
import { appSetting } from 'app/lib/util'
import  LayoutDataContext from 'app/context/layout';
import { useCurrentUser } from 'app/context/user';
import {BlackBox} from 'app/ui/molecules/blackbox';

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

                <View className="hidden xl:block w-1/3   flex-none duration-200">
                    <BlockByName no_scroll={true} data={props.data} name={props.blocks.posts} />
                </View>
            </View>
            </View>
            </View>)
    }

    /*if (isWeb && !isDesktop){
        return (<View className="w-full ">
            <LayoutDataContext>
                    {!currentUser && renderBlock && <BlockByName name={props.blocks.home}  />}
                    {!!currentUser && <>
                        <BlockByName data={props.data} name={props.blocks.posts2} />
                        <BlockByName data={props.data} name={props.blocks.feed} />
                    </>}
                </LayoutDataContext>
        </View>)
    }*/


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