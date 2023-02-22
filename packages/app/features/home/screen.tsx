import { A, H1, P, Text, TextLink } from 'app/design/typography'
import Link from '../../components/atoms/link';
import { Row } from 'app/design/layout'
import { View } from 'app/design/view'


export function HomeScreen() {
  return (
    <View className="w-full">
    <View className=" p-2 grid place-items-center">
 
      <Row className="space-x-6">
        <TextLink href="/contact">
          Contact
        </TextLink>
        
        <TextLink href="/posts-home">
          Posts
        </TextLink>
        
        <TextLink  href="/timeline-view-home">
          Feed
        </TextLink>
        
        <Link vibrate="100" href="/about">
          <Text className='text-blue-500 font-bold text-base'>About</Text>
        </Link>
      </Row>

    </View>
    <View className="">
 
      

    </View>
    </View>
    
  )
}
