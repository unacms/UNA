import StarRating from 'react-native-star-rating-widget';
import StarRatingDisplay from 'react-native-star-rating-widget';
import { Theme } from 'app/design/theme';
import { View, Row } from 'app/design/view'
import { Text } from 'app/design/typography'

export function StarsView(props) {
    const maxStars = props.maxStars || 1;
    const { colors } = Theme();
    return (
        <Row className="-ml-2 items-center">
            <StarRatingDisplay starStyle={props.starStyle} maxStars={1} {...props} starSize={props.starSize ? props.starSize: 24} color={colors.stars} enableHalfStar={false} />
            <Text className="font-semibold text-base">{props.rating}</Text>
        </Row>
    );
}

export function StarsAction(props) {
    const { colors } = Theme();
    return <StarRating {...props} starSize={props.starSize ? props.starSize: 24} color={colors.stars} enableHalfStar={false} />;
}