import React from 'react';
import ReactDOM from 'react-dom';
import Countdown from 'react-countdown';
import { View, Row } from 'app/design/view'
import { Text } from 'app/design/typography'

export default function ElementCountDown(props) {

    const renderer = ({ days, hours, minutes, seconds, completed }) => {
        if (completed) {
          // Render a completed state
          return <Completionist />;
        } else {
          // Render a countdown
            return (
                <Row className='gap-x-4 lg:gap-x-16'>
                    <View className="text-center">{days}<Text className="text-base font-normal">DAYS</Text></View>
                    <View className="text-center">{hours}<Text className="text-base font-normal">HOURS</Text></View>
                    <View className="text-center">{minutes}<Text className="text-base font-normal">MINUTES</Text></View>
                    <View className="text-center">{seconds}<Text className="text-base font-normal">SECONDS</Text></View>
                </Row>
            );
        }
      };

    return(
        <View className='mx-auto bg-white rounded-lg p-4'>
            <Text className="text-2xl font-bold lg:text-8xl">
                <Countdown renderer={renderer} date={props.date} />
            </Text>
        </View>
    );
}