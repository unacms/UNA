import { A, H1, P, Text, TextLink } from 'app/design/typography'
import { Row } from 'app/design/layout'
import { View } from 'app/design/view'

export function HomeScreen() {

  return (
    <View className="px-2 py-5 grid place-items-center">
    <View className="max-w-md">
      <H1 className="">Welcome to G-Med app.</H1>
      <View>
        <P>
          Here is a basic starter. This screen uses the same code on Next.js and React
          Native.
        </P>
        <P>
          Solito is made by{' '}
          <A className="underline text-blue-600 hover:text-red-500 visited:text-purple-600"
            href="https://twitter.com/fernandotherojo"
            // @ts-expect-error react-native-web only types
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
        <Text> | </Text>
        <TextLink href="/posts-home">
          Posts
        </TextLink>
      </Row>

    </View>
    </View>
  )
}
