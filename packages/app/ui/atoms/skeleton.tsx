import React from 'react';
import { View, Row } from 'app/design/view';

const bg = 'bg-muted';
const commonClasses = {
    rounded: `${bg}/60 rounded-full`,
    avatar: `${bg}/60 mx-auto rounded-full overflow-hidden`,
    avatarInner: `w-[50%] z-20 aspect-square ${bg} mx-auto rounded-full mt-[15%]`,
    avatarBody: `w-[80%] translate-y-0.5 aspect-square ${bg} mx-auto rounded-t-full`,
};

type SkeletonPreset = 'profile-list' | 'author' | 'feed_author' | 'multitext';

type SkeletonProps = {
    visible: boolean;
    className?: string;
    fallback?: React.ReactNode;
    children?: React.ReactNode;
    preset?: SkeletonPreset;
    rounded?: 'rounded-full' | 'rounded-md' | 'rounded-xl' | false;
};

const SkeletonAvatar = ({ size }: { size: 'small' | 'large' }) => {
    const sizeClass = size === 'small' ? 'h-6 w-6' : 'h-10 w-10';

    return (
        <View className={`${sizeClass} aspect-square ${commonClasses.avatar}`}>
            <View className={commonClasses.avatarInner} />
            <View className={commonClasses.avatarBody} />
        </View>
    );
};

export function Skeleton({
    visible,
    className = '',
    fallback,
    children,
    preset,
    rounded = 'rounded-full',
}: SkeletonProps) {
    if (!visible) return children;
    if (fallback) return fallback;

    switch (preset) {
        case 'profile-list':
            return (
                <View className="flex-auto">
                    <Row className={`items-center gap-x-1 w-full ${className}`}>
                        <View className={`h-5 w-5 ${commonClasses.rounded}`} />
                        <View className={`h-3 w-1/2 ${commonClasses.rounded}`} />
                    </Row>
                </View>
            );

        case 'author':
            return (
                <Row className="flex-row gap-x-2 mb-2">
                    <SkeletonAvatar size="small" />
                    <View className="gap-y-1.5 flex-auto my-auto">
                        <View className="w-full flex-row justify-between">
                            <View className={`h-3 w-24 ${commonClasses.rounded}`} />
                        </View>
                    </View>
                </Row>
            );

        case 'feed_author':
            return (
                <Row className="flex-row gap-x-2 mb-2 w-full">
                    <SkeletonAvatar size="large" />
                    <View className="gap-y-1.5 flex-auto my-auto">
                        <View className="w-full flex-row justify-between">
                            <View className={`h-3 w-24 ${commonClasses.rounded}`} />
                            <View className={`h-3 w-6 ${commonClasses.rounded}`} />
                        </View>
                        <View className={`h-3 w-16 ${commonClasses.rounded}`} />
                    </View>
                </Row>
            );

        case 'multitext':
            return (
                <>
                    <View className={`h-3 my-1 w-full ${commonClasses.rounded}`} />
                    <View className={`h-3 my-1 w-full ${commonClasses.rounded}`} />
                    <View className={`h-3 my-1 w-full ${commonClasses.rounded}`} />
                    <View className={`h-3 my-1 w-3/4 ${commonClasses.rounded}`} />
                </>
            );

        default:
            return <View className={`${rounded || ''} ${bg} ${className}`} />;
    }
}