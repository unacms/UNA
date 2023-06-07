import { View, Row } from 'app/design/view'
import { Text } from 'app/design/typography'
import { Button } from 'app/design/controls'
import Link from 'app/ui/atoms/link'
import Image from 'app/ui/atoms/image'

export default function ElementCover(a) {
  return  <><View className="relative flex-col p-8 xl:p-12 w-full md:flex-row gap-4 xl:gap-8 duration-500  max-w-screen-2xl mx-auto ">

  <View className="flex-col items-center text-center md:items-start md:text-start gap-y-6 my-auto py-8 flex-auto">
    <Text className="text-3xl lg:text-4xl xl:text-5xl  font-bold text-neutral-800 dark:text-neutral-200">
      Welcome to the community!
    </Text>
    

    <Text className="text-lg lg:text-xl xl:text-2xl  text-neutral-600 dark:text-neutral-400">
      The place to share, connect and grow with people you trust. Create
      account to join the community.
    </Text>
    <Row className="gap-4">
      <Link href="/create-account">
        <Button title="Get Started" variant="primary" />
      </Link>
      <Link href="/login">
        <Button title="Login" variant="default" />
      </Link>
    </Row>
  </View>
 

  <View className="w-full md:w-[40%] border shadow-xl hover:rotate-3 duration-500 border-neutral-50/50 dark:border-neutral-700/50 w-full bg-neutral-50/50 dark:bg-neutral-800/50 backdrop-blur-md   rounded-xl p-2  ">

    <View className="w-full pb-[50%]  rounded-md h-full overflow-hidden">

      <Image
        src="https://ci.una.io/test3/s/bx_posts_covers/yetmq4v87qwdvuiqqez3ccuu5nqgdpzl.jpg"
        sizes="512px"
        view="cover"
        className="u-cover"
      />
    </View>
  </View>
  
</View></>

}