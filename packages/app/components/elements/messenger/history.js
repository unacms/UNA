import {Row, TouchableOpacity, View} from 'app/design/view';
import { Link } from 'app/ui/atoms/link';
import { Button } from 'app/design/controls';
import { useRef, useState, useContext, memo, useEffect} from 'react'
import MessengerContext from "./messenger-сontext";
import { Text } from 'app/design/typography'
import {WrappedTopMenu} from "./menu";
import {CommentsBrowse, CommentsForm} from "../../../lib/comments-helpers";
import {KeyboardAvoidingView, Platform} from "react-native";
//import { useRouter } from "next/router";
import Form from "../form";
import Loading from "../../../ui/atoms/loading";
import UniList from 'app/ui/atoms/unilist';
import { fetcher } from "../../../lib/fetcher";
import UnitFeed from "../../units/feed";

export default function ElementHistory({ convo, pressBack }) {
    const  { title } = convo,
        [messages, AddMessages] = useState([]),
        keyExtractor = item => item?.id,
        [loading, setLoading] = useState(false);

    //console.log('--- select ----- convo ', convo);
    return <View className="h-full">
            <View className="flex w-full p-2 flex-row h-[60px] relative border-b border-bordercolornavbar dark:border-bordercolornavbar-dark" >
                <View className="md:hidden">
                    <Button variant="outline" startDecorator="CaretLeft" rounded align="start" onPress={pressBack} />
                </View>
                <View className="w-full flex-1 flex items-center justify-center">
                   <Text className="truncate text-xl lg:text-3xl font-bold text-gray-900 dark:text-gray-50 capitalize flex items-center">{title}</Text>
                </View>
            </View>
            <View className="lg:py-4">
                {/*<UniList
                    data={messages}
                    renderItem={renderItem}
                    /*onEndReachedThreshold={1}
                    onEndReached={loadList}
                    */
                    /*keyExtractor={keyExtractor}*/
                    /*estimatedItemSize = {72}*/
                    /*ListFooterComponent={
                        loading && <View className='m-2'><Loading/></View>
                    }*/
                /*/>*/}
            </View>
    </View>
}