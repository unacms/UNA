import { A, H1, P, Text, TextLink } from 'app/design/typography'
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View, Row } from 'app/design/view'
import {StyleSheet,  } from 'react-native';
import { Button } from 'app/design/controls'
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import DropDownPicker from 'react-native-dropdown-picker';
import Picker  from 'app/ui/atoms/picker';




export function PostScreen() {


  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(null);

  let items = [
    {label: 'Apple', value: 'apple'},
    {label: 'Banana', value: 'banana'}
  ];

  return (
    <View>
      <Text>zxc</Text>
      <Picker items={items} value="banana" onSelect={(value) => {
                            console.log(value);
                        }} />
    </View>
  );
};










