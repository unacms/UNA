import { createContext, useContext, type ReactNode } from 'react';

const FormInstanceContext = createContext<string | null>(null);

export function FormInstanceProvider({ instanceId, children }: { instanceId: string | null; children?: ReactNode }) {
    return (
        <FormInstanceContext.Provider value={instanceId}>
            {children}
        </FormInstanceContext.Provider>
    );
}

export function useFormInstanceId() {
    return useContext(FormInstanceContext);
}
