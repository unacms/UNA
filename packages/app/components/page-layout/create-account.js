import { View, Row, Pressable, ScrollView } from 'app/design/view'
import { BlockByName, DataByName } from 'app/components/block'
import { getPageWidth } from 'app/lib/util'
import { Text } from 'app/design/typography'
import Card from 'app/components/card'
import { Button } from 'app/design/controls'
import Link from 'app/ui/atoms/link'
import { Platform, Keyboard } from 'react-native'
import { appStatic } from 'app/lib/app-static'
import KbAvoidingView from 'app/ui/atoms/kb-avoiding-view';
import { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import AuthPanel from 'app/ui/molecules/auth';
import { Icon, IconSet } from 'app/icons'
import { IconSet as IconSetDefault } from 'app/icons.default'

export default function PageLayout(props) {
    const { t } = useTranslation();
    const [isKeyboardVisible, setKeyboardVisible] = useState(false);
    const joinData = DataByName(props.data, props.blocks.form_join);
    const isAllowJoin = joinData.content[0].type == "form";

    useEffect(() => {
        // Subscribe to keyboard events
        const keyboardDidShowListener = Keyboard.addListener(
            'keyboardDidShow',
            () => {
                setKeyboardVisible(true); // Set to true when the keyboard is shown
            }
        );
        const keyboardDidHideListener = Keyboard.addListener(
            'keyboardDidHide',
            () => {
                setKeyboardVisible(false); // Set to false when the keyboard is hidden
            }
        );

        // Cleanup the event listeners when the component unmounts
        return () => {
            keyboardDidHideListener.remove();
            keyboardDidShowListener.remove();
        };
    }, []);

    return (
        <KbAvoidingView style={{ flex: 1 }}>
            <View style={{ flex: 1 }} className={Platform.OS === 'web' ? 'w-full  px-4 py-12 mx-auto max-w-5xl items-center lg:flex-row gap-x-4 gap-y-4  ' : ' items-center p-4'}>
                <View className="flex-col gap-y-12 hidden lg:flex flex-auto">
                    <View className={Platform.OS === 'web' ? "flex-col p-4 lg:p-8 flex-auto w-full  items-center lg:items-start gap-y-2 my-auto " : "w-full mx-auto max-w-5xl flex-col items-center lg:flex-row rounded-3xl lg:bg-bgrnavbar/50 lg:dark:bg-bgrnavbar-d/50 lg:border border-dashed border-bdr dark:border-bdr-d"}>
                        <Text className="text-4xl lg:text-5xl tracking-tight font-bold text-neutral-800 dark:text-neutral-200 ">
                            {isAllowJoin ? 'Join now!' : 'Request Invitation'}
                        </Text>

                        <Text className="text-base lg:text-lg xl:text-xl mb-8 text-neutral-600 dark:text-neutral-400  ">
                            {isAllowJoin ? t('Create an account to get started') : t('Registration is by invitation only.')}
                        </Text>
                        <View className="flex-col gap-y-4">
            <View className="flex-row gap-x-4 ">
                <IconSetDefault.UsersRound
                    className="text-neutral-800 dark:text-neutral-200"
                    width={24}
                    height={24}
                />
                <Text className="flex-auto my-auto text-neutral-800 dark:text-neutral-200 text-base font-medium">
                    Meet new people
                </Text>
            </View>

            <View className="flex-row gap-x-4 ">
                <IconSetDefault.Compass
                    className="text-neutral-800 dark:text-neutral-200"
                    width={24}
                    height={24}
                />
                <Text className="flex-auto my-auto text-neutral-800 dark:text-neutral-200 text-base font-medium">
                    Discover cool spaces
                </Text>
            </View>

            <View className="flex-row gap-x-4 ">
                <IconSetDefault.Share2
                    className="text-neutral-800 dark:text-neutral-200"
                    width={24}
                    height={24}
                />
                <Text className="flex-auto my-auto text-neutral-800 dark:text-neutral-200 text-base font-medium">
                    Share your ideas
                </Text>
            </View>
        </View>
                    </View>
                </View>
                <Card
                    rounded="  rounded-[24px] "
                    addClassName=" animate-slidein p-6 w-full max-w-md mx-auto flex-auto "

                >
                    <View className="flex-col lg:hidden items-center mb-4">
                        <View className="w-12 m-4 items-center mx-auto text-neutral-800 dark:text-neutral-200 group-hover:text-neutral-900 dark:group-hover:text-neutral-100">
                            {appStatic('logo_mark')}
                        </View>
                        <Text className="flex items-center h-12 text-center text-xl font-bold text-neutral-800 dark:text-neutral-200 ">Create an account</Text>
                    </View>
                    {!isAllowJoin && <BlockByName name={props.blocks.form_invitation} data={props.data} formProps={{ auto_focus: true, hide_errors: true, button_full_width: true }} />}
                    {isAllowJoin && <BlockByName name={props.blocks.form_join} data={props.data} formProps={{ auto_focus: true, hide_errors: true, button_full_width: true }} />}
                    
                    <View className="flex items-center justify-center pt-4 mt-4 border-t border-bdr dark:border-bdr-d  ">
                        <Link className=" w-full " href="/login">
                            <Button
                                title="Sign in with email"
                             
                                size="base"
                                fullWidth
                            />
                        </Link>
                    </View>
                    <AuthPanel className="mt-3"/>
                </Card>
            </View>
        </KbAvoidingView >
    )
}