import ProfilesList from 'app/ui/molecules/profile/profile-list'
import { BlockWrapper } from 'app/components/block-wrapper'

export default function ElementProfilesList({ data, blockWrapperProps }) {

    return (
        <BlockWrapper {...blockWrapperProps}>
            <ProfilesList data={data.data} showEmpty={false} maxCount={12} displaySize="lg" />
        </BlockWrapper>
    );
}