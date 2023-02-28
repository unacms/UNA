import { View } from 'app/design/view'
import { TouchableOpacity } from 'app/design/view'
import Link from 'app/components/atoms/link'
import { Icon } from 'app/components/svg'
import { A, H1, P, Text, TextLink } from 'app/design/typography'

export default function ElementMainMenu(props) {

return (
<View className="h-full xl:flex px-3 py-4 2xl:bg-transparent 2xl:dark:bg-transparent  bg-sidebar dark:bg-sidebar-dark border-r 2xl:border-none border-bordercolor/10 dark:border-bordercolor-dark/10 flex-col space-y-2">
<View className="flex-col space-y-0.5">
  <TouchableOpacity>
    <Link
      href="/timeline-view-home"
      className="group flex-row space-x-3 items-center rounded-lg p-3   duration-200 bg-item-hover/50 dark:bg-item-hover-dark/50"
    >
      <Icon
        icon="home"
        className="h-6 w-6 group-hover:text-neo-800 text-neo-500 dark:group-hover:text-neo-100 dark:text-neo-300 "
      ></Icon>

      <Text className="text-base font- duration-200 group-hover:text-neo-900 text-neo-700 dark:group-hover:text-neo-50 dark:text-neo-200 ">
        Home
      </Text>
    </Link>
  </TouchableOpacity>
  <TouchableOpacity>
    <Link
      href="/posts-home"
      className="group flex-row space-x-3 items-center rounded-lg p-3   duration-200 hover:bg-item-hover/50 dark:hover:bg-item-hover-dark/50"
    >
      <Icon
        icon="discover"
        className="h-6 w-6 group-hover:text-neo-800 text-neo-500 dark:group-hover:text-neo-100 dark:text-neo-300 "
      ></Icon>

      <Text className="text-base font- duration-200 group-hover:text-neo-900 text-neo-700 dark:group-hover:text-neo-50 dark:text-neo-200 ">
        Discover
      </Text>
    </Link>
  </TouchableOpacity>
  <TouchableOpacity>
    <Link
      href="/posts-home"
      className="group flex-row space-x-3 items-center rounded-lg p-3   duration-200 hover:bg-item-hover/50 dark:hover:bg-item-hover-dark/50"
    >
      <Icon
        icon="post"
        className="h-6 w-6 group-hover:text-neo-800 text-neo-500 dark:group-hover:text-neo-100 dark:text-neo-300 "
      ></Icon>

      <Text className="text-base font- duration-200 group-hover:text-neo-900 text-neo-700 dark:group-hover:text-neo-50 dark:text-neo-200 ">
        Posts
      </Text>
    </Link>
  </TouchableOpacity>
  <TouchableOpacity>
    <Link
      href="/groups-home"
      className="group flex-row space-x-3 items-center rounded-lg p-3   duration-200 hover:bg-item-hover/50 dark:hover:bg-item-hover-dark/50"
    >
      <Icon
        icon="group"
        className="h-6 w-6 group-hover:text-neo-800 text-neo-500 dark:group-hover:text-neo-100 dark:text-neo-300 "
      ></Icon>

      <Text className="text-base font- duration-200 group-hover:text-neo-900 text-neo-700 dark:group-hover:text-neo-50 dark:text-neo-200 ">
        Groups
      </Text>
    </Link>
  </TouchableOpacity>
  <TouchableOpacity>
    <Link
      href="/channels"
      className="group flex-row space-x-3 items-center rounded-lg p-3   duration-200 hover:bg-item-hover/50 dark:hover:bg-item-hover-dark/50"
    >
      <Icon
        icon="hash"
        className="h-6 w-6 group-hover:text-neo-800 text-neo-500 dark:group-hover:text-neo-100 dark:text-neo-300 "
      ></Icon>

      <Text className="text-base font- duration-200 group-hover:text-neo-900 text-neo-700 dark:group-hover:text-neo-50 dark:text-neo-200 ">
        Channels
      </Text>
    </Link>
  </TouchableOpacity>
  <TouchableOpacity>
    <Link
      href="/persons-home"
      className="group flex-row space-x-3 items-center rounded-lg p-3   duration-200 hover:bg-item-hover/50 dark:hover:bg-item-hover-dark/50"
    >
      <Icon
        icon="people"
        className="h-6 w-6 group-hover:text-neo-800 text-neo-500 dark:group-hover:text-neo-100 dark:text-neo-300 "
      ></Icon>

      <Text className="text-base font- duration-200 group-hover:text-neo-900 text-neo-700 dark:group-hover:text-neo-50 dark:text-neo-200 ">
        People
      </Text>
    </Link>
  </TouchableOpacity>
  <TouchableOpacity>
    <Link
      href="/contact"
      className="group flex-row space-x-3 items-center rounded-lg p-3   duration-200 hover:bg-item-hover/50 dark:hover:bg-item-hover-dark/50"
    >
      <Icon
        icon="contact"
        className="h-6 w-6 group-hover:text-neo-800 text-neo-500 dark:group-hover:text-neo-100 dark:text-neo-300 "
      ></Icon>

      <Text className=" text-base font- duration-200 group-hover:text-neo-900 text-neo-700 dark:group-hover:text-neo-50 dark:text-neo-200 ">
        Contact
      </Text>
    </Link>
  </TouchableOpacity>
  <TouchableOpacity>
  <Link
      href="/about"
      className="group flex-row space-x-3 items-center rounded-lg p-3   duration-200 hover:bg-item-hover/50 dark:hover:bg-item-hover-dark/50"
    >
      <Icon
        icon="about"
        className="h-6 w-6 group-hover:text-neo-800 text-neo-500 dark:group-hover:text-neo-100 dark:text-neo-300 "
      ></Icon>

      <Text className=" text-base font- duration-200 group-hover:text-neo-900 text-neo-700 dark:group-hover:text-neo-50 dark:text-neo-200 ">
      About
      </Text>
    </Link>
  </TouchableOpacity>
</View>
</View>);
}