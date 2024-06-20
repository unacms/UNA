
import StarRating from 'react-native-star-rating-widget';
import StarRatingDisplay from 'react-native-star-rating-widget';

export function StarsView(props) {
    return <StarRatingDisplay {...props} starSize={24} color="#dddddd" enableHalfStar={false} />;
}

export function StarsAction(props) {
    return <StarRating {...props} starSize={24} color="#dddddd" enableHalfStar={false} />;
}