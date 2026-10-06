import Field from './_field';
import { NeoButton } from 'app/design/controls';
import { fetcher } from 'app/lib/fetcher';
import { Row } from 'app/design/view'
import { useRouter, redirectTo } from 'app/lib/hooks/router'
import { useState } from 'react';
import Msg from 'app/ui/molecules/dialogs/msg';

export default function FormFieldText(props) {
    const router = useRouter();
    const [showMsg, setShowMsg] = useState(false);

    const onClick = async (v) => {
        const res = await fetcher(v);
        if (res?.data?.redirect){
            redirectTo(router, res?.data?.redirect);
        }
        if (res?.data?.message){
            setShowMsg(res?.data?.message);
        }
    }

    return (
        <Field {...props} >
            <Msg onVisible={showMsg} title={showMsg} handleOk={() => { setShowMsg(false) }} />
            <Row className="gap-x-2">
                {props.content.map((item, index) => (
                    <NeoButton key={`btn${index}`} label={item.title} onPress={() => { onClick(item.callback) }} />
                ))}
            </Row>
        </Field>
    );
}
