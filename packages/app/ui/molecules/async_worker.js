
import {componentsMap} from 'app/ui/workers/_map';
import { appSetting } from 'app/lib/util'
import { useEffect, useState } from 'react'

export default function ElementAsyncWorker(props) {
    let asyncWorkers = appSetting('layout', 'async_workers');
    const [content, setContent] = useState([]);

    useEffect(() => {
        const updateContent = () => {
            const newContent = asyncWorkers.map((worker, index) => {
                const WorkerComponent = componentsMap[worker];
                return <WorkerComponent key={index} />;
            });
            setContent(newContent);
        };

        updateContent();

        const interval = setInterval(() => {
            updateContent();
        }, appSetting('layout', 'async_workers_interval') * 1000);

        return () => clearInterval(interval);
    }, []);

    return <>{content}</>;
}