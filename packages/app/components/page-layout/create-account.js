import { View, Row, Pressable, ScrollView } from 'app/design/view'
import { BlockByName, DataByName } from 'app/components/block'
import { getPageWidth } from 'app/lib/util'
import { Text } from 'app/design/typography'
import Card from 'app/components/card'
import { Button } from 'app/design/controls'
import Link from 'app/ui/atoms/link'
import { Platform } from 'react-native'

export default function PageLayout(props) {
    let cls = 'lg:h-[calc(100vh-4rem)]';
    const isWeb = Platform.OS == 'web';
    if (isWeb) {
        cls += ' justify-center';
    }

    const joinData = DataByName(props.data, props.blocks.form_join);
    const isAllowJoin = joinData.content[0].type == "form";
    
    return (
        <ScrollView className={cls}>
            <View className=" w-full p-2 mx-auto max-w-5xl flex-col items-center lg:flex-row  rounded-3xl lg:bg-bgrnavbar/50 lg:dark:bg-bgrnavbar-d/50 lg:border border-dashed border-bdr dark:border-bdr-d ">
                <View className="flex-col p-8 flex-auto w-full  items-center lg:items-start  gap-y-4 lg:gap-y-8 my-auto ">
                    <Text className="text-4xl lg:text-5xl tracking-tight font-bold text-neutral-800 dark:text-neutral-200 ">
                        { isAllowJoin ? 'Join now!' : 'Request Invitation' }
                    </Text>

                    <Text className="text-base lg:text-lg xl:text-xl  text-neutral-700 dark:text-neutral-300  ">
                        { isAllowJoin ? 'Create an account to get started.' : 'Registration is by invitation only.' }
                    </Text>
                    <View className="flex-row hidden lg:flex  gap-x-12 gap-y-2">
                        <View className="flex-col gap-y-4">
                            <View className="flex-row gap-x-2 ">
                                <Button
                                    variant="outline"
                                    startDecorator="Users"
                                    size="sm"
                                    full
                                    rounded
                                />
                                <Text className="flex-auto my-auto text-neutral-800 dark:text-neutral-200 text-lg font-semibold ">
                                    Meet People
                                </Text>
                            </View>

                            <View className="flex-row gap-x-2 ">
                                <Button
                                    variant="outline"
                                    startDecorator="UsersThree"
                                    rounded
                                    size="sm"
                                />
                                <Text className="flex-auto my-auto text-neutral-800 dark:text-neutral-200 text-lg font-semibold ">
                                    Join Groups
                                </Text>
                            </View>

                            <View className="flex-row gap-x-2 ">
                                <Button
                                    variant="outline"
                                    startDecorator="ChatCenteredText"
                                    rounded
                                    size="sm"
                                />
                                <Text className="flex-auto my-auto text-neutral-800 dark:text-neutral-200 text-lg font-semibold ">
                                    Share Ideas
                                </Text>
                            </View>

                            <View className="flex-row gap-x-2 ">
                                <Button
                                    variant="outline"
                                    startDecorator="CalendarCheck"
                                    rounded
                                    size="sm"
                                />
                                <Text className="flex-auto my-auto text-neutral-800 dark:text-neutral-200 text-lg font-semibold ">
                                    Discover Events
                                </Text>
                            </View>
                        </View>

                        <View className="flex-col gap-y-4">
                            <View className="flex-row gap-x-2 ">
                                <Button
                                    variant="outline"
                                    startDecorator="ChatTeardropDots"
                                    rounded
                                    size="sm"
                                />
                                <Text className="flex-auto my-auto text-neutral-800 dark:text-neutral-200 text-lg font-semibold ">
                                    Message Friends
                                </Text>
                            </View>

                            <View className="flex-row gap-x-2 ">
                                <Button
                                    variant="outline"
                                    startDecorator="Chats"
                                    rounded
                                    size="sm"
                                />
                                <Text className="flex-auto my-auto text-neutral-800 dark:text-neutral-200 text-lg font-semibold ">
                                    Discuss Topics
                                </Text>
                            </View>

                            <View className="flex-row gap-x-2 ">
                                <Button
                                    variant="outline"
                                    startDecorator="Storefront"
                                    rounded
                                    size="sm"
                                />
                                <Text className="flex-auto my-auto text-neutral-800 dark:text-neutral-200 text-lg font-semibold ">
                                    Buy & Sell
                                </Text>
                            </View>

                            <View className="flex-row gap-x-2 ">
                                <Button
                                    variant="outline"
                                    startDecorator="Video"
                                    rounded
                                    size="sm"
                                />
                                <Text className="flex-auto my-auto text-neutral-800 dark:text-neutral-200 text-lg font-semibold ">
                                    Watch Videos
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                <View className=" flex-auto flex-col gap-y-4 w-full max-w-md  ">
                    {!isAllowJoin && <BlockByName name={props.blocks.form_invitation} data={props.data} />}
                    {isAllowJoin && <BlockByName name={props.blocks.form_join} data={props.data} />}
                    <Card
                        rounded=" rounded-2xl "
                        addClassName="border p-6 w-full  max-w-xl mx-auto flex-auto gap-y-6 flex-col "
                    >
                        <Text className="text-lg font-bold  mx-auto text-neutral-700 dark:text-neutral-300  ">
                            Already have an account?
                        </Text>
                        <Link className=" w-full " href="/login">
                            <Button
                                title="Log in with email"
                                variant="outline"
                                startDecorator="SignIn"
                                size="base"
                                fullWidth
                            />
                        </Link>
                    </Card>

                </View>
            </View>
        </ScrollView>
    )
}
