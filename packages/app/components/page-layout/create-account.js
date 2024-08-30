import { View, Row, Pressable, ScrollView } from 'app/design/view'
import { BlockByName, DataByName } from 'app/components/block'
import { getPageWidth } from 'app/lib/util'
import { Text } from 'app/design/typography'
import Card from 'app/components/card'
import { Button } from 'app/design/controls'
import Link from 'app/ui/atoms/link'
import { Platform } from 'react-native'
import { appStatic } from 'app/lib/app-static'
import KbAvoidingView from 'app/ui/atoms/kb-avoiding-view';

export default function PageLayout(props) {


    const joinData = DataByName(props.data, props.blocks.form_join);
    const isAllowJoin = joinData.content[0].type == "form";

    return (
        <ScrollView className='p-4' keyboardShouldPersistTaps="always" keyboardDismissMode="on-drag">
            <View className=" w-full mx-auto max-w-5xl flex-col items-center lg:flex-row  rounded-3xl lg:bg-bgrnavbar/50 lg:dark:bg-bgrnavbar-d/50 lg:border border-dashed border-bdr dark:border-bdr-d ">
                <View className="flex-col p-4 lg:p-8 flex-auto w-full  items-center lg:items-start gap-y-4 my-auto ">
                    <Text className="text-4xl lg:text-5xl tracking-tight font-bold text-neutral-800 dark:text-neutral-200 ">
                        {isAllowJoin ? 'Join now!' : 'Request Invitation'}
                    </Text>

                    <Text className="text-base lg:text-lg xl:text-xl  text-neutral-700 dark:text-neutral-300  ">
                        {isAllowJoin ? 'Create an account to get started.' : 'Registration is by invitation only.'}
                    </Text>
                    <View className="w-full mt-4">{appStatic('components_logincontent')}</View>
                </View>

                <View className="mx-auto w-full max-w-lg md:w-1/2 lg:w-2/5 my-auto mx-auto items-center lg:p-2  ">
                    <View className=" flex-auto w-full   ">
                        <Card
                            rounded=" rounded-2xl "
                            addClassName=" px-4 py-2 sm:px-6 sm:py-4 w-full  max-w-xl mx-auto flex-auto  "
                        >
                            <KbAvoidingView>
                                {!isAllowJoin && <BlockByName name={props.blocks.form_invitation} data={props.data} />}
                                {isAllowJoin && <BlockByName name={props.blocks.form_join} data={props.data} />}
                            </KbAvoidingView>
                        </Card>
                        <View className="w-full m-2"></View>
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
                        </Card>
                    </View>
                </View>
            </View>
        </ScrollView>
    )
}
