import { User, DatePost, Message, AdminStats, PaymentRecord } from '../types';
import { supabase } from './supabaseClient';

// --- READ operations
export const getUsers = async (): Promise<User[]> => {
    const { data, error } = await supabase.from('users').select('*');
    if (error) {
        console.error("Error fetching users:", error);
        throw error;
    }
        return (data || []).map(u => ({
        ...u,
        isPremium: u.is_premium,
            isAdmin: u.is_admin,
        earnedBadgeIds: u.earned_badge_ids,
    }));
};

export const getDatePosts = async (): Promise<DatePost[]> => {
    const { data, error } = await supabase.from('date_posts').select('*').order('created_at', { ascending: false });
    if (error) {
        console.error("Error fetching date posts:", error);
        throw error;
    }
    return (data || []).map(p => ({
        ...p,
        dateTime: p.date_time,
        createdBy: p.created_by,
        chosenApplicantId: p.chosen_applicant_id,
    }));
};

export const getMessages = async (): Promise<Message[]> => {
    const { data, error } = await supabase.from('messages').select('*').order('timestamp');
    if (error) {
        console.error("Error fetching messages:", error);
        throw error;
    }
    return (data || []).map(m => ({
        ...m,
        senderId: m.sender_id,
        receiverId: m.receiver_id,
    }));
};

export const getMatches = async (currentUserId: number): Promise<number[]> => {
    const { data, error } = await supabase
        .from('matches')
        .select('user_1_id, user_2_id')
        .or(`user_1_id.eq.${currentUserId},user_2_id.eq.${currentUserId}`);

    if (error) {
        console.error("Error fetching matches:", error);
        throw error;
    }

    return data.map(match => match.user_1_id === currentUserId ? match.user_2_id : match.user_1_id);
};

export const getSwipedLeftIds = async (currentUserId: number): Promise<number[]> => {
    const { data, error } = await supabase
        .from('swipes')
        .select('swiped_user_id')
        .eq('user_id', currentUserId)
        .eq('direction', 'left');
    
    if (error) {
        console.error("Error fetching left swipes:", error);
        return [];
    }
    return data.map(swipe => swipe.swiped_user_id);
};


// --- WRITE operations
export const createDate = async (newDateData: Omit<DatePost, 'id'>): Promise<DatePost> => {
    const { dateTime, createdBy, chosenApplicantId, ...rest } = newDateData;
    const { data, error } = await supabase
        .from('date_posts')
        .insert({ 
            ...rest,
            date_time: dateTime,
            created_by: createdBy,
            chosen_applicant_id: chosenApplicantId,
        })
        .select()
        .single();
    if (error) {
        console.error("Error creating date:", error);
        throw error;
    }
    return { 
        ...data, 
        dateTime: data.date_time,
        createdBy: data.created_by,
        chosenApplicantId: data.chosen_applicant_id,
    };
};

export const sendMessage = async (senderId: number, receiverId: number, text: string): Promise<Message> => {
    const { data, error } = await supabase
        .from('messages')
        .insert({ sender_id: senderId, receiver_id: receiverId, text })
        .select()
        .single();
        
    if (error) {
        console.error("Error sending message:", error);
        throw error;
    }
    return {
        ...data,
        senderId: data.sender_id,
        receiverId: data.receiver_id,
    };
};

export const updateUser = async (updatedUser: User): Promise<User> => {
    const { id, isPremium, earnedBadgeIds, ...updateData } = updatedUser;
    const { data, error } = await supabase
        .from('users')
        .update({
            ...updateData,
            is_premium: isPremium,
                is_admin: updatedUser.isAdmin,
            earned_badge_ids: earnedBadgeIds,
        })
        .eq('id', id)
        .select()
        .single();
    
    if (error) {
        console.error("Error updating user:", error);
        throw error;
    }
    return {
        ...data,
        isPremium: data.is_premium,
            isAdmin: data.is_admin,
        earnedBadgeIds: data.earned_badge_ids,
    };
};

export const updateDatePost = async (updatedPost: DatePost): Promise<DatePost> => {
    const { id, dateTime, createdBy, chosenApplicantId, ...updateData } = updatedPost;
     const { data, error } = await supabase
        .from('date_posts')
        .update({ 
            ...updateData, 
            date_time: dateTime,
            created_by: createdBy,
            chosen_applicant_id: chosenApplicantId
        })
        .eq('id', id)
        .select()
        .single();
    
    if (error) {
        console.error("Error updating date post:", error);
        throw error;
    }
    return { 
        ...data, 
        dateTime: data.date_time,
        createdBy: data.created_by,
        chosenApplicantId: data.chosen_applicant_id,
    };
};

export const deleteDatePost = async (dateId: number): Promise<void> => {
    const { error } = await supabase
        .from('date_posts')
        .delete()
        .eq('id', dateId);
    
    if (error) {
        console.error("Error deleting date post:", error);
        throw error;
    }
};

export const recordSwipe = async (userId: number, swipedUserId: number, direction: 'left' | 'right'): Promise<{ isMatch: boolean }> => {
    const { error: swipeError } = await supabase
        .from('swipes')
        .upsert({ user_id: userId, swiped_user_id: swipedUserId, direction: direction });

    if (swipeError) {
        console.error("Error recording swipe:", swipeError);
        throw swipeError;
    }

    if (direction === 'left') {
        return { isMatch: false };
    }

    const { data: otherSwipeData, error: checkError } = await supabase
        .from('swipes')
        .select('direction')
        .eq('user_id', swipedUserId)
        .eq('swiped_user_id', userId)
        .single();
    
    if (checkError && checkError.code !== 'PGRST116') { // PGRST116: No rows found, which is fine
        console.error("Error checking for match:", checkError);
    }

    if (otherSwipeData && otherSwipeData.direction === 'right') {
        const user_1_id = Math.min(userId, swipedUserId);
        const user_2_id = Math.max(userId, swipedUserId);

        const { error: matchError } = await supabase
            .from('matches')
            .insert({ user_1_id, user_2_id });
        
        if (matchError && matchError.code !== '23505') { // 23505: unique constraint violation, already matched
            console.error("Error creating match:", matchError);
            throw matchError;
        }
        return { isMatch: true };
    }

    return { isMatch: false };
};

export const recallSwipe = async (userId: number, lastSwipedUserId: number): Promise<void> => {
    const { error } = await supabase
        .from('swipes')
        .delete()
        .match({ user_id: userId, swiped_user_id: lastSwipedUserId });
    
    if (error) {
        console.error("Error recalling swipe:", error);
        throw error;
    }
};

// --- ADMIN operations
export const getAdminStats = async (): Promise<AdminStats> => {
    try {
        // Get total users and premium/regular count
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('is_premium');
        
        if (usersError) {
            console.error("Error fetching users for stats:", usersError);
            throw usersError;
        }

        const totalUsers = users?.length || 0;
        const premiumUsers = users?.filter(u => u.is_premium).length || 0;
        const regularUsers = totalUsers - premiumUsers;

        // Get payment records
        const { data: payments, error: paymentsError } = await supabase
            .from('payment_orders')
            .select('*')
            .eq('status', 'completed')
            .order('created_at', { ascending: false })
            .limit(20);

        if (paymentsError && paymentsError.code !== 'PGRST116') { // Table might not exist yet
            console.error("Error fetching payments for stats:", paymentsError);
        }

        const recentPayments: PaymentRecord[] = (payments || []).map(p => ({
            id: p.id,
            userId: p.user_id,
            amount: parseFloat(p.amount || '0'),
            paypalTransactionId: p.paypal_transaction_id || '',
            createdAt: p.created_at,
            status: p.status
        }));

        const totalRevenue = recentPayments.reduce((sum, payment) => sum + payment.amount, 0);

        return {
            totalUsers,
            premiumUsers,
            regularUsers,
            totalRevenue,
            recentPayments
        };
    } catch (error) {
        console.error("Error fetching admin stats:", error);
        throw error;
    }
};
