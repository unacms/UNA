import { Text } from 'react-native'
import Link from 'app/ui/atoms/link'
import { View} from 'app/design/view'
import Image from 'app/ui/atoms/image'
import { Button } from 'app/design/controls'

export default function ElementCover(a) {

  return  <><View><Link href="/"><Text className="text-3xl lg:text-4xl xl:text-5xl  font-bold text-neutral-800 dark:text-neutral-200">
  Welcome to the community!{a.aaa}
</Text></Link><Image
        src="https://ci.una.io/test3/s/bx_posts_covers/yetmq4v87qwdvuiqqez3ccuu5nqgdpzl.jpg"
        sizes="512px"
        view="cover"
        className="u-cover"
      /><Button></Button></View></>

}

export async function getStaticProps() {

  return {
    props: {
      aaa:123
    },
  };
}