import { View, ScrollView, Row, Pressable } from 'app/design/view'
import { Modal } from 'app/design/controls'
import { useState, useEffect } from 'react';
import { useCurrentUser } from 'app/context/user';
import { appSetting, storageSet, storageGet } from 'app/lib/util'
import Browse from 'app/components/elements/browse'
import { fetcher } from 'app/lib/fetcher';
import { useWindowDimensions } from 'react-native';
import { Text } from 'app/design/typography'
import { Button } from 'app/design/controls'
import Profile from 'app/ui/molecules/profile';
import { Switch } from 'app/design/controls'
import { Theme } from 'app/design/theme';
import { BleManager } from 'react-native-ble-plx';
import {

    Platform,

    NativeModules,

    NativeEventEmitter,
    PermissionsAndroid,
  } from 'react-native';
export default function Bluetooth(props) {
    
    const manager = new BleManager();
    

    useEffect(() => {
        // turn on bluetooth if it is not on
       
    
          if (Platform.OS === 'android' && Platform.Version >= 23) {
          PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          ).then(result => {
            if (result) {
              console.log('Permission is OK');
            } else {
              PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
              ).then(result => {
                if (result) {
                  console.log('User accept');
                } else {
                  console.log('User refuse');
                }
              });
            }
          });
        }
    
      }, []);

    function scan() {
        console.log("Scanning...");
        manager.startDeviceScan(null, {allowDuplicates: true}, (error, device) => {
            if (error) {
                console.log("Error",error);
                // Handle error
                return;
            }

            // Found a BLE device
           // console.log("Discovered device:", device.name, device.id, device.rssi);
            console.log(device.name,device.rssi);
            // Example: Stop scanning and connect if a specific device is found
            if (device.isConnectable) {
                console.log("connectto", device.name);
                manager.stopDeviceScan();

                device.connect()
                .then((device) => {
                  return device.discoverAllServicesAndCharacteristics();
                })
                .then((device) => {
                  return manager.writeCharacteristicWithResponseForDevice(
                    device.id,
                    serviceUUID,
                    characteristicUUID,
                    data, // remember to encode this to base64
                  );
                })
                .then(() => {
                  console.log('Data sent!');
                })
                .catch((error) => {
                  // Handle error.
                });

               /* device.connect()
                    .then((device) => {
                        console.log("555");
                        return device.discoverAllServicesAndCharacteristics();
                    })
                    .then((device) => {
                        // Read RSSI value
                        device.readRSSI().then((rssi) => {
                            console.log("RSSI value:", rssi);
                            // Estimate proximity based on RSSI
                        });
                    })
                    .catch((error) => {
                        console.log(error);
                    });*/
            }
        });
    }

    return (
        <Row className='justify-between w-full '>
            <Button  startDecorator="Megaphone"  title="Share  Profile" onPress={() => scan()} />
            
                <Button  startDecorator="UserFocus" title="Scan Profile" onPress={() => manager.stopDeviceScan()}  />

           

           
        </Row>
    );
}