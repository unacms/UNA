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
import { BleManager } from 'react-native-ble-plx';
import { BottomSheetData } from 'app/context/bottomsheet';
import {
    Platform,
    NativeModules,
    Alert,
    NativeEventEmitter,
    PermissionsAndroid,
} from 'react-native';

import Peripheral, {
    TxPowerLevel,
    AdvertiseMode,
    Permission,
    Property,
} from 'react-native-multi-ble-peripheral';
import { Buffer } from 'buffer';


export default function Bluetooth(props) {
    const { colors } = Theme();
    let { currentUser, setCurrentUser } = useCurrentUser();
    const [hasPerm, setHasPerm] = React.useState(false);
    const [advertising, setAdvertising] = React.useState(false);
    const peripheral = React.useRef();
    const { bottomSheetData, setBottomSheetData } = useContext(BottomSheetData);

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
        if (!hasPerm) return;
        Peripheral.setDeviceName(appSetting('layout', 'bluetooth_device_name_prefix') + "-" + currentUser.id).catch((err) =>
            console.error('SET NAME', err)
        );
    }, [hasPerm]);

    const startAdv = () => {
        console.log("advertising", advertising);
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
                    //console.log('Currect State:', await ble.checkState());
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
                    console.error('START', err);
                }
            });
            ble.on('error888', console.error);
        }
    }

    const manager = new BleManager();
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

            if (device?.name?.includes(appSetting('layout', 'bluetooth_device_name_prefix') + "-") && distance < 1) {
                manager.stopDeviceScan();
                manager.connectToDevice(device.id)
                    .then(async (device) => {
                        let userId = device.name.replace(appSetting('layout', 'bluetooth_device_name_prefix') + "-", '');
                      //  userId = 22;
                        //console.log(userId);
                        let request_url = '/api.php?r=system/befriend/TemplServiceProfiles&params[]=' + userId;
                        const sResponse = await fetcher(request_url);
                       // console.log(sResponse);

                        setBottomSheetData({ content: <FriendInfo data={sResponse.data} />, showClose: false, snapPoints: ['40%', '50%'] });
                        setTimeout(() => {
                            setBottomSheetData(false);
                        }, 3000);
                        return device.discoverAllServicesAndCharacteristics();
                    })
                    .catch((error) => {
                        console.log(error);
                    });
            }
        });
    }

    const FriendInfo = ({ data }) => (
        <>
            <View className='pb-4 justify-end items-center mx-auto w-full'>
                <View className='mb-4'>
                    <Text className={"text-lg font-bold text-neutral-800 dark:text-neutral-200 "}>{data.result ? 'You have a new friend' : 'You are already friends with'}</Text>
                </View>
                <Profile {...data.profile} displayType="unit_wo_info" displaySize="2xl" />
                <View className='my-4'>
                    <Text className={"text-lg font-bold text-neutral-800 dark:text-neutral-200 "}>{data.profile.display_name}</Text>
                </View>
                {/*<Button onPress={() => setBottomSheetData(false)} title="Close" />*/}
            </View>
        </>
    )

    return (
        <Row className='justify-between w-full '>
            <Row className='items-center gap-x-2'>
                <Switch
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor={'#ffffff'}
                    onValueChange={() => startAdv()}
                    activeThumbColor={'#ffffff'}
                    value={advertising ? true : false}
                    ios_backgroundColor={colors.background}
                />
                <Text className="text-base font-semibold text-neutral-800 dark:text-neutral-200 ">Share  Profile</Text>
            </Row>
            <Button startDecorator="UserFocus" title="Scan Profile" onPress={() => scan()} />
        </Row>
    );
}