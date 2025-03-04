import { View, Row } from 'app/design/view'
import { Modal } from 'app/design/controls'
import React, { useState, useEffect, useRef, useContext } from 'react';
import { useCurrentUser } from 'app/context/user';
import { appSetting } from 'app/lib/util'
import { fetcher } from 'app/lib/fetcher';
import { Text } from 'app/design/typography'
import { Button } from 'app/design/controls'
import Profile from 'app/ui/molecules/profile';
import { Switch } from 'app/design/controls'
import { Theme } from 'app/design/theme';
//import { BleManager } from 'react-native-ble-plx';
import { useBottomSheetData } from 'app/context/bottomsheet';
import * as Location from 'expo-location'; //EXPO 52 UPDATE
import {
    Platform,
    Alert,
    PermissionsAndroid,
} from 'react-native';

import Peripheral, {
    TxPowerLevel,
    AdvertiseMode,
    Permission,
    Property,
} from 'react-native-multi-ble-peripheral';

import { Buffer } from 'buffer';
import Msg from 'app/ui/molecules/msg';

export default function Bluetooth(props) {
   /* const { colors } = Theme();
    let { currentUser, setCurrentUser } = useCurrentUser();
    const [hasPerm, setHasPerm] = React.useState(false);
    const [isEnabled, setIsEnabled] = React.useState({ bt: false, gps: false });
    const [advertising, setAdvertising] = React.useState(false);
    const peripheral = React.useRef();
    const { setBottomSheetData } = useBottomSheetData();
    const manager = new BleManager();


    const hrService = Platform.select({
        ios: '180d',
        default: '0000180d-0000-1000-8000-00805f9b34fb',
    });

    const hrCharacteristic = Platform.select({
        ios: '2a37',
        default: '00002a37-0000-1000-8000-00805f9b34fb',
    });

    React.useEffect(() => {
        if (Platform.OS === 'android') {
            (async () => {
                const connGranted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
                    {
                        title: 'BLE Peripheral Example',
                        message: 'BLE Peripheral needs access to your bluetooth',
                        buttonNeutral: 'Ask Me Later',
                        buttonNegative: 'Cancel',
                        buttonPositive: 'OK',
                    }
                );
                if (connGranted === PermissionsAndroid.RESULTS.DENIED) {
                    Alert.alert(
                        'Permission Denied',
                        'BLE Peripheral Example will not work without bluetooth permission1'
                    );
                    return;
                }
                const advGranted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
                    {
                        title: 'BLE Peripheral Example',
                        message: 'BLE Peripheral needs access to your bluetooth',
                        buttonNeutral: 'Ask Me Later',
                        buttonNegative: 'Cancel',
                        buttonPositive: 'OK',
                    }
                );
                if (advGranted === PermissionsAndroid.RESULTS.DENIED) {
                    Alert.alert(
                        'Permission Denied',
                        'BLE Peripheral Example will not work without bluetooth permission2'
                    );
                    return;
                }
                setHasPerm(true);
            })();
        } else {
            setHasPerm(true);
        }

    }, []);

    React.useEffect(() => {
        if (!hasPerm || !isEnabled) return;
        Peripheral.setDeviceName(appSetting('native', 'bluetooth_device_name_prefix') + "-" + currentUser.id).catch((err) =>
            console.error('SET NAME', err)
        );
    }, [hasPerm, isEnabled]);

    const startAdv = () => {
        if (!hasPerm) return;

        if (advertising) {
            if (peripheral.current) {
                const oldBLE = peripheral.current;
                oldBLE
                    .stopAdvertising()

                    .catch((err) => {

                    })
                    .finally(() => {
                        setAdvertising(false);
                    });
            }
        }
        else {
            if (peripheral.current) {
                const oldBLE = peripheral.current;
                oldBLE
                    .stopAdvertising()
                    .then(() => oldBLE.destroy())
                    .catch((err) => {
                        console.error(err);
                    });
            }
            const ble = new Peripheral();
            peripheral.current = ble;


            ble.on('ready', async () => {

                try {
                    await ble.addService(hrService, true);
                    await ble.addCharacteristic(
                        hrService,
                        hrCharacteristic,
                        Property.READ | Property.NOTIFY | Property.INDICATE,
                        Permission.READABLE
                    );
                    await ble.updateValue(
                        hrService,
                        hrCharacteristic,
                        Buffer.from('demo', 'hex')
                    );
                    await ble.startAdvertising(
                        {
                            [hrService]: Buffer.from(''),
                        }
                    );

                    setAdvertising(true);
                } catch (err) {
                    setAdvertising(false);
                    //console.error('START', err);
                }
            });
            ble.on('error888', console.error);
        }
    }


    function scan() {
        manager.startDeviceScan(null, { allowDuplicates: true }, (error, device) => {
            if (error) {
                console.log("Error", error);
                // Handle error
                return;
            }
            const txPower = -59 // This is the RSSI value at 1 meter distance
            const rssi = device.rssi
            const ratio = rssi / txPower
            let distance

            if (ratio < 1.0) {
                distance = Math.pow(ratio, 10)
            } else {
                distance = 0.89976 * Math.pow(ratio, 7.7095) + 0.111
            }
            //console.log("Discovered device:", device.name, device.id, device.rssi, distance);

            currentUser?.settings?.forgotted_users
            if (device?.name?.includes(appSetting('native', 'bluetooth_device_name_prefix') + "-") && distance < 1) {
                let userId = device.name.replace(appSetting('native', 'bluetooth_device_name_prefix') + "-", '');
                //console.log("----", currentUser?.settings?.forgotted_users, userId, "----")
                if (!currentUser?.settings?.forgotted_users || !currentUser?.settings?.forgotted_users.includes(parseInt(userId))) {
                    manager.stopDeviceScan();
                    manager.connectToDevice(device.id)
                        .then(async (device) => {
                            //FeedbackHaptics('Heavy')
                            let request_url = '/api.php?r=system/befriend/TemplServiceProfiles&params[]={"profile_id":' + userId + ',"action":"info"}';
                            const sResponse = await fetcher(request_url);

                            setBottomSheetData({ content: <FriendInfo data={sResponse.data} type="info" />, showClose: false, snapPoints: ['40%', '50%'] });

                            return device.discoverAllServicesAndCharacteristics();
                        })
                        .catch((error) => {
                            console.log(error);
                        });
                }
            }
        });
    }

    const setConn = async (id) => {
        let request_url = '/api.php?r=system/befriend/TemplServiceProfiles&params[]={"profile_id":' + id + ',"action":"add"}';
        const sResponse = await fetcher(request_url);
        //FeedbackHaptics('Success');
        setBottomSheetData({ content: <FriendInfo data={sResponse.data} type="finished" />, showClose: false, snapPoints: ['40%', '50%'] });
    }

    const forgot = async (id) => {
        
        let forgottedUsers = currentUser?.settings?.forgotted_users ? currentUser.settings.forgotted_users : [];
        forgottedUsers.push(id);
        forgottedUsers = Array.from(new Set(forgottedUsers));
        //console.log("----------",forgottedUsers )
        const updatedUser = {
            ...currentUser,
            settings: {
                ...currentUser.settings,
                forgotted_users: forgottedUsers,
            },
        };
        console.log(updatedUser);
        let request_url = '/api.php?r=system/update_settings/TemplServiceProfiles&params[]={user_id}&params[]='.replace('{user_id}', currentUser.id) + JSON.stringify(updatedUser.settings);
        await fetcher(request_url);

        setCurrentUser(updatedUser);
        setBottomSheetData(false);
    }

    const FriendInfo = ({ data, type }) => (
        <>
            <View className='pb-4 justify-end items-center mx-auto w-full'>
                <View className='mb-4'>
                    <Text className={"text-lg font-bold text-neutral-800 dark:text-neutral-200 "}>{data.result ? 'You are already friends!' : 'Do you want to add a new friend?'}</Text>
                </View>
                <Profile {...data.profile} displayType="unit_wo_info" displaySize="2xl" />
                <View className='my-4'>
                    <Text className={"text-lg font-bold text-neutral-800 dark:text-neutral-200 "}>{data.profile.display_name}</Text>
                </View>
                {type == 'info' && !data.result && <Row className='gap-x-4'>
                    <Button variant="primary" onPress={() => setConn(data.profile.id)} title="Add new friend" />
                    <Button variant="default" onPress={() => forgot(data.profile.id)} title="Ignore" />
                </Row>
                }
                {(type == 'finished' || (data.result && type == 'info')) && <Row>
                    <Button variant="primary" onPress={() => setBottomSheetData(false)} title="Close" />

                </Row>
                }
            </View>
        </>
    )

    manager.onStateChange((state) => {
        setIsEnabled((prevState) => ({
            ...prevState,
            bt: state === 'PoweredOn',
        }));
    }, true);

    let intervalId = null;

    const checkGps = async () => {
        let gpsServiceStatus = await Location.getProviderStatusAsync();
        setIsEnabled((prevState) => ({
            ...prevState,
            gps: gpsServiceStatus.locationServicesEnabled
        }));
        if (gpsServiceStatus.locationServicesEnabled && intervalId) {
            clearInterval(intervalId);
        }
    }

    useEffect(() => {
        async () => {
            await checkGps();
        }
        intervalId = setInterval(async () => {
            await checkGps();
        }, 5000);
    }, []);

    //            <Msg onVisible={!isEnabled} title={"Bluetooth is not activated"} text={"To use smart friendliness, activate Bluetooth."} handleOk={() => { }} />

    if (!isEnabled.bt || !isEnabled.gps) {
        return (
            <>
                <Text className="text-base font-semibold text-neutral-800 dark:text-neutral-200 ">Activate Bluetooth and Location Services to use proximity friend requests.</Text>
            </>
        )
    }

    return (
        <Row className='justify-between w-full '>
            <Row className='items-center gap-x-2'>
                <Switch
                    trackColor={{ false: colors.border, true: colors.checkbox }}
                    thumbColor={'#ffffff'}
                    onValueChange={() => startAdv()}
                    activeThumbColor={'#ffffff'}
                    value={advertising ? true : false}
                    ios_backgroundColor={colors.background}
                />
                <Text className="text-base font-semibold text-neutral-800 dark:text-neutral-200 ">Share  Profile</Text>
            </Row>
            <Button startDecorator="SquareUser" title="Scan Profile" onPress={() => scan()} />
        </Row>
    );*/
}