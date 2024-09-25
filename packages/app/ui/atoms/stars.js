import StarRating from 'react-native-star-rating-widget';
import StarRatingDisplay from 'react-native-star-rating-widget';
import { Theme } from 'app/design/theme';
import { View } from 'app/design/view'

export function StarsView(props) {
    const maxStars = props.maxStars || 1;
    const { colors } = Theme();
    return <View className="-ml-2"><StarRatingDisplay maxStars={1} {...props} starSize={props.starSize ? props.starSize: 24} color={colors.stars} enableHalfStar={false} /></View>;
}

export function StarsAction(props) {
    const { colors } = Theme();
    return <StarRating {...props} starSize={props.starSize ? props.starSize: 24} color={colors.stars} enableHalfStar={false} />;
}