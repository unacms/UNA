import { A, H1, P, Text, TextLink } from 'app/design/typography'
import { Row } from 'app/design/layout'
import { View } from 'app/design/view'

const Box = function ({ className, ...props })  {
  return <Text className={`flex flex-1 text-center h-14 basis-24 justify-center items-center text-white bg-fuchsia-500 rounded ${className}`} {...props}/>
}


export function HomeScreen() {
  return (
    <View className="flex flex-row flex-wrap h-screen w-screen content-center items-center gap-y-1 overflow-hidden">
      <Box>01</Box>
      <Box>02</Box>
      <Box>03</Box>
      <Box>04</Box>
      <Box>05</Box>
      <Box>06</Box>
    </View>
  );
  return (
    <View className="px-2 py-5 grid place-items-center">
    <View className="max-w-md">
      <H1 className="">Welcome to G-Med app.</H1>
      <View>
        <P>
          UNA Universal App - for gMed
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
        <Text> - </Text>
        <TextLink href="/posts-home">
          Posts
        </TextLink>
        <Text> - </Text>
        <TextLink href="/timeline-view-home">
          Feed
        </TextLink>
      </Row>

    </View>
    </View>
  )
}
