import { useState, useRef } from 'react'
import Image from 'app/ui/atoms/image'
import Link from 'app/ui/atoms/link'
import { getImageSizes, FeedbackHaptics, tp } from 'app/lib/util'
import { Text } from 'app/design/typography'
import { View, Row } from 'app/design/view'
import Menu from 'app/components/menu'
import Card from 'app/ui/molecules/card'
import Time from 'app/ui/atoms/time'
import { Button, Modal } from 'app/design/controls'
import Redirect from 'app/ui/atoms/redirect'
import { componentsMap } from 'app/ui/molecules/_map'
import ProfilesList from 'app/ui/molecules/profile_list'

export default function Unit(props) {
  const data = props.data;
  const imageSizes = getImageSizes()
  const redirectdRef = useRef()
  const [popupVisible, setPopupVisible] = useState(false)

  const handleClick = (event, sUrl) => {
    event.preventDefault()

    redirectdRef.current.redirect(sUrl)
  }

  const handleClickMore = (event) => {
    event.preventDefault()

    FeedbackHaptics('Medium')
    setPopupVisible(true)
  }

  let oMenuItemPrimary = undefined
  let oMenuItemsMore = undefined
  if (data?.meta) {
    //--- Primary button
    let sPrimary = 'join'
    if (props.module == 'bx_channels')
      sPrimary = 'subscribe';
    oMenuItemPrimary = data.meta.items
      .filter((aItem) => aItem.name == sPrimary)
      .shift()
    if (!oMenuItemPrimary) {
      oMenuItemPrimary = {
        title: 'View',
        onPress: (event) => {
          handleClick(event, data.url)
        },
      }
    }

    if (oMenuItemPrimary?.data && oMenuItemPrimary.data?.type) {
      const Element = componentsMap[oMenuItemPrimary.data.type]
      if (!!Element) {
        const oElementParams = {
          ...oMenuItemPrimary.data,
          ...{
            primary: true,
            params: {
              button_rounded: false,
              button_full_width: true,
              on_done: (sAction, oData) => {
                //--- Do something after the primary action was performed.
              },
            },
          },
        }

        oMenuItemPrimary = (
          <Element
            key={
              oMenuItemPrimary.id
                ? oMenuItemPrimary.id
                : oMenuItemPrimary.name
            }
            {...oElementParams}
          />
        )
      }
    } else
      oMenuItemPrimary = (
        <Button
          variant="primary"
          size="sm"
          title={oMenuItemPrimary.title}
          className=" my-auto "
          startDecorator={
            oMenuItemPrimary?.icon ? oMenuItemPrimary.icon : false
          }
          fullWidth={true}
          onPress={oMenuItemPrimary?.onPress}
        />
      )

    //--- More menu
    oMenuItemsMore = {
      ...data.meta,
      ...{
        items: data.meta.items.filter((aItem) => aItem.name != sPrimary),
        params: {
          showVertical: true,
          button_size: 'base',
          button_full_width: true,
          button_rounded: false,
          on_do: (sAction) => {
            setPopupVisible(false)
          },
        },
      },
    }
  }

  const sCover = (
    <View className="w-full mb-auto bg-bgritem dark:bg-bgritem-d aspect-video overflow-hidden rounded-xl">
      <Image
        {...data.cover}
        alt={data.title}
        view="cover"
        className="absolute u-cover"
        sizes={imageSizes}
      />
    </View>
  )

  const sTitle = (
    <Text
      numberOfLines={2}
      className=" tracking-tight leading-tight text-sm font-bold text-neutral-800 dark:text-neutral-200 group-hover:text-primary group-hover:dark:text-primary-d "
    >
      {data.title}
    </Text>
  )

  return (
    <>
      <Redirect ref={redirectdRef} />
      <Card margin=" mb-2 mx-1 sm:mx-2 " rounded=" rounded-2xl ">
        <View className="flex-col gap-y-4 ">
          <Link className="" href={data.url}>
            <View className="flex-col w-full ">
              <View className=" w-full p-1">{sCover}</View>
              <View className="flex-col flex-auto gap-y-2 px-3 py-2 ">
                <View className=" flex-row justify-between w-full  gap-x-2    ">
                  {data?.date_start && (
                    <Text className="border-l-8 border-red-500/70 bg-bgritem dark:bg-bgritem-d rounded-md px-1.5 py-0.5 flex-none flex-auto text-neutral-600 dark:text-neutral-400">
                      {data.date_start && (
                        <>
                          <Time
                            stylesName="text-xs flex-none"
                            ts={data.date_start}
                          ></Time>
                          {data.date_end && (
                            <>
                              <Text className="text-xs flex-none"> - </Text>
                              <Time
                                stylesName="text-xs flex-none"
                                ts={data.date_end}
                              ></Time>
                            </>
                          )}
                        </>
                      )}
                    </Text>
                  )}
                  <Text className=" bg-primary/10  rounded-md  px-1.5 py-1 text-xs flex-none items-center font-semibold text-neutral-600 dark:text-neutral-400">
                    {data.visibility != '3' ? <>Private</> : <>Public</>}
                  </Text>
                </View>
                <View className="sm:h-10 py-0.5 ">{sTitle}</View>
                {data.members_list && <Row className="h-6  items-center h-6">
                  <View className="mr-1 ">
                    <ProfilesList
                      data={data.members_list}
                      showEmpty={false}
                      maxCount={3}
                      displaySize="xs"
                    />
                  </View>
                  <Text className=" flex-none  text-neutral-600 dark:text-neutral-400">
                    {tp('members', data.members_count)}
                  </Text>
                </Row>}
                {(!data.members_list && data.followers_list) && <Row className="items-center sm:h-10 ">
                  <View className="mr-2">
                    <ProfilesList
                      data={data.followers_list}
                      showEmpty={false}
                      maxCount={3}
                      displaySize="sm"
                    />
                  </View>
                  <Text className=" flex-none text-neutral-600 dark:text-neutral-400">
                    {tp('followers', data.followers_count)}
                  </Text>
                </Row>}
                <View className="flex-row w-full gap-x-2 pb-1">
                  {oMenuItemPrimary}
                  {!!oMenuItemsMore && oMenuItemsMore.items.length > 0 && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className=" my-auto "
                        startDecorator="DotsThreeOutline"
                        onPress={(event) => handleClickMore(event)}
                      />
                      <Modal
                        key="more-popup"
                        onVisible={popupVisible}
                        onClose={() => {
                          setPopupVisible(false)
                        }}
                      >
                        <View className="gap-y-4">
                          <View className="flex-row items-center gap-x-4">
                            <View className="w-48">{sCover}</View>
                            <View>{sTitle}</View>
                          </View>
                          <View>
                            <Menu displayType="mixed" {...oMenuItemsMore} />
                          </View>
                        </View>
                      </Modal>
                    </>
                  )}
                </View>
              </View>
            </View>
          </Link>
        </View>
      </Card>
    </>
  )
}