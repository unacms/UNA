// Shared mock data for group page tests

export const mockGroupData = {
    id: 123,
    title: 'React Native Developers',
    description: 'A community for React Native developers to share knowledge, discuss best practices, and help each other build amazing mobile applications.',
    cover_url: null, // Uses gradient fallback
    thumb_url: null, // Uses icon fallback
    visibility: '3', // 3 = public, other = private
    members_count: 2847,
    posts_count: 156,
    created_at: '2023-01-15',
    category: 'Technology',
    rules: [
        'Be respectful and constructive',
        'No spam or self-promotion without value',
        'Use code blocks for sharing code',
        'Search before asking questions',
    ],
    admins: [
        { id: 1, display_name: 'Sarah Chen', url_avatar: null, role: 'Admin' },
        { id: 2, display_name: 'Mike Johnson', url_avatar: null, role: 'Moderator' },
    ],
    members_list: [
        { id: 1, display_name: 'Sarah Chen', url_avatar: null },
        { id: 2, display_name: 'Mike Johnson', url_avatar: null },
        { id: 3, display_name: 'Alex Rivera', url_avatar: null },
        { id: 4, display_name: 'Emma Wilson', url_avatar: null },
        { id: 5, display_name: 'James Lee', url_avatar: null },
    ],
    recent_posts: [
        {
            id: 1,
            author: { display_name: 'Alex Rivera', url_avatar: null },
            content: 'Just released a new animation library for React Native! Check it out...',
            likes: 42,
            comments: 12,
            created_at: '2 hours ago',
        },
        {
            id: 2,
            author: { display_name: 'Emma Wilson', url_avatar: null },
            content: 'Has anyone tried the new Expo SDK 50? Looking for feedback on the migration process.',
            likes: 28,
            comments: 34,
            created_at: '5 hours ago',
        },
        {
            id: 3,
            author: { display_name: 'James Lee', url_avatar: null },
            content: 'Tutorial: Building a custom navigation drawer with Reanimated 3',
            likes: 89,
            comments: 21,
            created_at: '1 day ago',
        },
    ],
}

export const mockPrivateGroupData = {
    ...mockGroupData,
    id: 456,
    title: 'Premium React Native Masterclass',
    description: 'An exclusive group for advanced React Native developers. Access requires approval.',
    visibility: '1', // private
    members_count: 128,
}

