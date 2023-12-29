import { View, Row } from 'app/design/view';
import * as React from 'react';
import {loadStripe} from '@stripe/stripe-js';
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout
} from '@stripe/react-stripe-js';
import { useState, useEffect } from 'react';
import { fetcher } from 'app/lib/fetcher';
import { appSetting } from 'app/lib/util';

const stripePromise = loadStripe('pk_test_bLA7kZRT7qFAiZg2lILjy8bA');

export default function ElementStripe(oProps) {

    const [clientSecret, setClientSecret] = useState('');

    const performAction = async (sAction, aParams, onLoad) => {
        const sRequest = '/api.php?r=bx_payment/' + sAction + '&params[]=' + JSON.stringify(aParams);

        const sResponse = await fetcher(sRequest);
        if(typeof onLoad === 'function')
            onLoad(sResponse?.data);
    };

    useEffect(() => {
        performAction('stripe_v3_create_session_api', {type: 'single', seller_id: oProps.seller_id, items: oProps.items.join('&'), return_url: appSetting("urls", "site")}, (oData) => {
            setClientSecret(oData.clientSecret)
        });
      }, []);

    return (
        clientSecret &&
            <EmbeddedCheckoutProvider stripe={stripePromise} options={{clientSecret}}>
                <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
    );
}