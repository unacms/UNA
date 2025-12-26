import { Pressable } from 'app/design/view';
import Link from 'app/ui/atoms/link'
import { useState, useCallback } from 'react';
import { getPageData } from 'app/lib/util';
import FormModal from 'app/ui/molecules/form_modal';
import { Platform } from 'react-native';

export default function LinkModal({ href, children, showInModal = false }) {
    if (!showInModal) {
        return (
            <Link href={href}>
                {children}
            </Link>
        );
    }

    return (
        <LinkModal_ href={href}>
            {children}
        </LinkModal_>
    );
}

function LinkModal_({ href, children }) {
    const [pageData, setPageData] = useState(false);

    const handlePress = useCallback(async () => {
        const sResponse = await getPageData(href, false);
        if (sResponse.data !== pageData) {
            setPageData(sResponse.data);
        }
    }, [href, getPageData, pageData]);

    return (
        <>
            <Pressable href={href} onPress={(e) => {
                if (Platform.OS === "web") e.preventDefault(); 
                handlePress();
            }}>
                {children}
            </Pressable>
            <FormModal modalView='content_page' pageData={pageData} setPageData={setPageData} url={href} />
        </>
    );

}   