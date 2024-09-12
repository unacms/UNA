import { View, Row, Pressable, ScrollView } from 'app/design/view'
import { Text, H1C } from 'app/design/typography'
import { stripTags, appSetting } from 'app/lib/util'
import Profile from 'app/ui/molecules/profile'
import { useWindowDimensions } from 'react-native'
import Image from 'app/ui/atoms/image'
import { useRouter } from 'expo-router'
import { Theme } from 'app/design/theme'
import { Icon } from 'app/ui/atoms/icon'
import Menu from 'app/components/menu'
import { BlurView } from 'expo-blur';
import ProfilesList from 'app/ui/molecules/profile_list'
import DropdownMenu from 'app/ui/atoms/dropdown-menu';
import { Button } from 'app/design/controls'
import { FeedbackHaptics } from 'app/lib/util';

function CoverMenu(props) {

    let size = "sm"
    const isSplitMenu = appSetting('layout', 'split_action_menu');

    let aMenuManageItems = [];

    let propsCopy = { ...props }; // Create a copy of the array

    if (isSplitMenu) {
        propsCopy.items = propsCopy.items.filter(aItem => {
            if (aItem?.display_type && aItem.display_type != 'link') {
                return true; // Exclude this item from the new array
            }
            else {
                aMenuManageItems.push({
                    id: aItem.id ? aItem.id : aItem.name,
                    link: '/' + aItem.link,
                    title: aItem.title
                });

                return false; // Include this item in the new array
            }
        });
    }
    else {
        propsCopy.items = propsCopy.items.filter(aItem => {
            if (aItem.name != props.uri) {
                return true; // Exclude this item from the new array
            }
            else {

                return false; // Include this item in the new array
            }
        });
    }

    return (
        <><Menu
            {...propsCopy}
            displayType="button"
            params={{
                show_action: true,
                show_counter: true,
                show_combined: true,
                button_variant: 'default',
                button_size: size,
                button_rounded: false,
                button_hide_title_on_small: false,
            }}
        />
            {(isSplitMenu && propsCopy.items.length > 0) && <View className='ml-2'>
                <DropdownMenu items={aMenuManageItems}>
                    <Button variant="default" size={size} tooltip="Settings" startDecorator="DotsThreeOutline" />
                </DropdownMenu>
            </View>}
        </>
    )
}

function CoverMenuMeta(props) {
    return (
        <Menu {...props} displayType="mixed" params={{ button_variant: 'text', button_size: 'sm', button_hide_title_on_small: false }} />
    )
}

export function CoverSmall(props) {
    const routerExpo = useRouter()
    const data = props.data
    const { colors } = Theme()
    const windowWidth = useWindowDimensions().width;
    // 
    return (
        <Row
            className=" justify-left items-center pt-0 w-full h-24 bg-primary-200 dark:bg-primary-950"
        >
            <View className="absolute h-80 w-full">
                {!!data.cover && (
                    <><Image view="cover"
                        sizes="(max-width:1280px) 100vw, 1280px"
                        className="u-cover "
                        src={data.cover.src} />
                        <BlurView intensity={90} tint="dark" style={{ width: '100%', height: 320 }} >
                        </BlurView></>

                )}
            </View>
            <Pressable
                className="mx-4 bg-bgrcard dark:bg-bgrcard-d w-10 h-10 rounded-full justify-center items-center"
                onPress={routerExpo.back}
            >
                <Icon
                    icon="ArrowLeft"
                    width={24}
                    height={24}
                    color={colors.barsColor}
                />
            </Pressable>
            <Profile
                {...data.profile}
                displayType="unit_wo_info"
                displaySize="base"
            />
            <View className='overflow-hidden text-ellipsis w-3/4 nowrap'>
                <H1C className="font-bold text-base ml-2 tracking-tight text-white">
                    {data.profile.display_name}
                </H1C>
            </View>
        </Row>
    )
}

export default function ElementCover(props) {
    const routerExpo = useRouter()
    const data = props.data
    const { colors } = Theme()

    let bPerson = props.data.profile.module == 'bx_persons' ? true : false

    return (
        <View className=" bg-white dark:bg-neutral-900">
            <View className=" absolute h-48 w-full   bg-primary-200    dark:bg-primary-950">
                {!!data.cover && (
                    <Image
                        alt={data.group_name}
                        view="cover"
                        sizes="(max-width:1280px) 100vw, 1280px"
                        className="u-cover "
                        src={data.cover.src}
                    />
                )}
            </View>
            <Row className=" justify-left w-full h-24 pt-4">
                <Pressable
                    className="mr-2 ml-2 bg-bgrnavbar dark:bg-bgrnavbar-d    w-10 h-10 rounded-full justify-center items-center"
                    onPress={() => routerExpo.back()}
                >
                    <Icon icon="ArrowLeft" width={24} height={24} color={colors.barsColor} />
                </Pressable>
            </Row>
            <View className="flex-col md:flex-row  px-2  ">
                {bPerson ? <View className=" w-full  items-center  ">
                    <View className='rounded-full p-1 z-50 duration-200 bg-bgrcard-h dark:bg-bgrcard-dh '>
                        <Profile
                            {...data.profile}
                            displayType="unit_wo_info"
                            displaySize='4xl'
                        />
                    </View>
                </View> : <View className=" w-full  items-center h-24 "/>
                }
                <View className="flex-col lg:flex-row px-2  my-4 flex-auto">
                    <View className=" flex-col  items-center md:items-start flex-auto  mb-2">
                        <Text className="tracking-tight text-3xl lg:text-4xl font-bold text-neutral-900 dark:text-neutral-50">
                            {data.profile.display_name}
                        </Text>

                        <Row className='mb-2'>
                            <CoverMenuMeta {...data.meta_menu} />
                        </Row>
                    </View>

                    <View className="flex-none mt-auto lg:mt-6 max-w-3xl overflow-hidden mb-2">
                        <ScrollView horizontal={true} className={(data.actions_menu.items.length > (100) ? '' : 'mx-auto md:ml-0') + ''}>
                            <CoverMenu {...data.actions_menu} uri={props?.uri} />
                        </ScrollView>
                    </View>

                    {bPerson &&
                        <Text
                            numberOfLines={3}
                            className="lg:hidden  w-full text-sm md:text-base text-neutral-800 dark:text-neutral-200 "
                        >
                            {stripTags(data.profile.info.description)}
                        </Text>
                    }
                </View>
            </View>
        </View>
    )
}
