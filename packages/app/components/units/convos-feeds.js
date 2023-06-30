import Time from '../../ui/atoms/time';
import Profile from '../../ui/molecules/profile';
import { Text } from 'app/design/typography';
import { Pressable, View } from 'app/design/view';
import React from 'react';

export function ListFeed(data) {
  const { author_data, message, date, title, count, onPress } = data || {};

  return <Pressable onPress={onPress} >
            <View className="flex-row p-2 sm:p-3 sm:mx-1 sm:mt-2  group duration-200 overflow-hidden sm:rounded-lg
                        bg-backgroundcard dark:bg-backgroundcard-dark hover:bg-backgroundcard-hover dark:hover:bg-backgroundcard-darkhover
            active:bg-backgroundcard-active dark:active:bg-backgroundcard-darkactive mt-[1px] active:translate-y-0.5
                        border-bordercolorcard dark:border-bordercolorcard-dark sm:hover:border-bordercolorcard-hover sm:dark:hover:border-bordercolorcard-darkhover">

            <View className="w-12 h-12 mr-2 rounded-full flex-none bg-secondary-500/10">
            <Profile
              { ...author_data }
              displayType="unit_wo_info"
              displaySize="lg"
            />
         </View>
        <View className="flex-auto flex-col my-auto ">
          <View className="flex-row gap-2">
            <Text
                className="flex-auto text-lg font-bold text-gray-800 dark:text-gray-200 group-hover:text-gray-950 dark:group-hover:text-gray-50"
                numberOfLines={1}
            > { title } </Text>
            <Time className="text-sm flex-none" ts={ date }></Time>
          </View>
          <View className="flex-row  w-full items-end content-end">
            <Text
              className="flex-auto mr-2 text-sm text-gray-800 dark:text-gray-200 group-hover:text-gray-950 dark:group-hover:text-gray-50"
              numberOfLines={1}
            >
              { message }
            </Text>
            <View className="flex-none bg-primary dark:bg-primary-dark rounded-full  my-auto h-min px-1.5">
              { count > 0 && (
                <Text className="text-xs text-white dark:text-black font-medium">
                  { count }
                </Text>
              )}
            </View>
          </View>
        </View>
      </View>
    </Pressable>
}