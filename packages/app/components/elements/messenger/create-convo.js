import { View } from 'app/design/view';
import { Link } from 'app/ui/atoms/link';
import {Button, InputRounded} from 'app/design/controls';
import { useEffect, useState, memo } from 'react';
import { Text } from 'app/design/typography';
import Form from "../form";
import useHistory, { useSendData, useHistoryMessageAction } from "./hooks/useHistory";
import useKeyboard from "./hooks/useKeyboard";
import Services from "./services/history";
import { Icon } from "app/ui/atoms/icon";
import { Theme } from "app/design/theme";

const CreateConvo = memo(({ onClose }) => {
    const { colors } = Theme();

    return <View className="w-full h-full flex flex-col">
                <View className="max-w-full h-full mt-4 flex flex-col relative">
                    <View className="text-center p-4">
                        <View className="w-full flex flex-row justify-between">
                            <Button variant="outline" startDecorator="CaretLeft" rounded align="start" onPress={ onClose } />
                            <View className={"relative flex items-center flex-1"}>
                                <Icon className={"absolute"} icon={"users"} width={48} height={48} color={colors.barsColor}/>
                            </View>
                            <Button variant="outline" startDecorator="X" rounded align="start" onPress={ onClose } />
                        </View>
                        <View className="w-full">
                            <Text className="text-center text-2xl lg:text-xl font-bold text-neutral-900 dark:text-neutral-50">Add users to start messaging</Text>
                        </View>
                    </View>
                    <View className="flex flex-col flex-0 h-full">
                        <View className="mt-5 mx-4 text-sm items-center gap-1 flex flex-col flex-stat">
                            <View className="min-h-[2.5rem] max-h-[12rem] w-full overflow-y-auto flex-1 items-center">
                               {/* <Text>Existed users list</Text>*/}
                            </View>
                            <View className="flex w-full min-w-[8rem] flex-row">
                                <View className={"flex flex-row flex-1 px-2 overflow-hidden"}>
                                    <InputRounded placeholder={"Select users..."} className="px-2 w-full" />
                                </View>
                                <Button variant="outline" startDecorator="Check" rounded align="start" onPress={ () => {} } />
                            </View>
                        </View>
                        <View className="md:mt-2 mt-1 text-center mx-4 overflow-y-auto snap-y h-full mb-[2rem] flex-1">
                            {/*<Text>Found Users</Text>*/}
                        </View>
                    </View>
                </View>
          </View>
});

export default CreateConvo;