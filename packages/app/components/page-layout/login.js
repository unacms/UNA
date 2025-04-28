import { View, ScrollView } from 'app/design/view'
import { BlockByName } from 'app/components/block'
import { Text } from 'app/design/typography'
import Card from 'app/components/card'
import { Button } from 'app/design/controls'
import Link from 'app/ui/atoms/link'
import { Platform } from 'react-native'
import { appStatic } from 'app/lib/app-static'
import KbAvoidingView from 'app/ui/atoms/kb-avoiding-view';

export default function PageLayout(props) {
    return (
        <KbAvoidingView style={{ flex: 1 }}>
            <View style={{ flex: 1 }} className={Platform.OS === 'web' ? 'w-full p-4 mx-auto max-w-4xl flex-col items-center lg:flex-row gap-x-4 gap-y-4  ' : 'flex-col items-center p-4'}>
               
                    
                    {appStatic('components_logincontent')}
                

                
                    
                        <Card
                            rounded=" rounded-[24px] "
                            addClassName=" p-4 w-full max-w-md mx-auto flex-auto "
                        >
                                 <BlockByName name={props.blocks.form} data={props.data} />
                                    <Link
                                    className=" w-full my-4 "
                                    href="/forgot-password"
                                >
                                    <Button
                                        title="Forgot password?"
                                        variant="link"
                                        fullWidth
                                        size="sm"
                                    />
                                </Link>
                                <View className="flex items-center justify-center pt-4 border-t border-bdr dark:border-bdr-d  ">
                            
                            <Link className=" w-full " href="/create-account">
                                <Button
                                    title="Create new account"
                                    startDecorator="UserPlus"
                                    size="base"
                                    fullWidth
                                />
                            </Link></View>
                        </Card>
                        

                    
              
            </View>
        </KbAvoidingView >
    )
}
