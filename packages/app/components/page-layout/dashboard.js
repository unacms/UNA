import { View } from 'app/design/view'
import { Text } from 'app/design/typography'
import { Button } from 'app/design/controls'
import Link from 'app/ui/atoms/link'

import { useCurrentUser } from 'app/context/user'
import Profile from 'app/ui/molecules/profile'
import { BlockByName } from 'app/components/block'
import { useState } from 'react';
import { Modal } from 'app/design/controls'
import Card from 'app/ui/molecules/card'
import { appSetting } from 'app/lib/util'

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
  console.log('showImage', showImage)
  return (
    <>
    <Modal id='file-preview' title="Your Profiles" onVisible={!!showImage} onClose={() => {setShowImage(null)}}>
      <BlockByName name={props.blocks.profile_switcher} data={props.data} hideTitle={true} />
    </Modal>
    
    <View className="w-full p-2 max-w-screen-2xl mx-auto flex-col  ">
       <View className=" w-full p-2">
          <Card rounded=" rounded-2xl " addClassName="w-full p-4 flex-row ">
            <View className="justify-between flex-auto gap-x-2 flex-row my-auto">
              <View className="flex-row gap-x-2 my-auto  items-center">
              {profile}
              <Link href={currentUser.url}>
              <Text className="my-auto text-neutral-800 hover:text-neutral-950 dark:text-neutral-200 hover:dark:text-neutral-50 text-lg font-semibold ">
                {currentUser.display_name}
              </Text>
              </Link>
              </View>
              <View className="flex-row gap-x-2 my-auto  lg:hidden">
                {appSetting('layout', 'allow_switch_profile') && <Button variant="outline" startDecorator="UserSwitch" rounded onPress = {() => setShowImage(true)} />}
                <Link href="/account-settings-password"><Button variant="outline" startDecorator="Gear" rounded /></Link>
                <Link href="/logout"><Button variant="outline" startDecorator="SignOut" rounded /></Link>
              </View>
              <View className="flex-row gap-x-2 hidden lg:flex">
                {appSetting('layout', 'allow_switch_profile') && <Button
                  variant="text"
                  title="Switch Profile"
                  startDecorator="UserSwitch"
                  fullWidth
                  onPress = {() => setShowImage(true)}
                  align="left"
                />}
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
      <View  className=" w-full ">
      <BlockByName name={props.blocks.stat_block} data={props.data} hideTitle={true} />
      </View>
      
      
    </View>
    </>
  )
}
