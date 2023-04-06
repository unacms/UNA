import { A, Text } from 'app/design/typography'
import { View } from 'app/design/view'
import Image from '../atoms/image'
import Link from '../atoms/link'


/**
 * displayType: 
 *  1. unit, 
 *  2. unit_wo_image (unit without image = username + meta info), 
 *  4. unit_wo_info (unit without info = image only)
 *  
 * displaySize: xs, sm, base, lg, xl, 2xl,3xl
 * 
 * showLinks: true, false
 * show Unit with or without a link to profile.
 * 
 * showInfo: true, false
 * show Unit with or without a meta info.
 * 
 */
export default function AtomProfile(oProps) {
  let sResult = ''
  //--- display type
  const sDisplayType = oProps.displayType
    ? oProps.displayType
    : oProps.display_type

  //--- the profile image size
  const sDisplaySize = oProps.displaySize ? oProps.displaySize : 'base'

  let sSize = ''
  let iSizeWidth = 0,
    iSizeHeight = 0
  switch (sDisplaySize) {
    case 'xs':
      sSize = 'w-6 h-6'
      iSizeWidth = 24
      iSizeHeight = 24
      break

    case 'sm':
      sSize = 'w-8 h-8'
      iSizeWidth = 32
      iSizeHeight = 32
      break

    case 'base':
      sSize = 'w-10 h-10'
      iSizeWidth = 40
      iSizeHeight = 40
      break

    case 'lg':
      sSize = 'w-12 h-12'
      iSizeWidth = 48
      iSizeHeight = 48
      break

    case 'xl':
      sSize = 'w-16 h-16'
      iSizeWidth = 64
      iSizeHeight = 64
      break

    case '2xl':
      sSize = 'w-24 h-24'
      iSizeWidth = 96
      iSizeHeight = 96
      break

    case '3xl':
      sSize = 'w-32 h-32'
      iSizeWidth = 128
      iSizeHeight = 128
      break
  }
  sSize += ' rounded-full '

  //--- with clickable Username (or not)
  const bShowLinks = !oProps.showLinks || oProps.showLinks === 'true'

  function DisplayNameLink(oProps) {
    return (
      <Text className="text-neogray-700 hover:text-neogray-900 dark:text-neogray-200 dark:hover:text-neogray-50 text-sm font-bold truncate hover:underline">
        {oProps.title}
      </Text>
    )
  }

  function DisplayNameText(oProps) {
    return (
      <Text className="text-neogray-700 hover:text-neogray-900 dark:text-neogray-200 dark:hover:text-neogray-50 text-sm font-bold tracking-tight truncate hover:underline">
        {oProps.title}
      </Text>
    )
  }

  //--- with custom or default info section
  function DisplayInfo(oProps) {
    return (
      <View className="flex-row ">
        <Text className="mr-2 text-neogray-600 dark:text-neogray-400 text-sm  tracking-tight">
          AU
        </Text>
        <Text className="text-neogray-600 dark:text-neogray-400 text-sm  tracking-tight">
          Dermatology
        </Text>
      </View>
    )
  }

  let sShowInfo = undefined;
  if (oProps.showInfo != undefined)
    sShowInfo = oProps.showInfo !== 'false' ? oProps.showInfo : undefined;
  else 
    sShowInfo = <DisplayInfo {...oProps} />

  switch (sDisplayType) {
    case 'unit':
      sResult = (
        <Link haptics="Select" href={oProps.url}>
          <View className="flex-row items-center w-full web:space-x-2">
            <View className="flex-none ios:pr-2 android:pr-2">
              <AtomProfile {...oProps} displayType="unit_wo_info" />
            </View>
            <View className="flex-auto">
              <AtomProfile {...oProps} displayType="unit_wo_image" />
            </View>
          </View>
        </Link>
      )
      break     

    case 'unit_wo_info':
      sResult = (
        <Link haptics="Select" href={oProps.url}>
          <View className="relative flex-row">
          <View className={sSize +"aspect-square overflow-hidden bg-neogray-100 dark:bg-neogray-700 mx-auto rounded-full"}>
          <View className="w-[50%] z-20 aspect-square bg-neogray-200  dark:bg-neogray-600 border-2 border-neogray-100 dark:border-neogray-700  mx-auto rounded-full mt-[15%] "></View>
          <View className="w-[80%] -translate-y-[5%] aspect-square  bg-neogray-200  dark:bg-neogray-600  mx-auto rounded-t-full  "></View>
          { oProps.url_avatar && <Image
              className={sSize+" absolute top-0 z-50"}
              width={iSizeWidth}
              height={iSizeHeight}
              src={oProps.url_avatar}
              alt={oProps.display_name}
            />
          }
          </View>
          </View>
        </Link>
      )
      break

    case 'unit_wo_image':
      sResult = (
        <Link haptics="Select" href={oProps.url}>
          <View className="flex-col my-auto">
            {bShowLinks ? (
              <DisplayNameLink
                title={oProps.display_name}
                url={oProps.url}
              />
            ) : (
              <DisplayNameText title={oProps.display_name} />
            )}
            <View className="flex text-neogray-600 dark:text-neogray-400 text-sm">{sShowInfo}</View>
          </View>
        </Link>
      )
      break

    case 'text':
        sResult = (
          <Link haptics="Select" href={oProps.url}>
            <View className="flex-col my-auto">
              {bShowLinks ? (
                <DisplayNameLink
                  title={oProps.display_name}
                  url={oProps.url}
                />
              ) : (
                <DisplayNameText title={oProps.display_name} />
              )}
            </View>
          </Link>
        )
        break

    default:
      sResult = (
        <Link haptics="Select" href={oProps.url}>
          <View className="relative flex-row">
            <View className={sSize}>
              <Text>Undefined</Text>
            </View>
          </View>
        </Link>
      )
  }
  return sResult
}
