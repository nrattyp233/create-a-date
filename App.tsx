import React, { useState, useMemo, useEffect, useRef } from 'react';
import { View, User, DatePost, Message, Badge } from './types';
import { CURRENT_USER_ID, colorThemes, ColorTheme, BADGES, WEEKLY_CHALLENGE_PROMPTS, HeartIcon, CalendarIcon, PlusIcon, ChatIcon } from './constants';
import * as api from './services/api';
import { categorizeDatePost } from './services/geminiService';
import { useToast, ToastProvider } from './contexts/ToastContext';

import Header from './components/Header';
import SwipeDeck from './components/SwipeDeck';
import DateMarketplace from './components/DateMarketplace';
import CreateDateForm from './components/CreateDateForm';
import MyDatesManager from './components/MyDatesManager';
import ProfileSettings from './components/ProfileSettings';
import MatchesView from './components/MatchesView';
import ChatView from './components/ChatView';
import ProfileModal from './components/ProfileModal';
import IcebreakerModal from './components/IcebreakerModal';
import ProfileFeedbackModal from './components/ProfileFeedbackModal';
import DatePlannerModal from './components/DatePlannerModal';
import MonetizationModal from './components/MonetizationModal';
import AdminStats from './components/AdminStats';
import Auth from './components/Auth';

// --- START: Onboarding Component ---
const ONBOARDING_STEPS = [
  {
    title: "Welcome to Create-A-Date!",
    text: "Let's take a quick tour of how to find your next great connection.",
    icon: (props: any) => <HeartIcon {...props} />,
  },
  {
    title: "The Swipe Deck",
    text: "This is where the classic fun happens. Swipe right on profiles you like, and left on those you don't. It's your main way to discover new people.",
    icon: (props: any) => <HeartIcon {...props} />,
  },
  {
    title: "The Date Marketplace",
    text: "Browse unique date ideas posted by other users. If you see one you like, express your interest and see if you get chosen!",
    icon: (props: any) => <CalendarIcon {...props} />,
  },
  {
    title: "Create-A-Date",
    text: "Post your own date ideas! Use our AI tools to make your description more exciting and attract the right person to join you.",
    icon: (props: any) => <PlusIcon {...props} />,
  },
  {
    title: "Chats & Matches",
    text: "Once you match with someone, you can start a conversation here. Our AI can even help you break the ice!",
    icon: (props: any) => <ChatIcon {...props} />,
  },
  {
    title: "You're All Set!",
    text: "That's the basics. Explore, connect, and create amazing dates. Have fun!",
    icon: (props: any) => <HeartIcon {...props} />,
  },
];

const OnboardingGuide: React.FC<{ onFinish: () => void }> = ({ onFinish }) => {
    const [step, setStep] = useState(0);
    const currentStep = ONBOARDING_STEPS[step];
    const isLastStep = step === ONBOARDING_STEPS.length - 1;

    const handleNext = () => {
        if (isLastStep) {
            onFinish();
        } else {
            setStep(s => s + 1);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-dark-2 rounded-2xl w-full max-w-sm p-8 text-center border border-dark-3 shadow-lg flex flex-col items-center">
                <div className="w-16 h-16 mb-4 bg-gradient-to-br from-brand-pink to-brand-purple rounded-full flex items-center justify-center text-white">
                    {currentStep.icon({ className: "w-8 h-8" })}
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">{currentStep.title}</h2>
                <p className="text-gray-300 mb-6">{currentStep.text}</p>
                <button
                    onClick={handleNext}
                    className="w-full py-3 rounded-lg font-bold transition-all duration-300 bg-gradient-to-r from-brand-pink to-brand-purple text-white hover:opacity-90"
                >
                    {isLastStep ? "Let's Go!" : "Next"}
                </button>
                 {!isLastStep && (
                    <button onClick={onFinish} className="mt-3 text-sm text-gray-500 hover:text-gray-300">
                        Skip Tour
                    </button>
                )}
            </div>
        </div>
    );
};
// --- END: Onboarding Component ---

const MainApp: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentView, setCurrentView] = useState<View>(View.Swipe);
    const [users, setUsers] = useState<User[]>([]);
    const [datePosts, setDatePosts] = useState<DatePost[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [matches, setMatches] = useState<number[]>([]);
    const [swipedLeftIds, setSwipedLeftIds] = useState<number[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [lastSwipedUserId, setLastSwipedUserId] = useState<number | null>(null);
    const { showToast } = useToast();
    
    // State for dynamic color theme
    const [activeColorTheme, setActiveColorTheme] = useState<ColorTheme>(colorThemes[0]);
    const lastColorIndex = useRef(0);

    // State for customizable app background
    const [appBackground, setAppBackground] = useState<string | null>(null);

    // State for modals, centralized here
    const [selectedUserForModal, setSelectedUserForModal] = useState<User | null>(null);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isIcebreakerModalOpen, setIsIcebreakerModalOpen] = useState(false);
    const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
    const [isDatePlannerModalOpen, setIsDatePlannerModalOpen] = useState(false);
    const [usersForDatePlanning, setUsersForDatePlanning] = useState<[User, User] | null>(null);
    const [isMonetizationModalOpen, setIsMonetizationModalOpen] = useState(false);

    // New feature states
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [weeklyChallenge, setWeeklyChallenge] = useState<{ theme: string, prompt: string; isCompleted: boolean } | null>(null);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setIsLoading(true);
                const savedBackground = localStorage.getItem('appBackground');
                if (savedBackground) setAppBackground(savedBackground);

                const [
                    fetchedUsers, 
                    fetchedDatePosts, 
                    fetchedMessages, 
                    fetchedMatches,
                    fetchedSwipedLeftIds,
                ] = await Promise.all([
                    api.getUsers(), 
                    api.getDatePosts(), 
                    api.getMessages(),
                    api.getMatches(CURRENT_USER_ID),
                    api.getSwipedLeftIds(CURRENT_USER_ID)
                ]);
                setUsers(fetchedUsers);
                setDatePosts(fetchedDatePosts);
                setMessages(fetchedMessages);
                setMatches(fetchedMatches);
                setSwipedLeftIds(fetchedSwipedLeftIds);

            } catch (error) {
                showToast('Failed to load app data. Please refresh.', 'error');
            } finally {
                setIsLoading(false);
            }
        };

        if (isAuthenticated) {
            fetchInitialData();
             // Onboarding check
            const hasOnboarded = localStorage.getItem('hasOnboarded');
            if (!hasOnboarded) {
                setShowOnboarding(true);
            }
            // Weekly Challenge logic
            const today = new Date();
            const startOfYear = new Date(today.getFullYear(), 0, 1);
            const dayOfYear = Math.floor((today.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
            const weekOfYear = Math.ceil(dayOfYear / 7);
            
            const lastCompletionWeek = localStorage.getItem('weeklyChallengeCompletionWeek');
            const currentWeekString = `${today.getFullYear()}-${weekOfYear}`;

            const { theme, prompt } = WEEKLY_CHALLENGE_PROMPTS[weekOfYear % WEEKLY_CHALLENGE_PROMPTS.length];
            setWeeklyChallenge({ theme, prompt, isCompleted: currentWeekString === lastCompletionWeek });
        }
    }, [showToast, isAuthenticated]);

    useEffect(() => {
        let newIndex;
        do { newIndex = Math.floor(Math.random() * colorThemes.length); } 
        while (colorThemes.length > 1 && newIndex === lastColorIndex.current);
        lastColorIndex.current = newIndex;
        setActiveColorTheme(colorThemes[newIndex]);
    }, [currentView]);


    const currentUser = useMemo(() => users.find(u => u.id === CURRENT_USER_ID), [users]);

    const matchedUsers = useMemo(() => {
        return users.filter(user => matches.includes(user.id));
    }, [users, matches]);
    
    const sentMessageCount = useMemo(() => {
        if (!currentUser || currentUser.isPremium) return 0;
        return messages.filter(m => m.senderId === CURRENT_USER_ID).length;
    }, [messages, currentUser]);
    
    const FREE_MESSAGE_LIMIT = 20;

    const usersForSwiping = useMemo(() => {
        if (!currentUser) return [];
        return users.filter(u => {
            const isNotCurrentUser = u.id !== CURRENT_USER_ID;
            const isNotMatched = !matches.includes(u.id);
            const isNotSwipedLeft = !swipedLeftIds.includes(u.id);
            if (!currentUser.preferences) return isNotCurrentUser && isNotMatched && isNotSwipedLeft;
            
            const matchesGenderPref = currentUser.preferences.interestedIn.includes(u.gender);
            const matchesAgePref = u.age >= currentUser.preferences.ageRange.min && u.age <= currentUser.preferences.ageRange.max;
            
            return isNotCurrentUser && isNotMatched && isNotSwipedLeft && matchesGenderPref && matchesAgePref;
        });
    }, [users, matches, swipedLeftIds, currentUser]);
    
    const myDates = datePosts.filter(d => d.createdBy === CURRENT_USER_ID);
    
    const earnBadge = (badgeId: Badge['id']) => {
        const user = users.find(u => u.id === CURRENT_USER_ID);
        if (!user || user.earnedBadgeIds?.includes(badgeId)) {
            return;
        }

        showToast(`Badge Unlocked: ${BADGES[badgeId].name}!`, 'success');
        const updatedUser = { ...user, earnedBadgeIds: [...(user.earnedBadgeIds || []), badgeId] };
        api.updateUser(updatedUser).then(savedUser => {
            setUsers(prevUsers => prevUsers.map(u => u.id === CURRENT_USER_ID ? savedUser : u));
        });
    };

    const handleSwipe = async (userId: number, direction: 'left' | 'right') => {
        if (!currentUser) return;
        setLastSwipedUserId(userId);
        try {
            const { isMatch } = await api.recordSwipe(currentUser.id, userId, direction);
            if (direction === 'right') {
                if (isMatch) {
                    setMatches(prev => [...prev, userId]);
                    const matchedUser = users.find(u => u.id === userId);
                    showToast(`You matched with ${matchedUser?.name}!`, 'success');
                }
            } else {
                setSwipedLeftIds(prev => [...prev, userId]);
            }
        } catch (error) {
            showToast('Something went wrong with your swipe.', 'error');
        }
    };
    
    const handleRecall = async () => {
        if (!lastSwipedUserId || !currentUser) return;
        try {
            await api.recallSwipe(currentUser.id, lastSwipedUserId);
            setMatches(prev => prev.filter(id => id !== lastSwipedUserId));
            setSwipedLeftIds(prev => prev.filter(id => id !== lastSwipedUserId));
            const recalledUser = users.find(u => u.id === lastSwipedUserId);
            showToast(`Recalled ${recalledUser?.name || 'profile'}.`, 'info');
            setLastSwipedUserId(null);
        } catch (error) {
             showToast(`Failed to recall swipe.`, 'error');
        }
    };

    const handleToggleInterest = async (dateId: number) => {
        const post = datePosts.find(p => p.id === dateId);
        if (!post || !currentUser) return;
        
        const isInterested = post.applicants.includes(currentUser.id);
        const newApplicants = isInterested 
            ? post.applicants.filter(id => id !== currentUser.id)
            : [...post.applicants, currentUser.id];
            
        try {
            const updatedPost = await api.updateDatePost({ ...post, applicants: newApplicants });
            setDatePosts(prev => prev.map(p => p.id === dateId ? updatedPost : p));
            const message = isInterested ? "You are no longer interested in this date." : "You've expressed interest in this date!";
            showToast(message, isInterested ? 'info' : 'success');
        } catch(error) {
            showToast('Failed to update interest.', 'error');
        }
    };

    const handleCreateDate = async (newDateData: Omit<DatePost, 'id' | 'createdBy' | 'applicants' | 'chosenApplicantId' | 'categories'>) => {
        if (!currentUser) return;

        showToast('AI is categorizing your date...', 'info');
        try {
            const categories = await categorizeDatePost(newDateData.title, newDateData.description);
            const newDate = await api.createDate({ 
                ...newDateData,
                categories,
                createdBy: currentUser.id,
                applicants: [],
                chosenApplicantId: null
            });

            setDatePosts(prev => [newDate, ...prev]);
            showToast('Your date has been posted!', 'success');
            setCurrentView(View.Dates);

            // Badge Logic
            if (myDates.length === 0) earnBadge('first_date');
            if (myDates.length === 2) earnBadge('prolific_planner');
            const adventurousKeywords = ['hike', 'outdoor', 'adventure', 'explore', 'nature', 'mountain'];
            const dateText = `${newDateData.title.toLowerCase()} ${newDateData.description.toLowerCase()}`;
            if (adventurousKeywords.some(keyword => dateText.includes(keyword))) earnBadge('adventurous');
        } catch (error: any) {
            showToast(error.message || 'Failed to post date.', 'error');
        }
    };

    const handleDeleteDate = async (dateId: number) => {
        try {
            await api.deleteDatePost(dateId);
            setDatePosts(prevPosts => prevPosts.filter(post => post.id !== dateId));
            showToast('Date post has been deleted.', 'info');
        } catch (error) {
            showToast('Failed to delete date.', 'error');
        }
    };

    const handleChooseApplicant = async (dateId: number, applicantId: number) => {
        const post = datePosts.find(p => p.id === dateId);
        if (!post) return;
        try {
            const updatedPost = await api.updateDatePost({ ...post, chosenApplicantId: applicantId });
            setDatePosts(prevPosts => prevPosts.map(p => p.id === dateId ? updatedPost : p));
            const applicant = users.find(u => u.id === applicantId);
            showToast(`You've chosen ${applicant?.name} for your date!`, 'success');
        } catch(error) {
            showToast('Failed to choose applicant.', 'error');
        }
    };

    const handleUpdateProfile = async (updatedUser: User) => {
        try {
            const savedUser = await api.updateUser(updatedUser);
            setUsers(prevUsers => prevUsers.map(u => u.id === savedUser.id ? savedUser : u));
            showToast('Profile saved successfully!', 'success');
        } catch(error) {
            showToast('Failed to save profile.', 'error');
        }
    };

    const handleSendMessage = async (receiverId: number, text: string) => {
        if (!currentUser) return;
        if (!currentUser.isPremium && sentMessageCount >= FREE_MESSAGE_LIMIT) {
            handleOpenMonetizationModal();
            showToast(`You've used your ${FREE_MESSAGE_LIMIT} free messages. Upgrade to Premium for unlimited chat!`, 'info');
            return;
        }

        if (messages.filter(m => m.senderId === currentUser.id).length === 4) earnBadge('starter');
        
        try {
            const newMessage = await api.sendMessage(CURRENT_USER_ID, receiverId, text);
            setMessages(prev => [...prev, newMessage]);
        } catch (error) {
            showToast('Failed to send message.', 'error');
        }
    };
    
    const handleSetAppBackground = (background: string | null) => {
        setAppBackground(background);
        if (background) localStorage.setItem('appBackground', background);
        else localStorage.removeItem('appBackground');
    };
    
    const handleCompleteChallenge = () => {
        setCurrentView(View.Create);
        showToast('Let\'s create that date!', 'info');
        const today = new Date();
        const startOfYear = new Date(today.getFullYear(), 0, 1);
        const dayOfYear = Math.floor((today.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
        const weekOfYear = Math.ceil(dayOfYear / 7);
        localStorage.setItem('weeklyChallengeCompletionWeek', `${today.getFullYear()}-${weekOfYear}`);
        if (weeklyChallenge) setWeeklyChallenge({ ...weeklyChallenge, isCompleted: true });
    };

    // Modal Handlers
    const handleViewProfile = (user: User) => { setSelectedUserForModal(user); setIsProfileModalOpen(true); };
    const handleCloseProfile = () => { setIsProfileModalOpen(false); setTimeout(() => setSelectedUserForModal(null), 300); };
    const handleGenerateIcebreakersFromProfile = (user: User) => { setIsProfileModalOpen(false); setSelectedUserForModal(user); setIsIcebreakerModalOpen(true); };
    const handleCloseIcebreakers = () => { setIsIcebreakerModalOpen(false); setTimeout(() => setSelectedUserForModal(null), 300); };
    const handleGetProfileFeedback = () => setIsFeedbackModalOpen(true);
    const handleCloseProfileFeedback = () => setIsFeedbackModalOpen(false);
    const handlePlanDate = (matchedUser: User) => { if (currentUser) { setUsersForDatePlanning([currentUser, matchedUser]); setIsDatePlannerModalOpen(true); } };
    const handleCloseDatePlanner = () => { setIsDatePlannerModalOpen(false); setTimeout(() => setUsersForDatePlanning(null), 300); };
    const handleOpenMonetizationModal = () => setIsMonetizationModalOpen(true);
    const handleCloseMonetizationModal = () => setIsMonetizationModalOpen(false);
    const handleUpgradeToPremium = async () => {
        // After server verifies payment, refresh the current user from DB
        try {
            const refreshedUsers = await api.getUsers();
            setUsers(refreshedUsers);
            showToast('Congratulations! You are now a Create-A-Date Premium member.', 'success');
        } catch (e) {
            // Fallback: keep UI as-is; user flag will reflect on next refresh
        } finally {
            handleCloseMonetizationModal();
        }
    };
    const handleOnboardingComplete = () => { localStorage.setItem('hasOnboarded', 'true'); setShowOnboarding(false); };

    const handleSignOut = () => { setIsAuthenticated(false); setCurrentView(View.Swipe); showToast("You've been signed out.", "info"); };

    const renderView = () => {
        if (isLoading) return <div className="text-center pt-20 text-xl font-semibold">Loading Create-A-Date...</div>;
        if (!currentUser && !isLoading) return <div className="text-center text-red-500">Error: Could not load current user data. Please check your Supabase connection and ensure user with ID 1 exists.</div>;

        switch (currentView) {
            case View.Swipe:
                return <SwipeDeck users={usersForSwiping} currentUser={currentUser} onSwipe={handleSwipe} onRecall={handleRecall} canRecall={!!lastSwipedUserId} isLoading={isLoading} onPremiumFeatureClick={handleOpenMonetizationModal} weeklyChallenge={weeklyChallenge} onCompleteChallenge={handleCompleteChallenge} />;
            case View.Dates:
                return <DateMarketplace datePosts={datePosts} allUsers={users} onToggleInterest={handleToggleInterest} currentUserId={CURRENT_USER_ID} gender={currentUser?.gender} isLoading={isLoading} onViewProfile={handleViewProfile} activeColorTheme={activeColorTheme} />;
            case View.Create:
                return <CreateDateForm onCreateDate={handleCreateDate} currentUser={currentUser!} activeColorTheme={activeColorTheme} onPremiumFeatureClick={handleOpenMonetizationModal} />;
            case View.Matches:
                return <MatchesView matchedUsers={matchedUsers} currentUser={currentUser!} onViewProfile={handleViewProfile} onPlanDate={handlePlanDate} activeColorTheme={activeColorTheme} onPremiumFeatureClick={handleOpenMonetizationModal} />;
             case View.Chat:
                return <ChatView currentUser={currentUser!} matchedUsers={matchedUsers} allUsers={users} messages={messages} onSendMessage={handleSendMessage} onViewProfile={handleViewProfile} isChatDisabled={!currentUser?.isPremium && sentMessageCount >= FREE_MESSAGE_LIMIT} activeColorTheme={activeColorTheme} onPremiumFeatureClick={handleOpenMonetizationModal} />;
            case View.MyDates:
                return <MyDatesManager myDates={myDates} allUsers={users} onChooseApplicant={handleChooseApplicant} onDeleteDate={handleDeleteDate} gender={currentUser?.gender} onViewProfile={handleViewProfile} activeColorTheme={activeColorTheme} />;
            case View.Profile:
                return <ProfileSettings currentUser={currentUser!} onSave={handleUpdateProfile} onGetFeedback={handleGetProfileFeedback} activeColorTheme={activeColorTheme} onSignOut={handleSignOut} onPremiumFeatureClick={handleOpenMonetizationModal} onSetAppBackground={handleSetAppBackground} />;
            case View.Admin:
                if (!currentUser?.isAdmin && currentUser?.id?.toString() !== (process.env.ADMIN_USER_ID || '')) {
                    return <div className="text-center text-red-500">Access denied.</div>;
                }
                return <AdminStats />;
            default:
                return <SwipeDeck users={usersForSwiping} currentUser={currentUser} onSwipe={handleSwipe} onRecall={handleRecall} canRecall={!!lastSwipedUserId} isLoading={isLoading} onPremiumFeatureClick={handleOpenMonetizationModal} weeklyChallenge={weeklyChallenge} onCompleteChallenge={handleCompleteChallenge}/>;
        }
    };

    if (!isAuthenticated) {
        return <Auth onAuthSuccess={() => setIsAuthenticated(true)} />;
    }

    return (
        <div 
             className="min-h-screen font-sans bg-cover bg-center bg-fixed" 
             style={{ backgroundImage: appBackground ? `linear-gradient(rgba(18, 18, 18, 0.7), rgba(18, 18, 18, 0.7)), url(${appBackground})` : 'none', backgroundColor: '#121212' }}
        >
            {showOnboarding && <OnboardingGuide onFinish={handleOnboardingComplete} />}
            <Header 
                currentView={currentView} 
                setCurrentView={setCurrentView} 
                activeColorTheme={activeColorTheme}
                isAdmin={currentUser?.isAdmin || (currentUser?.id?.toString() === (process.env.ADMIN_USER_ID || ''))}
            />
            <main className="pt-28 pb-10 px-4 container mx-auto">
                {renderView()}
            </main>
            {isProfileModalOpen && <ProfileModal user={selectedUserForModal} onClose={handleCloseProfile} onGenerateIcebreakers={handleGenerateIcebreakersFromProfile} gender={currentUser?.gender} />}
            {isIcebreakerModalOpen && <IcebreakerModal user={selectedUserForModal} onClose={handleCloseIcebreakers} gender={currentUser?.gender} onSendIcebreaker={(message) => { if(selectedUserForModal) { handleSendMessage(selectedUserForModal.id, message); handleCloseIcebreakers(); setCurrentView(View.Chat); } }} />}
            {isFeedbackModalOpen && <ProfileFeedbackModal user={currentUser!} onClose={handleCloseProfileFeedback} gender={currentUser?.gender}/>}
            {isDatePlannerModalOpen && <DatePlannerModal users={usersForDatePlanning} onClose={handleCloseDatePlanner} gender={currentUser?.gender}/>}
            {isMonetizationModalOpen && <MonetizationModal onClose={handleCloseMonetizationModal} onUpgrade={handleUpgradeToPremium} />}
        </div>
    );
};

const App: React.FC = () => (
    <ToastProvider>
        <MainApp />
    </ToastProvider>
);

export default App;