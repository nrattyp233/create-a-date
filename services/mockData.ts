// Mock data for development when Supabase is not available
import { User, DatePost, Message } from '../types';

export const mockUsers: User[] = [
    {
        id: 1,
        name: 'Admin User',
        age: 30,
        bio: 'Administrator of Create-A-Date platform',
        photos: ['https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'],
        interests: ['technology', 'management', 'dating'],
        gender: 'male' as const,
        isPremium: true,
        isAdmin: true,
        preferences: {
            interestedIn: ['female' as const],
            ageRange: { min: 25, max: 35 }
        },
        earnedBadgeIds: ['first_date', 'starter']
    },
    {
        id: 2,
        name: 'Sarah Johnson',
        age: 25,
        bio: 'Love hiking and coffee',
        photos: ['https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'],
        interests: ['hiking', 'coffee', 'reading'],
        gender: 'female' as const,
        isPremium: false,
        isAdmin: false,
        preferences: {
            interestedIn: ['male' as const],
            ageRange: { min: 23, max: 35 }
        },
        earnedBadgeIds: []
    },
    {
        id: 3,
        name: 'Mike Chen',
        age: 28,
        bio: 'Software engineer who loves cooking',
        photos: ['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'],
        interests: ['coding', 'cooking', 'gaming'],
        gender: 'male' as const,
        isPremium: true,
        isAdmin: false,
        preferences: {
            interestedIn: ['female' as const],
            ageRange: { min: 22, max: 30 }
        },
        earnedBadgeIds: ['starter']
    },
    {
        id: 4,
        name: 'Emma Davis',
        age: 26,
        bio: 'Artist and nature lover',
        photos: ['https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'],
        interests: ['art', 'nature', 'photography'],
        gender: 'female' as const,
        isPremium: false,
        isAdmin: false,
        preferences: {
            interestedIn: ['male' as const],
            ageRange: { min: 24, max: 32 }
        },
        earnedBadgeIds: []
    }
];

export const mockDatePosts: DatePost[] = [
    {
        id: 1,
        title: 'Coffee and Art Walk',
        description: 'Let\'s explore the local art scene over good coffee',
        location: 'Downtown Arts District',
        dateTime: '2024-01-20T15:00:00Z',
        createdBy: 2,
        applicants: [3],
        chosenApplicantId: null,
        categories: ['Arts & Culture', 'Food & Drink']
    },
    {
        id: 2,
        title: 'Hiking Adventure',
        description: 'Morning hike with scenic views',
        location: 'Mountain Trail Park',
        dateTime: '2024-01-22T09:00:00Z',
        createdBy: 4,
        applicants: [1, 3],
        chosenApplicantId: null,
        categories: ['Outdoors & Adventure', 'Active & Fitness']
    }
];

export const mockMessages: Message[] = [
    {
        id: 1,
        senderId: 2,
        receiverId: 1,
        text: 'Hey! Thanks for swiping right!',
        timestamp: '2024-01-15T10:30:00Z',
        read: true
    },
    {
        id: 2,
        senderId: 1,
        receiverId: 2,
        text: 'Great to match with you! Love your hiking photos.',
        timestamp: '2024-01-15T10:35:00Z',
        read: true
    }
];

export const mockOrders = [
    {
        order_id: 'mock-order-1',
        user_id: 3,
        amount: '10.00',
        status: 'paid',
        paypal_order_id: 'PAYPAL_ORDER_123',
        paypal_transaction_id: 'TXN_123456',
        created_at: '2024-01-10T12:00:00Z'
    },
    {
        order_id: 'mock-order-2',
        user_id: 1,
        amount: '10.00',
        status: 'paid',
        paypal_order_id: 'PAYPAL_ORDER_456',
        paypal_transaction_id: 'TXN_789012',
        created_at: '2024-01-12T14:30:00Z'
    }
];