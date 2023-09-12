import { useContext } from 'react'
import CardDataContext from 'app/context/card'
import { CardData } from 'app/context/card'
import Image from '../../ui/atoms/image'
import Link from '../../ui/atoms/link'
import Profile from '../../ui/molecules/profile'
import { getImageSizes } from 'app/lib/util'
import { Text } from 'app/design/typography'
import { View } from 'app/design/view'
import Menu from 'app/components/menu'
import Card from 'app/components/card'

export default function Unit(props) {
  let data = props.data

  const imageSizes = getImageSizes()
  const module = !!data?.module ? data.module : props.module

  switch (module) {
    case 'bx_groups':
    case 'bx_events':
    case 'bx_channels':
      return groupUnit()

    case 'bx_persons':
      return (
        <CardDataContext>
          <UnitPerson {...props} />
        </CardDataContext>
      )

    default:
      return defaultUnit()
  }

  function groupUnit() {
    let sMeta = <></>
    if (data?.meta)
      sMeta = (
        <View className="pb-2">
          <Menu
            {...data.meta}
            displayType="mixed"
            params={{ showVertical: true }}
          />
        </View>
      )

    return (
      <Card margin=" mb-2  sm:mx-2 mx-4 " rounded=" rounded-2xl ">
        <View className="flex-col pb-4 h-full ">
          <Link href={data.url}>
            <View className="w-full  aspect-video bg-primary/50">
              {data.cover && (
                <>
                  <Image
                    {...data.cover}
                    alt={data.title}
                    view="cover"
                    className="absolute u-cover"
                    sizes={imageSizes}
                  />
                </>
              )}
            </View>
            <View className=" sm:h-20 pt-3 px-4 ">
              <Text
                numberOfLines={2}
                className="text-center text-base font-bold text-neutral-800 dark:text-neutral-200 "
              >
                {data.title}
              </Text>
            </View>
          </Link>

          {data?.meta && (
            <View className="px-4 mt-auto ">
              <Menu
                {...data.meta}
                displayType="mixed"
                params={{
                  showVertical: true,
                  button_size: 'sm',
                  button_full_width: true,
                  button_rounded: false,
                }}
              />
            </View>
          )}
        </View>
      </Card>
    )
  }

  function defaultUnit() {
    let sMeta = (
      <Profile
        {...data.author_data}
        displayType="unit"
        displaySize="sm"
        showInfo="false"
      />
    )

    return (
        <Card margin="mb-2 mx-2" rounded="rounded-2xl">
        <View className="flex-col">
          <View className="flex-col w-full">
            <Link href={data.url}>
              <View className={data.image ? "flex-row-reverse sm:flex-col w-full p-1" : "flex-col w-full p-1"}>
                {data.image ? (
                  <View className="aspect-video rounded-xl overflow-hidden w-2/5 sm:w-full">
                    <Image {...data.image} alt={data.title} view="cover" className="u-cover" sizes={imageSizes} />
                  </View>
                ) : (
                  <View className={`sm:aspect-video ${!data.image && "sm:bg-gradient-to-b from-bgritem to-bgrcard dark:from-bgritem-d dark:to-transparent justify-end"} rounded-xl overflow-hidden w-2/5 w-full gap-y-2 pt-3 px-3`}>
                    <Text numberOfLines={5} className="text-neutral-950 tracking-tight dark:text-neutral-50 sm:hover:text-primary sm:dark:hover:text-primary-d leading-5 text-base font-bold">
                      {data.title}
                    </Text>
                  </View>
                )}
                <View className="flex-auto flex-col mb-auto">
                  <View className={`flex-auto flex-col ${data.image ? 'h-32' : 'sm:h-32'} gap-y-2 p-3`}>
                    {data.image && (
                      <Text numberOfLines={2} className="text-neutral-950 tracking-tight dark:text-neutral-50 sm:hover:text-primary sm:dark:hover:text-primary-d leading-5 text-base font-bold">
                        {data.title}
                      </Text>
                    )}
                    <Text numberOfLines={data.image ? 3 : 6} className="text-neutral-700 dark:text-neutral-300 mb-auto text-sm">
                      {data.summary_plain}
                    </Text>
                  </View>
                </View>
              </View>
            </Link>
            <View className= " mb-auto px-4 pb-3 sm:pt-0" >
              {sMeta}
            </View>
          </View>
        </View>
      </Card>
      


      
    )
  }
}

export function UnitPerson(props) {
  let data = props.data

  const { cardData, setCardData } = useContext(CardData)

  if (!!cardData?.hidden) return

  const imageSizes = getImageSizes()
  return (
    <Card margin="mx-2 mb-2 p-1" rounded="rounded-2xl">
    <Link className="text-center" href={data.url}>
      <View className="flex-col text-center">
        <View className="w-full p-4 relative">
          {data.cover && (
            <Image
              {...data.cover}
              alt={data.title}
              view="cover"
              className="rounded-xl absolute u-cover"
            />
          )}
          <View className="w-full justify-center sm:aspect-video">
            <View className="mx-auto w-min bg-white p-1 dark:bg-bgrcard-d rounded-full">
              <Profile
                url_avatar={data?.image?.src}
                displayType="unit_wo_info"
                displaySize="3xl"
              />
            </View>
          </View>
        </View>
        <Text numberOfLines={1} className="text-center p-3 w-full text-lg sm:text-base font-bold text-neutral-800 dark:text-neutral-100">
          {data.title}
        </Text>
      </View>
    </Link>
    {data?.meta && (
      <View className="p-3 items-center">
        <Menu
          {...data.meta}
          displayType="mixed"
          params={{
            showVertical: true,
            button_size: 'base',
            button_full_width: true,
            button_rounded: false,
          }}
        />
      </View>
    )}
  </Card>
  
  )
}
