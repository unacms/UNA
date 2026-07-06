import { BlockWrapper } from 'app/components/block-wrapper';
import { getComponent } from 'app/components/registry';

export default function ElementTaskTimer({ data, blockWrapperProps }) {
    const TaskTimer = getComponent('molecule', 'task_timer');

    return (
        <BlockWrapper {...blockWrapperProps}>
            <TaskTimer data={data} />
        </BlockWrapper>
    );
}
