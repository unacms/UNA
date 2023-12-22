import { View, Row } from 'app/design/view';
import * as React from 'react';
import {loadStripe} from '@stripe/stripe-js';
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout
} from '@stripe/react-stripe-js';
import { useState } from 'react';
import { Text } from 'app/design/typography';

const stripePromise = loadStripe('pk_test_123');

export default function ElementStripe({data}) {

    const [clientSecret, setClientSecret] = useState('');
    
    return (
        <> 
            <Text>Anton todo</Text>
            {clientSecret && (
                <EmbeddedCheckoutProvider
                    stripe={stripePromise}
                    options={options}
                >
                    <EmbeddedCheckout />
                </EmbeddedCheckoutProvider>
            )}
        </>
    );
}