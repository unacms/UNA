import { View, Row } from 'app/design/view';
import { StyleSheet } from 'react-native';

import {
    CardField
  } from '@stripe/stripe-react-native';

export default function Stripe({data}) {

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      padding: 8,
    },
    cardField: {
      height: 50,
    },
  });

    return (

        <CardField
          postalCodeEnabled={false}
          autofocus
          style={styles.cardField}
          cardStyle={{
            textColor: '#1c1c1c',
          }}
        />
    );
}