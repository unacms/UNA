import React from 'react';
import { Modal } from 'app/design/controls';
import { useCurrentUser } from 'app/context/user';
import ApiPerformanceReport from 'app/ui/molecules/api-performance-report';

export default function ElementApiPerformance(props) {
    const { currentUser } = useCurrentUser();
    
    // Only show for admin users
    if (!currentUser?.operator) {
        return null;
    }

    return (
        <Modal 
            id="api-performance-modal" 
            title="API Performance Report"
            maxWidth="4xl"
        >
            <ApiPerformanceReport />
        </Modal>
    );
} 