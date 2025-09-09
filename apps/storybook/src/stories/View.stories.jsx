import React, { useRef } from 'react';
import { Text } from "app/design/typography";
import { View, Row, ScrollView, Pressable, ViewRef } from 'app/design/view';

export default {
  title: 'Design/View',
  component: View,
};

export const DefaultView = () => (
  <View className="p-4 bg-card rounded-lg">
    <Text>This is a basic View component</Text>
  </View>
);

export const RowExample = () => (
  <Row className="p-4 bg-blue-100">
    <Text>Item 1</Text>
    <Text className="ml-2">Item 2</Text>
    <Text className="ml-2">Item 3</Text>
  </Row>
);

export const ScrollViewExample = () => (
  <ScrollView className="h-32 bg-yellow-100 p-2">
    <Text>Item 1</Text>
    <Text>Item 2</Text>
    <Text>Item 3</Text>
    <Text>Item 4</Text>
    <Text>Item 5</Text>
  </ScrollView>
);

export const PressableExample = () => (
  <Pressable
    onPress={() => alert('Pressed!')}
    className="p-4 bg-purple-200 rounded-lg"
  >
    <Text>Press Me</Text>
  </Pressable>
);

export const ViewRefExample = () => {
  const ref = useRef(null);

  return (
    <ViewRef ref={ref} className="p-4 bg-green-100 rounded-lg">
      <Text>ViewRef example (with ref attached)</Text>
    </ViewRef>
  );
};