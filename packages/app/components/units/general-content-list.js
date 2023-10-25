import { useState, useContext, useRef } from 'react'
import CardDataContext from 'app/context/card'
import { CardData } from 'app/context/card'
import Image from '../../ui/atoms/image'
import Link from '../../ui/atoms/link'
import Profile from '../../ui/molecules/profile'
import { getImageSizes, FeedbackHaptics, tp, t } from 'app/lib/util'
import { Text } from 'app/design/typography'
import { View, Row } from 'app/design/view'
import Menu from 'app/components/menu'
import Card from 'app/ui/molecules/card'
import Time from '../../ui/atoms/time'
import { Button, Modal } from 'app/design/controls'
import Redirect from 'app/ui/atoms/redirect'
import { componentsMap } from 'app/ui/molecules/_map'
import { useTranslation } from 'react-i18next'
import ProfilesList from 'app/ui/molecules/profile_list'
import { Icon } from 'app/ui/atoms/icon'

export default function Unit(props) {
  const { t } = useTranslation()

  function channelUnit() {
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
      <Card margin=" mb-2 sm:mx-2 " rounded=" rounded-2xl ">
        <View className="flex-col gap-y-4 ">
          <Link className="" href={data.url}>
            <View className="flex-col w-full ">
              <View className=" w-full p-1 aspect-video ">
                <View className="w-full aspect-square mb-auto bg-bgritem dark:bg-bgritem-d aspect-video overflow-hidden rounded-xl">
                  <Image
                    {...data.cover}
                    alt={data.title}
                    view="cover"
                    className="absolute u-cover"
                    sizes={imageSizes}
                  />
                </View>
              </View>
              <View className="flex-col flex-auto gap-y-2 p-4  ">
                <View className=" flex-row flex-wrap gap-x-2 gap-y-2   ">
                  {data?.date_start && (
                    <Text className=" bg-bgritem dark:bg-bgritem-d rounded-lg  px-2 py-1 flex-none flex-auto text-neutral-600 dark:text-neutral-400">
                      {data.date_start && (
                        <>
                          <Time
                            stylesName="text-sm flex-none"
                            ts={data.date_start}
                          ></Time>
                          {data.date_end && (
                            <>
                              <Text className="text-sm flex-none"> - </Text>
                              <Time
                                stylesName="text-sm flex-none"
                                ts={data.date_end}
                              ></Time>
                            </>
                          )}
                        </>
                      )}
                    </Text>
                  )}
                  <Text className="my-auto text-sm flex-auto font-semibold text-neutral-600 dark:text-neutral-400">
                    {data.visibility != '3' ? <>Private</> : <>Public</>}
                  </Text>
                </View>
                <View className=" sm:h-12  ">
                  <Text
                    numberOfLines={2}
                    className=" tracking-tight leading-tight text-base font-bold text-neutral-800 dark:text-neutral-200 group-hover:text-primary group-hover:dark:text-primary-d "
                  >
                    {data.title}
                  </Text>
                </View>
                <Text className=" flex-none text-neutral-600 dark:text-neutral-400">
                  {tp('members', data.members_count)}
                </Text>
                <View className="flex-row w-full gap-x-2 ">
                  <Button
                    variant="primary"
                    size="sm"
                    title="Join"
                    className=" my-auto "
                    fullWidth={true}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className=" my-auto "
                    startDecorator="DotsThreeOutline"
                  />
                </View>
              </View>
            </View>
          </Link>
          {data?.meta && (
            <View className="px-4 pb-4 mt-auto ">
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
        </View>
      </Card>
    )
  }

  function eventUnit() {
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
      const sPrimary = 'join'
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
        className=" tracking-tight leading-tight text-base font-bold text-neutral-800 dark:text-neutral-200 group-hover:text-primary group-hover:dark:text-primary-d "
      >
        {data.title}
      </Text>
    )

    return (
      <>
        <Redirect ref={redirectdRef} />
        <Card margin=" mb-2 sm:mx-2 " rounded=" rounded-2xl ">
          <View className="flex-col gap-y-4 ">
            <Link className="" href={data.url}>
              <View className="flex-col w-full ">
                <View className=" w-full p-1">{sCover}</View>
                <View className="flex-col flex-auto gap-y-2 p-4  ">
                  <View className=" flex-row flex-wrap gap-x-2 gap-y-2   ">
                    {data?.date_start && (
                      <Text className=" bg-bgritem dark:bg-bgritem-d rounded-lg  px-2 py-1 flex-none flex-auto text-neutral-600 dark:text-neutral-400">
                        {data.date_start && (
                          <>
                            <Time
                              stylesName="text-sm flex-none"
                              ts={data.date_start}
                            ></Time>
                            {data.date_end && (
                              <>
                                <Text className="text-sm flex-none"> - </Text>
                                <Time
                                  stylesName="text-sm flex-none"
                                  ts={data.date_end}
                                ></Time>
                              </>
                            )}
                          </>
                        )}
                      </Text>
                    )}
                    <Text className="my-auto text-sm flex-auto font-semibold text-neutral-600 dark:text-neutral-400">
                      {data.visibility != '3' ? <>Private</> : <>Public</>}
                    </Text>
                  </View>
                  <View className="sm:h-12">{sTitle}</View>
                  <Row className="items-center ">
                    <View className="mr-2">
                      <ProfilesList
                        data={data.members_list}
                        showEmpty={false}
                        maxCount={3}
                        displaySize="sm"
                      />
                    </View>
                    <Text className=" flex-none text-neutral-600 dark:text-neutral-400">
                      {tp('members', data.members_count)}
                    </Text>
                  </Row>
                  <View className="flex-row w-full gap-x-2 ">
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

  function defaultUnit() {
    let sMeta = (
      <Profile
        {...data.author_data}
        displayType="unit"
        displaySize="xs"
        showInfo="false"
      />
    )

    return (
      <>
        <Card
          addClassName="  "
          margin="m-1 sm:m-2 sm:mt-0"
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
                  <View className="flex-auto flex-col sm:h-24 mb-auto">
                    <View
                      className={`flex-auto flex-col ${
                        data.image ? '  ' : ' '
                      } gap-y-2 sm:p-2`}
                    >
                      {true && (
                        <Text
                          numberOfLines={2}
                          className="text-neutral-950 tracking-tight dark:text-neutral-50 sm:hover:text-primary sm:dark:hover:text-primary-d leading-tight text-base font-bold"
                        >
                          {data.title}
                        </Text>
                      )}
                      <Text
                        numberOfLines={true ? 2 : 6}
                        className="text-neutral-700 dark:text-neutral-300 mb-auto text-xs"
                      >
                        {data.summary_plain}
                      </Text>
                    </View>
                  </View>
                </View>
              </Link>
              <View className="border-t border-bdr/50 mx-2.5 dark:border-bdr-d/50 mt-auto  pt-2 pb-2.5 ">
                {sMeta}
              </View>
            </View>
          </View>
        </Card>
      </>
    )
  }

  function forumUnitPreview() {
    let sMeta = (
      <Profile
        {...data.author_data}
        displayType="unit"
        displaySize="xs"
        showInfo="false"
      />
    )

    return (
      <>
        <Card margin="mb-2 mx-4" rounded="rounded-2xl">
          
            <View className="flex-row p-1.5 gap-x-1 ">
                <View className="relative flex-none h-14 w-14 bg-bgritem dark:bg-bgritem-d rounded-xl overflow-hidden">
                  <View className="absolute h-14 w-14   flex-row  text-neutral-500/20 ">
                    <Icon icon="ChatCircle" className="mx-auto my-auto w-1/2 h-1/2"  />
                  </View>
                  {data.image && (
                    <View
                        className={
                        (!data.image ? ' hidden sm:block ' : '') +
                        ' aspect-square flex-none   overflow-hidden w-full '
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
                    )}
                </View>
               
                

                
                    <Link className=" my-auto pb-0.5 px-2  flex-auto" href={data.url}>
                    
                        <Text
                        numberOfLines={3}
                        className="text-neutral-950 tracking-tight dark:text-neutral-50 sm:hover:text-primary leading-tight sm:dark:hover:text-primary-d  text-sm font-bold"
                        >
                        {data.title}
                        </Text>
   
                    
                    </Link>
                
                


                
                
            </View>
            
          
        </Card>
        

      </>
    )
  }

  function forumUnit() {
    let sMeta = (
      <Profile
        {...data.author_data}
        displayType="unit"
        displaySize="xs"
        showInfo="false"
      />
    )

    return (
      <>
        
          <View className="flex-col px-0 sm:px-4 xl:px-6 mx-auto w-full max-w-5xl">
            <View className="flex-row px-4 sm:px-0 gap-x-3 mb-4 pb-4 flex-auto  border-b border-bdr dark:border-bdr-d">
                <View className="relative flex-none hidden sm:flex h-14 w-14 text-neutral-500/20 bg-bgritem dark:bg-bgritem-d rounded-xl overflow-hidden">
                  
                    <Icon icon="ChatCircle" className="mx-auto my-auto w-1/2 h-1/2"  />
                  
                  
                </View>
                <View className="flex-col gap-y-2 flex-auto">
                

                
                    <Link href={data.url}>
                    <View className={`flex-auto flex-col gap-y-1`}>
                        <Text
                        numberOfLines={2}
                        className="text-neutral-950 tracking-tight dark:text-neutral-50 sm:hover:text-primary sm:dark:hover:text-primary-d leading-5 text-base font-bold"
                        >
                        {data.title}
                        </Text>
                        <Text
                        numberOfLines={2}
                        className="text-neutral-700 dark:text-neutral-300 mb-auto text-sm"
                        >
                        {data.summary_plain}
                        </Text>
                    </View>
                    </Link>
                
                <View className="flex-row gap-x-4">
                    {sMeta}
                    
                    <Text className="bg-neutral-500/20 px-2 py-0.5 my-auto text-xs rounded-full text-neutral-700 dark:text-neutral-300">{data.category}</Text>
                    
                </View>


                </View>
                {data.image && (
                <View
                    className={
                    (!data.image ? ' hidden sm:block ' : '') +
                    ' aspect-video flex-none rounded-lg sm:rounded-xl overflow-hidden w-1/4 sm:w-auto sm:h-24 '
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
                )}
            </View>
            
          </View>
        
      </>
    )
  }

  function marketUnit() {
    let sMeta = (
      <Profile
        {...data.author_data}
        displayType="unit"
        displaySize="sm"
        showInfo="false"
      />
    )
    let cover_raw = data.cover_raw.replace(
      /\\u([\d\w]{4})/gi,
      function (match, grp) {
        return String.fromCharCode(parseInt(grp, 16))
      }
    )
    return (
      <>
        <Card margin="mb-2 mx-2" rounded="rounded-2xl">
          <View className="flex-col gap-y-4">
            <View className="flex-col w-full">
              <Link href={data.url}>
                <View className="w-full p-1">
                  <View className="w-full mb-auto bg-bgritem dark:bg-bgritem-d aspect-video overflow-hidden rounded-xl">
                    {cover_raw.trim() != '' && (
                      <div
                        dangerouslySetInnerHTML={{ __html: cover_raw }}
                      ></div>
                    )}
                    {cover_raw.trim() == '' && (
                      <Image
                        {...data.cover}
                        alt={data.title}
                        view="cover"
                        className="u-cover"
                        sizes={imageSizes}
                      />
                    )}
                  </View>
                  <View className="flex-auto flex-col px-2 py-3 gap-y-2 h-32 ">
                    <Row className="justify-between">
                      <View className="flex-col gap-y-3">
                        <Text className="mr-auto bg-primary-100 dark:bg-primary-900 rounded-lg font-semibold px-2 py-1 flex-none flex-auto text-neutral-800 dark:text-neutral-200">
                          {data.price_recurring > 0
                            ? data.price_recurring +
                              '$/' +
                              data.duration_recurring
                            : data.price_single > 0
                            ? data.price_single + '$'
                            : 'Free'}
                        </Text>
                        <Text
                          numberOfLines={2}
                          className="text-neutral-950 tracking-tight dark:text-neutral-50 sm:hover:text-primary sm:dark:hover:text-primary-d leading-5 text-base font-bold"
                        >
                          {data.title}
                        </Text>
                      </View>
                      {data.image && (
                        <View className="h-14 w-14 aspect-square overflow-hidden border border-bdr dark:border-bdr-d rounded-lg">
                          <Image
                            {...data.image}
                            alt={data.title}
                            view="cover"
                            nobg={true}
                            sizes={imageSizes}
                          />
                        </View>
                      )}
                    </Row>

                    <Text
                      numberOfLines={1}
                      className="text-neutral-700 dark:text-neutral-300 mb-auto text-sm"
                    >
                      {data.summary_plain}
                    </Text>
                  </View>
                </View>
              </Link>
              <View className=" mb-auto px-4 pb-3 sm:pt-0">{sMeta}</View>
            </View>
          </View>
        </Card>
      </>
    )
  }

  function UnitPerson(props) {
    const redirectdRef = useRef()
    const [popupVisible, setPopupVisible] = useState(false)

    let data = props.data
    const { cardData, setCardData } = useContext(CardData)
    if (!!cardData?.hidden) return
    const imageSizes = getImageSizes()

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
      let sPrimary = '',
        sSecondary = '',
        sExclude = ''

      switch (props.unitType) {
        case 'person_friends':
          oMenuItemPrimary = {
            title: t('Message'),
            icon: 'ChatTeardropDots',
            onPress: (event) => {
              handleClick(event, '/messenger')
            },
          }
          break

        case 'person_friends_recommendations':
          sPrimary = 'befriend'
          break

        case 'browse_friend_requests':
          sPrimary = 'befriend'
          break

        case 'person_friend_requested':
          sPrimary = 'unfriend'
          break

        case 'person_following_recommendations':
          sPrimary = 'subscribe'
          break

        case 'person_followers':
          sPrimary = 'subscribe'
          sSecondary = 'unsubscribe'
          break

        case 'person_following':
          sPrimary = 'unsubscribe'
          break

        default:
          oMenuItemPrimary = {
            title: 'View',
            onPress: (event) => {
              handleClick(event, data.url)
            },
          }
      }

      if (!oMenuItemPrimary) {
        sExclude = sPrimary
        oMenuItemPrimary = data.meta.items
          .filter((aItem) => aItem.name == sPrimary)
          .shift()
        if (!oMenuItemPrimary) {
          sExclude = sSecondary
          oMenuItemPrimary = data.meta.items
            .filter((aItem) => aItem.name == sSecondary)
            .shift()
        }
      }

      if (!!oMenuItemPrimary) {
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
      }

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

    return (
      <>
        <Redirect ref={redirectdRef} />
        <Card margin="sm:mx-2 mb-2 " rounded="rounded-2xl">
          <Link className="group " href={data.url}>
            <View className="flex-row sm:flex-col p-1">
              <View className="aspect-square w-1/3 sm:w-full rounded-xl ">
                <Image
                  src={data?.image?.src}
                  alt={data.title}
                  view="cover"
                  className="absolute u-cover rounded-xl"
                  sizes={imageSizes}
                />
              </View>
              <View className="flex-col p-3 gap-y-3 flex-auto ">
                <Text
                  numberOfLines={1}
                  className=" text-lg leading-tight tracking-tight font-bold text-neutral-800 dark:text-neutral-200 group-hover:text-primary group-hover:dark:text-primary-d"
                >
                  {data.title}
                </Text>
                <Row className="items-center">
                  {props.unitType == 'person_followers' ||
                  props.unitType == 'person_following' ||
                  props.unitType == 'person_following_recommendations' ? (
                    <>
                      <View className="mr-2">
                        <ProfilesList
                          data={data.followers_list}
                          showEmpty={false}
                          maxCount={3}
                          displaySize="xs"
                        />
                      </View>
                      <Text className="truncate text-xs leading-tight flex-auto text-neutral-600 dark:text-neutral-400">
                        {data?.followers_count + ' followers'}
                      </Text>
                    </>
                  ) : (
                    <>
                      <View className="mr-2">
                        {data.mutual_friends_count > 0 ? (
                          <ProfilesList
                            data={data.mutual_friends_list}
                            showEmpty={false}
                            maxCount={3}
                            displaySize="xs"
                          />
                        ) : (
                          <ProfilesList
                            data={data.friends_list}
                            showEmpty={false}
                            maxCount={3}
                            displaySize="xs"
                          />
                        )}
                      </View>
                      <Text className="truncate text-xs leading-tight flex-auto text-neutral-600 dark:text-neutral-400">
                        {data.mutual_friends_count > 0
                          ? tp(
                              'mutual_friends',
                              data?.mutual_friends_count,
                              false
                            )
                          : tp('friends', data?.friends_count, false)}
                      </Text>
                    </>
                  )}
                </Row>
                <View className="flex-row w-full gap-x-2 ">
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
                            <Profile
                              display_type="unit"
                              display_name={data.title}
                              url={data.url}
                              url_avatar={data?.image?.src}
                              showInfo={false}
                            />
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
        </Card>
      </>
    )
  }

  let data = props.data
  const imageSizes = getImageSizes()
  const module = !!data?.module ? data.module : props.module

  switch (module) {
    case 'bx_groups':
    case 'bx_events':
      return eventUnit()
    case 'bx_channels':
      return channelUnit()
    case 'bx_market':
      return marketUnit()
    case 'bx_forum':
      return props.sidebar? forumUnitPreview() : forumUnit()
    case 'bx_persons':
      return (
        <CardDataContext>
          <UnitPerson {...props} />
        </CardDataContext>
      )

    default:
      return defaultUnit()
  }
}

/*
 * TODO "Friends" card - Add "mutual friends" count, remove "remove friend" and UNfollow. Add "MORE" button (icon only) that shows all actions
 * TODO "Friend Suggestions" card - Add "mutual friends" count, change "remove friend" and UNfollow to single "MORE" button (icon only) that shows all actions
 * TODO "Friends" card - Add "mutual friends" count, change "remove friend" and UNfollow to single "MORE" button (icon only) that shows all actions
 */
