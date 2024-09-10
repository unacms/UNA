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
import { useState, useEffect} from "react";

export default function PageLayout(props) {

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
        <KbAvoidingView style={{ flex: 1 }} offset={1}>
            <View style={{ flex: 1 }} className={Platform.OS === 'web' ? ' p-4 w-full mx-auto max-w-5xl flex-col items-center lg:flex-row  rounded-3xl lg:bg-bgrnavbar/50 lg:dark:bg-bgrnavbar-d/50 lg:border border-dashed border-bdr dark:border-bdr-d':' p-4'}>
                {!isKeyboardVisible && <View className={Platform.OS === 'web' ? "flex-col p-4 lg:p-8 flex-auto w-full  items-center lg:items-start gap-y-4 my-auto ":"w-full mx-auto max-w-5xl flex-col items-center lg:flex-row rounded-3xl lg:bg-bgrnavbar/50 lg:dark:bg-bgrnavbar-d/50 lg:border border-dashed border-bdr dark:border-bdr-d"}>
                        <Text className="text-4xl lg:text-5xl tracking-tight font-bold text-neutral-800 dark:text-neutral-200 ">
                        {isAllowJoin ? 'Join now!' : 'Request Invitation'}
                    </Text>

                    <Text className="text-base lg:text-lg xl:text-xl  text-neutral-700 dark:text-neutral-300  ">
                        {isAllowJoin ? 'Create an account to get started.' : 'Registration is by invitation only.'}
                    </Text>
                    <View className="w-full mt-4">{appStatic('components_logincontent')}</View>
                </View>}

                <View className="mx-auto w-full max-w-lg md:w-1/2 lg:w-2/5 my-auto mx-auto items-center lg:p-2  ">
                    <View className="  w-full   "><ScrollView>
                    <Card
                            rounded=" rounded-2xl "
                            addClassName=" px-4 py-2 sm:px-6 sm:py-4 w-full  max-w-xl mx-auto flex-auto  "
                        >
                                {!isAllowJoin && <BlockByName name={props.blocks.form_invitation} data={props.data} />}
                                {isAllowJoin && <BlockByName name={props.blocks.form_join} data={props.data} />}
                                  
                        </Card>
                        </ScrollView>    
                        {!isKeyboardVisible && <><View className="w-full m-2"></View>
                        <Card
                            rounded=" rounded-2xl "
                            addClassName="p-6 w-full  max-w-xl mx-auto flex-auto flex-col "
                        >
                            <Text className="text-lg font-bold  mx-auto text-neutral-700 dark:text-neutral-300  mb-6">
                                Already have an account?
                            </Text>
                            <Link className=" w-full " href="/login">
                                <Button
                                    title="Log in with email"

                                    startDecorator="SignIn"
                                    size="base"
                                    fullWidth
                                />
                            </Link>
                        </Card></>}
                    </View>
                </View>
            </View>
</KbAvoidingView>
    )
}