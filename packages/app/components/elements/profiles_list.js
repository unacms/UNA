import { View, Row } from 'app/design/view';
import { Text } from 'app/design/typography';
import Time from 'app/ui/atoms/time';
import ProfilesList from 'app/ui/molecules/profile_list'

export default function ElementProfilesList({data}) {
    
    return (
          <ProfilesList data={data.data} showEmpty={false} maxCount={12} displaySize="lg" />
    );
}