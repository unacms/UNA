import React, { useCallback, useMemo, useRef } from 'react';
import { View, Row } from 'app/design/view'
import {StyleSheet } from 'react-native';

export default function ElementCommentForm(props) {
    return (
      <View  className=" bottom-0 border-t border-bordercolor/10 dark:border-bordercolor-dark/10 bg-neo-50 dark:bg-neo-700">
        {props.children}
      </View>
    );
}