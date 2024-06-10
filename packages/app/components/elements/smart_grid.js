import { Text} from 'app/design/typography'
import { View, Row } from 'app/design/view'
import { useCurrentUser } from 'app/context/user'
import { stripTags } from 'app/lib/util';
import { Icon } from 'app/ui/atoms/icon'
import { Button } from 'app/design/controls';
import { fetcher } from 'app/lib/fetcher';
import React, { useState } from 'react';

export default function({data}) {
    return <View className='bg-red-500 h-24 w-full'>TODO</View>
}