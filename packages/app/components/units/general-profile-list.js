import { useContext } from 'react';
import CardDataContext from 'app/context/card';
import { CardData } from 'app/context/card';
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
            return (
                <CardDataContext>
                    <UnitPerson {...props} />
                </CardDataContext>
            );
    }
}

export function UnitPerson(props) {
    let data = props.data;

    const { cardData, setCardData } = useContext(CardData);

    if(!!cardData?.hidden)
        return;

    let sMeta = <></>;
    if(data?.meta)
        sMeta = (
            <View className="text-center flex-col  h-auto justify-end">
                <Menu {...data.meta} displayType="mixed" params={{showVertical: false, button_size:'sm', button_full_width: true, button_rounded: false, only_icon: true}} />
            </View>
        );     
    return (
        <View className="">
            <Link href={data.url} emulate={true}> 
                <View className=" p-2 flex-row  
                group duration-200 overflow-hidden rounded-md  
                active:bg-backgroundcard-active dark:active:bg-backgroundcard-darkactive 
                hover:bg-backgroundcard-hover dark:hover:bg-backgroundcard-darkhover
                 max-w-5xl self-center w-full  ">  
                    <View className="w-10 h-10 mr-2 rounded-full flex-none ">
                        <Profile url_avatar={data?.image?.src} displayType="unit_wo_info" displaySize="base" />
                    </View>
                    <View className="flex-auto my-auto ">
                        <View className='flex-row justify-between'>
                            <View className="justify-center flex-auto ">
                                <Text className='text-sm mr-2 font-semibold truncate text-neutral-900  dark:text-neutral-100'>{data.title}</Text>
                                  
                            </View>
        
                            <View className='flex-none'>{sMeta}</View>
                        </View>    
                    </View>
                </View>
            </Link>
        </View>
    )
}