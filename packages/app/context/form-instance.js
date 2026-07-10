import { createContext, useContext } from 'react';

const FormInstanceContext = createContext(null);

export function FormInstanceProvider({ instanceId, children }) {
    return (
        <FormInstanceContext.Provider value={instanceId}>
            {children}
        </FormInstanceContext.Provider>
    );
}

export function useFormInstanceId() {
    return useContext(FormInstanceContext);
}
