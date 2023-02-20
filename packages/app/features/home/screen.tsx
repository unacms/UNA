import { A, H1, P, Text, TextLink } from 'app/design/typography'
import { Row } from 'app/design/layout'
import { View } from 'app/design/view'


export function HomeScreen() {
  return (
    <View className="px-2 py-5 grid place-items-center bg-white dark:bg-black">
    <View className="max-w-md">
      <H1 className="text-black dark:text-white">Welcome to G-Med app.</H1>
      <View>
        <P className="text-black dark:text-white">
          UNA Universal App - for gMed
        </P>
        <P className="text-black dark:text-white">
          Solito is made by{' '}
          <A className="underline text-blue-600 hover:text-red-500 visited:text-purple-600"
            href="https://twitter.com/fernandotherojo"
            hrefAttrs={{
              target: '_blank',
              rel: 'noreferrer',
            }}
          >
            Fernando Rojo
          </A>
          .
        </P>
      </View>
      <View />

      <Row>
        <TextLink href="/contact">
          Contact
        </TextLink>
        <Text> - </Text>
        <TextLink href="/posts-home">
          Posts
        </TextLink>
        <Text> - </Text>
        <TextLink href="/timeline-view-home">
          Feed
        </TextLink>
        <Text> - </Text>
        <TextLink href="/About">
          About
        </TextLink>
      </Row>

    </View>
    </View>
  )
}
