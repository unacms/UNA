import Header from 'app/components/nav/header';
import { useCallback } from 'react';

export function useUpdateCenterHeader(navigation) {
    const updateCenterHeader = useCallback(
        (_path, header, backButtonPresented, rightComponents, headerSettings) => {
            if (headerSettings?.header === false) {
                navigation.setOptions({ headerShown: false });
            } else {
                if (backButtonPresented === null) {
                    if (headerSettings?.backButton !== false) {
                        backButtonPresented = true;
                    }
                }
                navigation.setOptions({
                    headerBackVisible: false,
                    header: (props) => (
                        <Header
                            backButtonPresented={backButtonPresented}
                            header={header}
                            pagePath={_path}
                            rightComponents={rightComponents}
                        />
                    ),
                    headerShown: true
                });
            }
        },
        [navigation] // Dependencies
    );

    return updateCenterHeader;
}