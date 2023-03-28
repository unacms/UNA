import Link from '../ui/atoms/link';
import { View, Row } from 'app/design/view'
import { Text } from 'app/design/typography'
import { NavBottomTabsList } from 'app/components/nav/settings'
import { Icon } from 'app/components/svg';

export default function () {

    let TabList = NavBottomTabsList();

 	return (
        <View className="border-t-2 border-red-200 bg-orange-100 w-full">
            <Row className="flex-auto items-center flex-row justify-around my-2 w-full">
                {TabList.map((tab, index) => (
                    <Link             
                    href={tab.url}
                    className="flex items-center rounded-lg text-base font-semibold text-gray-700 hover:text-gray-900 duration-200 hover:bg-gray-200/50 dark:hover:text-white dark:text-gray-300 dark:hover:bg-gray-700/50 items-center"
                >
                    <Icon icon={tab.icon} width={24} height={24} color="black"/>
                    <Text>{tab.title}</Text>
                </Link>
                ))}
          </Row>
        </View>
    );
} 
