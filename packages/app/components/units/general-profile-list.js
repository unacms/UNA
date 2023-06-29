import Image from '../../ui/atoms/image';
import Link from '../../ui/atoms/link';
import Profile from '../../ui/molecules/profile';
import { appSetting, getImageSizes } from 'app/lib/util';
import { Text } from 'app/design/typography'
import { View } from 'app/design/view'
import Menu from 'app/components/menu';


export default function Unit(props) {
    let data = props.data;

    const imageSizes = getImageSizes();
    const module = !!data?.module ? data.module : props.module;

    switch (module) {
        case 'bx_persons':
            return personUnit();
    }

    function personUnit(){
        let sMeta = <></>;
        if(data?.meta)
            sMeta = (
                <View className="text-center flex-col  h-auto justify-end">
                    <Menu {...data.meta} displayType="mixed" params={{showVertical: false, button_size:'base', button_full_width: true, button_rounded: false}} />
                </View>
            );     
        return (
            <View className="mx-8 sm:mx-2">
                <Link href={data.url} emulate={true}> 
                    <View className=" p-2 flex-row  
                    group duration-200 overflow-hidden rounded-md  
                    bg-backgroundcard dark:bg-backgroundcard-dark active:bg-neocard-active dark:active:bg-neocard-darkactive 
                    hover:bg-backgroundcard-hover dark:hover:bg-backgroundcard-darkhover
                    mt-[1px] max-w-5xl self-center w-full sm:border
                    active:translate-y-0.5 
                    border-bordercolorcard dark:border-bordercolorcard-dark ">  
                        <View className="w-10 h-10 mr-2 rounded-full flex-none ">
                            <Profile url_avatar={data?.image?.src} displayType="unit_wo_info" displaySize="base" />
                        </View>
                        <View className="flex-auto my-auto ">
                            <View className='flex-row justify-between'>
                                <View className="justify-center">
                                    <Text className='text-base mr-2 font-semibold text-gray-900 dark:text-gray-100'>{data.title}</Text>
                                      
                                </View>
            
                                <View className=''>{sMeta}</View>
                            </View>    
                        </View>
                    </View>
                </Link>
            </View>
        )
    }
}