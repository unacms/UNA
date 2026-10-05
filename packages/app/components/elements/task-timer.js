import { BlockWrapper } from 'app/components/block-wrapper';
import { components } from 'app/components/registry';

export default function ElementTaskTimer({ data, blockWrapperProps }) {
    const TaskTimer = components['molecule']['task_timer'];

    return (
        <BlockWrapper {...blockWrapperProps}>
            <TaskTimer data={data} />
        </BlockWrapper>
    );
}
