import Image from 'app/ui/atoms/image'
import Link from 'app/ui/atoms/link'
import Profile from 'app/ui/molecules/profile'
import { getImageSizes } from 'app/lib/util'
import { Text } from 'app/design/typography'
import { View } from 'app/design/view'
import Card from 'app/ui/molecules/card'

export default function defaultUnit(props) {
  const data = props.data;
  const imageSizes = getImageSizes()
  let sMeta = (
    <Profile
      {...data.author_data}
      displayType="unit"
      displaySize="sm"
      showInfo="false"
    />
  )

  return (
    <>
      <Card
        addClassName="  "
        margin=" m-[8px] "
        rounded="rounded-2xl"
      >
        <View className="flex-col h-full">
          <View className="flex-col  h-full w-full">
            <Link href={data.url}>
              <View
                className={
                  data.image
                    ? 'flex-row-reverse sm:flex-col w-full p-3 sm:p-1 gap-x-2'
                    : 'flex-col w-full p-3  sm:p-1 '
                }
              >
                <View
                  className={
                    (!data.image ? 'hidden sm:block ' : '') +
                    ' aspect-square h-full sm:aspect-video rounded-lg sm:rounded-xl overflow-hidden w-1/4  sm:w-full'
                  }
                >
                  <Image
                    {...data.image}
                    alt={data.title}
                    view="cover"
                    className="u-cover"
                    sizes={imageSizes}
                  />
                </View>
                <View className="flex-auto flex-col sm:h-16 mb-auto">
                  <View
                    className={`flex-auto flex-col ${data.image ? '  ' : ' '
                      } gap-y-2 sm:p-3`}
                  >
                    {true && (
                      <Text
                        numberOfLines={2}
                        className="text-neutral-950 tracking-tight dark:text-neutral-50 sm:hover:text-primary sm:dark:hover:text-primary-d leading-tight text-base font-bold"
                      >
                        {data.title}
                      </Text>
                    )}
                    
                  </View>
                </View>
              </View>
            </Link>
            <View className=" mt-auto sm:px-4 sm:pb-3 ">
              {sMeta}
            </View>
          </View>
        </View>
      </Card>
    </>
  )
}