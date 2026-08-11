import { Pressable } from 'app/design/view';
import Link from 'app/ui/atoms/link'
import { useState, useCallback } from 'react';
import { getPageData } from 'app/lib/util';
import FormModal from 'app/ui/molecules/dialogs/form_modal';
import { Platform } from 'react-native';
import { useOpenModalByUrl } from 'app/context/jotai/modal';

export default function LinkModal({ href, children, showInModal = false, className = '' }) {
    const openModalByUrl = useOpenModalByUrl();
    if (!href){
        return children;
    }
    if (!showInModal) {
        return (
            <Link href={href} className={className}>
                {children}
            </Link>
        );
    }

    return (
        <Pressable href={href} className={className} onPress={(e) => {
            if (Platform.OS === "web") e.preventDefault(); 
             openModalByUrl(href);
        }}>
            {children}
        </Pressable>
    );
}