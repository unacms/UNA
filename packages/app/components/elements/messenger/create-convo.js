import { View } from 'app/design/view';
import { Link } from 'app/ui/atoms/link';
import {Button, Input, InputRounded} from 'app/design/controls';
import {memo, useCallback, useRef, useState} from 'react';
import { Text } from 'app/design/typography';
import { Icon } from "app/ui/atoms/icon";
import { Theme } from "app/design/theme";
import Services from "./services/history";
import Profile from "app/ui/molecules/profile";
import { Pressable } from 'app/design/view'
import {getSkeleton} from "../../../lib/skeleton-helpers";

const SelectedUser = ({ data, onRemove }) => {
    return <View className="px-1 py-1 flex-row
                group duration-200 rounded-xl
                active:opacity-50 active:translate-y-1
                hover:bg-bgritem-h dark:hover:bg-bgritem-dh
                max-w-2xl self-center border border-bdrnavbar dark:border-bdrnavbar-d"
            >
            <View className="mr-2 rounded-full flex-none ">
                <Profile
                    url_avatar={data?.image?.src}
                    displayType="unit_wo_info"
                    displaySize="xs"
                />
            </View>
            <View className="flex-auto my-auto">
                <View className="flex-row justify-between">
                    <View className="justify-center flex-auto">
                        <Text className="text-xs mr-2 truncate text-neutral-900  dark:text-neutral-100">
                            {data.title}
                        </Text>
                    </View>
                    <View className="flex-none">
                      <Button size="xs" variant="default" startDecorator="Minus" align="start" onPress={() => onRemove(data)} />
                    </View>
                </View>
            </View>
        </View>;
};

const User = ({ data, onSelect }) => {
    return <Pressable onPress={() => onSelect(data)}>
            <View className="px-3 py-2 flex-row group duration-200 rounded-xl active:opacity-50 active:translate-y-1
                hover:bg-bgritem-h dark:hover:bg-bgritem-dh max-w-5xl self-center w-full border border-bdrnavbar dark:border-bdrnavbar-d">
                <View className="mr-2 rounded-full flex-none">
                    <Profile
                        url_avatar={data?.image?.src}
                        displayType="unit_wo_info"
                        displaySize="base"
                    />
                </View>
                <View className="flex-auto my-auto ">
                    <View className="flex-row justify-between">
                        <View className="justify-center flex-auto ">
                            <Text className="text-sm mr-2 font-semibold truncate text-neutral-900  dark:text-neutral-100">
                                {data.title}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>
        </Pressable>
};

const CreateConvo = memo(({ onClose, viewButtons }) => {
    const { colors } = Theme();
    const iTimeoutRef = useRef(null);
    const [users, setUsers] = useState([]);
    const [susers, setSUsers] = useState([]);
    const [showLoading, setLoading] = useState(false);

    const handleSearchUsers = useCallback((sValue) => {
        clearTimeout(iTimeoutRef.current);
        iTimeoutRef.current = setTimeout(() => {
                setLoading(true);
                Services.getSearchUsers(sValue).then((data) => {
                    setUsers(data);
                    setLoading(false);
                })
            }
        , 500);

    }, [users]);

    const handlerOnSelect = useCallback((oData) => {
        if (susers.find((user) => user.id === oData.id) === undefined)
            setSUsers((prev) => ([...prev, oData]));

        setUsers(users.filter((user) => user.id !== oData.id));
    }, [users]);

    const handlerOnRemove = useCallback((oData) => {
        if (users.find((user) => user.id === oData.id) === undefined)
            setUsers((prev) => [...prev, oData]);

        setSUsers(susers.filter((user) => user.id !== oData.id));

    }, [users, susers]);

    return <View className="w-full h-full flex flex-col">
                <View className="max-w-full h-full flex flex-col relative">
                    <View className="text-center py-4">
                        <View className="w-full flex flex-row justify-between pb-4">
                            { viewButtons && <Button variant="outline" startDecorator="CaretLeft" rounded align="start" onPress={ onClose } /> }
                            <View className={"relative flex items-center flex-1"}>
                                <Icon className={"absolute"} icon={"users"} width={48} height={48} color={colors.barsColor}/>
                            </View>
                            { viewButtons && <Button variant="outline" startDecorator="X" rounded align="start" onPress={ onClose } /> }
                        </View>
                        <View className="w-full p-2">
                            <Text className="text-center text-xl lg:text-2xl font-bold text-neutral-900 dark:text-neutral-50">Add users to start messaging</Text>
                        </View>
                    </View>
                    <View className="flex flex-col flex-0 h-full w-full">
                        <View className="mt-5 text-sm items-center flex flex-col flex-0 w-full">
                            <View className="text-center p-1 w-full overflow-y-auto h-full flex-1 flex-wrap flex-row gap-2 items-start content-start">
                                {susers && susers.map((oItem) => <SelectedUser key={oItem.id} data={oItem} onRemove={handlerOnRemove}/>) }
                            </View>
                            <View className="flex w-full flex-row space-x-2">
                                <View className={"flex flex-row flex-1 overflow-hidden"}>
                                    <InputRounded
                                        placeholder={"Select users..."}
                                        className="px-2 w-full"
                                        onChangeText={handleSearchUsers}
                                        role="textbox" aria-label="Select users..."
                                    />
                                </View>
                                <Button variant="outline" startDecorator="Check" rounded align="start" onPress={ () => {} } />
                            </View>
                        </View>
                        <View className="text-center mt-4 overflow-y-auto h-full flex-1 flex-wrap flex-row gap-2 items-start content-start">
                            { users && !showLoading && users.map((oItem) => <User key={oItem.id} data={oItem} onSelect={handlerOnSelect}/>) }
                            { showLoading && getSkeleton('notifications') }
                        </View>
                    </View>
                </View>
          </View>
});

export default CreateConvo;