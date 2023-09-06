import { View } from 'app/design/view'
import { Text } from 'app/design/typography'
import { Button } from 'app/design/controls'
import Link from 'app/ui/atoms/link'
import { Row } from 'app/design/view'
import { Icon } from 'app/ui/atoms/icon'
import { useCurrentUser } from 'app/context/user'
import Profile from 'app/ui/molecules/profile'
import { BlockByName } from 'app/components/block'
import { useState } from 'react';
import { Modal } from 'app/design/controls'
import Card from 'app/components/card'

export default function PageLayout(props) {
  let { currentUser, setCurrentUser } = useCurrentUser()
  const [showImage, setShowImage] = useState(false);

  let profile = null
  if (currentUser) {
    let dUser = Object.assign({}, currentUser)
    dUser.url_avatar = dUser.avatar
    profile = <Profile {...dUser} displayType="unit_wo_info" size="lg" />
  }

  if (!currentUser) return <></>

  return (
    <>
    <Modal id='file-preview' title="Your Profiles" onVisible={!!showImage} onClose={() => {setShowImage(null)}}>
      <BlockByName name={props.blocks.profile_switcher} data={props.data} hideTitle={true} />
    </Modal>
    
    <View className="w-full p-2 max-w-screen-2xl mx-auto flex-col xl:flex-row ">
       <View className=" w-full xl:w-1/4 p-2">
          <Card addClassName="w-full p-3 flex-row xl:flex-col">
            <View className="justify-between w-full gap-x-2 flex-row my-auto">
              <View className="flex-row gap-x-2 my-auto  items-center">
              {profile}
              <Link href={currentUser.url}>
              <Text className="my-auto text-neutral-800 hover:text-neutral-950 dark:text-neutral-200 hover:dark:text-neutral-50 text-lg font-semibold ">
                {currentUser.display_name}
              </Text>
              </Link>
              </View>
              <View className="flex-row gap-x-2 my-auto  xl:hidden">
                <Button variant="outline" startDecorator="UserSwitch" rounded onClick = {() => setShowImage(true)} />
                <Link href="/account-settings-password"><Button variant="outline" startDecorator="Gear" rounded /></Link>
                <Link href="/logout"><Button variant="outline" startDecorator="SignOut" rounded /></Link>
              </View>
            </View>
            <View className="mt-4  flex-col my-auto hidden xl:flex ">
              <View className="flex-col gap-y-0.5">
                <Button
                  variant="text"
                  title="Switch Profile"
                  startDecorator="UserSwitch"
                  fullWidth
                  onClick = {() => setShowImage(true)}
                  align="left"
                />
                <Link href="/account-settings-password">
                <Button
                  variant="text"
                  title="Account Settings"
                  startDecorator="Gear"
                  fullWidth
                  align="left"
                /></Link>
                <Link href="/logout"><Button
                  variant="text"
                  title="Sign out"
                  startDecorator="SignOut"
                  fullWidth
                  align="left"
                /></Link>
              </View>
            </View>
          </Card>
      </View>
      <View  className=" w-full xl:w-3/4">
      <BlockByName name={props.blocks.stat_block} data={props.data} hideTitle={true} />
      </View>
      
      
    </View>
    </>
  )
}
