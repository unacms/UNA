import * as React from 'react';
import {loadStripe} from '@stripe/stripe-js';
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout
} from '@stripe/react-stripe-js';
import { useState, useEffect } from 'react';
import { fetcher } from 'app/lib/fetcher';
import { APP_URL } from 'app/config';

export default function ElementStripe(oProps) {
    const sProvider = 'stripe_v3';
    const [publicKey, setPublicKey] = useState('');
    const [clientSecret, setClientSecret] = useState('');

    const performAction = async (sAction, aParams, onLoad) => {
        let sParams = '';
        if(Array.isArray(aParams))
            sParams = aParams.join('&params[]=');
        else
            sParams = JSON.stringify(aParams);

        const sRequest = '/api.php?r=bx_payment/' + sAction + '&params[]=' + sParams;

        const sResponse = await fetcher(sRequest);
        if(typeof onLoad === 'function')
            onLoad(sResponse?.data);
    };

    performAction('get_provider_options', [oProps.seller_id, sProvider], (oData) => {
        if(!oData?.name || oData.name != sProvider || !oData?.options)
            return;

        let sPublicKey = '';
        switch(parseInt(oData.options.strp_v3_mode.value)) {
            case 1:
                sPublicKey = oData.options.strp_v3_live_pub_key.value;
                break;

            case 2:
                sPublicKey = oData.options.strp_v3_test_pub_key.value;
                break;
        }

        if(!sPublicKey)
            return;

        setPublicKey(sPublicKey);
    });

    let stripePromise = null;
    if(!!publicKey)
        stripePromise = loadStripe(publicKey);

    useEffect(() => {
        performAction('stripe_v3_create_session_api', {type: 'single', seller_id: oProps.seller_id, items: oProps.items.join('&'), return_url: APP_URL}, (oData) => {
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