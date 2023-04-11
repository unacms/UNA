import Link from '../ui/atoms/link';
import { View, Row } from 'app/design/view'
import { Text } from 'app/design/typography'

export default function () {
 	return (
        <View className="border-t-2  w-full">
            <Row className="flex-auto items-center flex-row justify-around my-2 w-full">
            <Link             
                href="/timeline-view-home"
                className="flex items-center rounded-lg text-base font-semibold text-gray-700 hover:text-gray-900 duration-200 hover:bg-gray-200/50 dark:hover:text-white dark:text-gray-300 dark:hover:bg-gray-700/50 items-center"
              >
                <View className="h-6 w-6 bg-gray-500 rounded-full transition duration-75 group-hover:bg-gray-900 dark:bg-gray-400 dark:group-hover:bg-white" />
                <Text >Timeline</Text>
             
            </Link>
            <Link
                href="/posts-home"
                className="flex items-center rounded-lg text-base font-semibold text-gray-700 hover:text-gray-900 duration-200 hover:bg-gray-200/50 dark:hover:text-white dark:text-gray-300 dark:hover:bg-gray-700/50 items-center"
              >
                <View className="h-6 w-6 bg-gray-500 rounded-full transition duration-75 group-hover:bg-gray-900 dark:bg-gray-400 dark:group-hover:bg-white" />
                <Text>Posts</Text>
              </Link>

            <Link
             
                href="/persons-home"
                className="flex items-center rounded-lg text-base font-semibold text-gray-700 hover:text-gray-900 duration-200 hover:bg-gray-200/50 dark:hover:text-white dark:text-gray-300 dark:hover:bg-gray-700/50 items-center"
              >
                <View className="h-6 w-6 bg-gray-500 rounded-full transition duration-75 group-hover:bg-gray-900 dark:bg-gray-400 dark:group-hover:bg-white" />
                <Text >persons</Text>
             
            </Link>
            <Link
                href="/contact"
                className="flex items-center rounded-lg text-base font-semibold text-gray-700 hover:text-gray-900 duration-200 hover:bg-gray-200/50 dark:hover:text-white dark:text-gray-300 dark:hover:bg-gray-700/50 items-center"
              >
                <View className="h-6 w-6 bg-gray-500 rounded-full flex-shrink-0 transition duration-75 group-hover:bg-gray-900 dark:bg-gray-400 dark:group-hover:bg-white" />
                <Text >Contact</Text>

            </Link>
            <Link              
                href="/login"
                className="flex items-center rounded-lg text-base font-semibold text-gray-700 hover:text-gray-900 duration-200 hover:bg-gray-200/50 dark:hover:text-white dark:text-gray-300 dark:hover:bg-gray-700/50 items-center"
              >
                <View className="h-6 w-6 bg-gray-500 rounded-full flex-shrink-0 transition duration-75 group-hover:bg-gray-900 dark:bg-gray-400 dark:group-hover:bg-white" />
                <Text >login</Text>

            </Link>
          </Row>
        </View>
    );
} 
