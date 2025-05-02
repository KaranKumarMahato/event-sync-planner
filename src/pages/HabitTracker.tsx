
"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, subDays, addDays, startOfWeek, addWeeks, subWeeks } from "date-fns";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// Define types for our application
type Habit = {
  id: string;
  name: string;
  icon: string;
  target: number;
  unit: string;
  streak: number;
  color: string;
  history: {
    date: string;
    value: number;
  }[];
};

type Reminder = {
  id: string;
  habitId: string;
  message: string;
  time: string;
  enabled: boolean;
};

type Stats = {
  sleepHours: number[];
  waterIntake: number[];
  screenTime: number[];
  dates: string[];
};

type User = {
  name: string;
  avatar: string;
  joinDate: string;
  level: number;
  streaks: {
    current: number;
    best: number;
  };
};

// Mock data for our application
const generateMockData = () => {
  const today = new Date();
  
  // Generate dates for the past 7 days
  const lastWeekDates = Array.from({ length: 7 }, (_, i) => 
    format(subDays(today, 6 - i), 'yyyy-MM-dd')
  );

  // Mock user data
  const user: User = {
    name: "Aryan Patel",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    joinDate: format(subDays(today, 30), 'yyyy-MM-dd'),
    level: 5,
    streaks: {
      current: 7,
      best: 14,
    },
  };

  // Mock habit data
  const habits: Habit[] = [
    {
      id: "1",
      name: "Sleep",
      icon: "🌙",
      target: 8,
      unit: "hours",
      streak: 5,
      color: "#6366F1",
      history: lastWeekDates.map((date, index) => ({
        date,
        value: 6.5 + Math.random() * 2.5,
      })),
    },
    {
      id: "2",
      name: "Water",
      icon: "💧",
      target: 8,
      unit: "glasses",
      streak: 7,
      color: "#3B82F6",
      history: lastWeekDates.map((date, index) => ({
        date,
        value: 5 + Math.floor(Math.random() * 4),
      })),
    },
    {
      id: "3",
      name: "Exercise",
      icon: "🏃‍♂️",
      target: 30,
      unit: "minutes",
      streak: 3,
      color: "#EF4444",
      history: lastWeekDates.map((date, index) => ({
        date,
        value: (index === 0 || index === 3) ? 0 : 15 + Math.floor(Math.random() * 30),
      })),
    },
    {
      id: "4",
      name: "Meditation",
      icon: "🧘‍♀️",
      target: 10,
      unit: "minutes",
      streak: 7,
      color: "#8B5CF6",
      history: lastWeekDates.map((date, index) => ({
        date,
        value: 5 + Math.floor(Math.random() * 10),
      })),
    },
    {
      id: "5",
      name: "Screen Time",
      icon: "📱",
      target: 120,
      unit: "minutes",
      streak: 0,
      color: "#EC4899",
      history: lastWeekDates.map((date, index) => ({
        date,
        value: 150 + Math.floor(Math.random() * 120),
      })),
    },
  ];

  // Mock reminders
  const reminders: Reminder[] = [
    {
      id: "1",
      habitId: "1",
      message: "Time to prepare for bed!",
      time: "22:00",
      enabled: true,
    },
    {
      id: "2",
      habitId: "2",
      message: "Drink a glass of water!",
      time: "09:00",
      enabled: true,
    },
    {
      id: "3",
      habitId: "2",
      message: "Stay hydrated, drink water!",
      time: "13:00",
      enabled: true,
    },
    {
      id: "4",
      habitId: "3",
      message: "Time for your daily exercise!",
      time: "17:00",
      enabled: false,
    },
    {
      id: "5",
      habitId: "4",
      message: "Take a moment to meditate",
      time: "07:00",
      enabled: true,
    },
  ];

  // Generate stats
  const stats: Stats = {
    sleepHours: lastWeekDates.map((_, i) => 6 + Math.random() * 3),
    waterIntake: lastWeekDates.map((_, i) => 5 + Math.floor(Math.random() * 4)),
    screenTime: lastWeekDates.map((_, i) => 120 + Math.floor(Math.random() * 180)),
    dates: lastWeekDates.map(date => format(new Date(date), 'EEE')),
  };

  return { user, habits, reminders, stats, currentDate: today };
};

// Main component for the Habit Tracker application
const HabitTracker: React.FC = () => {
  // State management
  const [mockData, setMockData] = useState(() => generateMockData());
  const [activeHabit, setActiveHabit] = useState<Habit | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'stats' | 'reminders'>('dashboard');
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalType, setModalType] = useState<'addHabit' | 'editHabit' | 'habitDetail' | 'settings' | 'addReminder'>('addHabit');
  const [weekOffset, setWeekOffset] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [newHabit, setNewHabit] = useState<Partial<Habit>>({
    name: '',
    icon: '📋',
    target: 1,
    unit: '',
    color: '#6366F1',
  });
  const [newReminder, setNewReminder] = useState<Partial<Reminder>>({
    habitId: '',
    message: '',
    time: '12:00',
    enabled: true,
  });
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [habitToDelete, setHabitToDelete] = useState<string | null>(null);
  
  // Calculate week range based on current offset
  const currentWeekStart = startOfWeek(addWeeks(new Date(), weekOffset));
  const weekRangeText = `${format(currentWeekStart, 'MMM d')} - ${format(addDays(currentWeekStart, 6), 'MMM d, yyyy')}`;
  
  // Handle showing toast notifications
  const handleShowToast = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  // Handle habit value change
  const handleHabitValueChange = (habitId: string, value: number) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    
    setMockData(prevData => {
      const updatedHabits = prevData.habits.map(habit => {
        if (habit.id === habitId) {
          // Find if there's already an entry for today
          const todayEntryIndex = habit.history.findIndex(entry => entry.date === today);
          let updatedHistory;
          
          if (todayEntryIndex >= 0) {
            // Update existing entry
            updatedHistory = habit.history.map((entry, index) => 
              index === todayEntryIndex ? { ...entry, value } : entry
            );
          } else {
            // Add new entry for today
            updatedHistory = [...habit.history, { date: today, value }];
          }
          
          // Update streak
          let streak = habit.streak;
          if (value >= habit.target) {
            streak += 1;
          } else {
            streak = 0;
          }
          
          return { ...habit, history: updatedHistory, streak };
        }
        return habit;
      });
      
      return { ...prevData, habits: updatedHabits };
    });
    
    handleShowToast(`Updated ${mockData.habits.find(h => h.id === habitId)?.name} value!`);
  };

  // Handle adding a new habit
  const handleAddHabit = () => {
    if (!newHabit.name || !newHabit.unit) {
      handleShowToast('Please fill in all required fields');
      return;
    }
    
    const lastWeekDates = Array.from({ length: 7 }, (_, i) => 
      format(subDays(new Date(), 6 - i), 'yyyy-MM-dd')
    );
    
    const newHabitObject: Habit = {
      id: Date.now().toString(),
      name: newHabit.name || 'New Habit',
      icon: newHabit.icon || '📋',
      target: newHabit.target || 1,
      unit: newHabit.unit || 'times',
      streak: 0,
      color: newHabit.color || '#6366F1',
      history: lastWeekDates.map(date => ({
        date,
        value: 0,
      })),
    };
    
    setMockData(prevData => ({
      ...prevData,
      habits: [...prevData.habits, newHabitObject],
    }));
    
    setNewHabit({
      name: '',
      icon: '📋',
      target: 1,
      unit: '',
      color: '#6366F1',
    });
    
    setShowModal(false);
    handleShowToast(`Added new habit: ${newHabitObject.name}`);
  };
  
  // Handle adding a new reminder
  const handleAddReminder = () => {
    if (!newReminder.habitId || !newReminder.message || !newReminder.time) {
      handleShowToast('Please fill in all required fields');
      return;
    }
    
    const newReminderObject: Reminder = {
      id: Date.now().toString(),
      habitId: newReminder.habitId || '',
      message: newReminder.message || '',
      time: newReminder.time || '12:00',
      enabled: newReminder.enabled !== undefined ? newReminder.enabled : true,
    };
    
    setMockData(prevData => ({
      ...prevData,
      reminders: [...prevData.reminders, newReminderObject],
    }));
    
    setNewReminder({
      habitId: '',
      message: '',
      time: '12:00',
      enabled: true,
    });
    
    setShowModal(false);
    handleShowToast('New reminder added');
  };

  // Handle toggling reminder status
  const handleToggleReminder = (reminderId: string) => {
    setMockData(prevData => ({
      ...prevData,
      reminders: prevData.reminders.map(reminder => 
        reminder.id === reminderId 
          ? { ...reminder, enabled: !reminder.enabled } 
          : reminder
      ),
    }));
    
    const reminder = mockData.reminders.find(r => r.id === reminderId);
    const status = reminder?.enabled ? 'disabled' : 'enabled';
    handleShowToast(`Reminder ${status}`);
  };

  // Handle deleting a habit
  const handleDeleteHabit = (habitId: string) => {
    setHabitToDelete(habitId);
    setShowConfirmation(true);
  };

  // Confirm habit deletion
  const confirmDeleteHabit = () => {
    if (!habitToDelete) return;
    
    setMockData(prevData => ({
      ...prevData,
      habits: prevData.habits.filter(habit => habit.id !== habitToDelete),
      reminders: prevData.reminders.filter(reminder => reminder.habitId !== habitToDelete),
    }));
    
    const habitName = mockData.habits.find(h => h.id === habitToDelete)?.name;
    setShowConfirmation(false);
    setHabitToDelete(null);
    handleShowToast(`Deleted habit: ${habitName}`);
  };

  // Toggle dark mode (simulated)
  const toggleDarkMode = () => {
    handleShowToast('Dark mode toggled');
    // In a real app, this would update a theme context or localStorage setting
  };

  // Calculate streak percentage
  const calculateStreakPercentage = (habit: Habit) => {
    let completed = 0;
    const lastSevenDays = habit.history.slice(-7);
    
    lastSevenDays.forEach(day => {
      if (day.value >= habit.target) {
        completed++;
      }
    });
    
    return Math.round((completed / 7) * 100);
  };

  // Format time for display
  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    return `${hour % 12 || 12}:${minutes} ${hour >= 12 ? 'PM' : 'AM'}`;
  };

  // Get detailed stats for a habit
  const getHabitStats = (habit: Habit) => {
    const totalValue = habit.history.reduce((sum, day) => sum + day.value, 0);
    const avgValue = totalValue / habit.history.length;
    const bestDay = habit.history.reduce((best, day) => day.value > best.value ? day : best, habit.history[0]);
    
    return {
      average: avgValue.toFixed(1),
      best: bestDay.value,
      bestDate: format(new Date(bestDay.date), 'MMM d'),
      streak: habit.streak,
      totalValue,
    };
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header/Navigation */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <motion.div 
                  initial={{ rotate: -10 }}
                  animate={{ rotate: 0 }}
                  className="text-indigo-600 text-2xl font-bold flex items-center"
                >
                  <span className="mr-2">📊</span>
                  HabitSync
                </motion.div>
              </div>
            </div>
            <div className="flex items-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setModalType('settings');
                  setShowModal(true);
                }}
                className="ml-3 p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </motion.button>
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="ml-3 relative flex items-center"
              >
                <div className="h-8 w-8 rounded-full overflow-hidden bg-gray-100 border border-gray-300">
                  <img 
                    src={mockData.user.avatar} 
                    alt="User Profile" 
                    className="h-full w-full object-cover"
                  />
                </div>
                <span className="ml-2 text-sm font-medium text-gray-700 hidden md:block">
                  {mockData.user.name}
                </span>
              </motion.div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* User Progress Summary */}
        <div className="px-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg overflow-hidden"
          >
            <div className="md:flex">
              <div className="p-8 md:w-2/3">
                <div className="flex items-center mb-4">
                  <h2 className="text-xl md:text-2xl font-bold text-white">Welcome back, {mockData.user.name}! </h2>
                  <div className="ml-4 px-2 py-1 bg-white/20 rounded-full text-xs font-semibold text-white">
                    Level {mockData.user.level}
                  </div>
                </div>
                <p className="text-indigo-100 mb-6">Your current streak is <span className="font-bold text-white">{mockData.user.streaks.current} days</span>. Keep going!</p>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-white/10 rounded-lg p-4">
                    <div className="text-sm text-indigo-100">Current streak</div>
                    <div className="text-2xl font-bold text-white flex items-center">
                      <span className="mr-2">🔥</span>
                      {mockData.user.streaks.current} days
                    </div>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4">
                    <div className="text-sm text-indigo-100">Best streak</div>
                    <div className="text-2xl font-bold text-white flex items-center">
                      <span className="mr-2">🏆</span>
                      {mockData.user.streaks.best} days
                    </div>
                  </div>
                </div>
                <div className="hidden md:block">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setModalType('addHabit');
                      setShowModal(true);
                    }}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add New Habit
                  </motion.button>
                </div>
              </div>
              <div className="md:w-1/3 bg-white/10 p-8 flex flex-col justify-center">
                <h3 className="text-lg font-semibold text-white mb-3">Daily Completion</h3>
                <div className="mb-2 flex justify-between text-xs text-indigo-100">
                  <span>Progress</span>
                  <span>
                    {mockData.habits.filter(h => 
                      h.history.some(day => 
                        day.date === format(new Date(), 'yyyy-MM-dd') && day.value >= h.target
                      )
                    ).length} / {mockData.habits.length}
                  </span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2.5 mb-4">
                  <div 
                    className="bg-white h-2.5 rounded-full" 
                    style={{ 
                      width: `${(mockData.habits.filter(h => 
                        h.history.some(day => 
                          day.date === format(new Date(), 'yyyy-MM-dd') && day.value >= h.target
                        )
                      ).length / mockData.habits.length) * 100}%` 
                    }}
                  ></div>
                </div>
                <div className="flex -space-x-2 overflow-hidden">
                  {mockData.habits.slice(0, 5).map(habit => (
                    <div 
                      key={habit.id}
                      className="inline-block h-8 w-8 rounded-full ring-2 ring-white flex items-center justify-center text-lg bg-white/20"
                      style={{ backgroundColor: `${habit.color}40` }}
                    >
                      {habit.icon}
                    </div>
                  ))}
                  {mockData.habits.length > 5 && (
                    <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-white/20 flex items-center justify-center text-sm font-medium text-white">
                      +{mockData.habits.length - 5}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-4 border-b border-gray-200 px-4">
          <div className="flex -mb-px space-x-8">
            <motion.button
              whileHover={{ scale: 1.03 }}
              onClick={() => setActiveTab('dashboard')}
              className={`${
                activeTab === 'dashboard'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Dashboard
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              onClick={() => setActiveTab('stats')}
              className={`${
                activeTab === 'stats'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Stats & Analytics
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              onClick={() => setActiveTab('reminders')}
              className={`${
                activeTab === 'reminders'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Reminders
            </motion.button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="px-4">
          <AnimatePresence mode="wait">
            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Week Navigation */}
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-900">Daily Check-ins</h2>
                  <div className="flex items-center space-x-2">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setWeekOffset(weekOffset - 1)}
                      className="p-1 rounded-full hover:bg-gray-200"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </motion.button>
                    <span className="text-sm font-medium text-gray-700">{weekRangeText}</span>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setWeekOffset(weekOffset + 1)}
                      className="p-1 rounded-full hover:bg-gray-200"
                      disabled={weekOffset >= 0}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${weekOffset >= 0 ? 'text-gray-300' : 'text-gray-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </motion.button>
                  </div>
                </div>

                {/* Habits List */}
                <div className="space-y-4">
                  {mockData.habits.map(habit => (
                    <motion.div
                      key={habit.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="bg-white rounded-lg shadow p-5"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <div 
                            className="h-10 w-10 rounded-full flex items-center justify-center text-xl"
                            style={{ backgroundColor: `${habit.color}20` }}
                          >
                            {habit.icon}
                          </div>
                          <div className="ml-3">
                            <h3 className="text-lg font-medium text-gray-900">{habit.name}</h3>
                            <p className="text-sm text-gray-500">Target: {habit.target} {habit.unit}/day</p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <div className="mr-4">
                            <div className="text-xs text-gray-500 mb-1">Streak</div>
                            <div className="flex items-center">
                              <span className="text-amber-500 mr-1">🔥</span>
                              <span className="font-semibold">{habit.streak} days</span>
                            </div>
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              setActiveHabit(habit);
                              setModalType('habitDetail');
                              setShowModal(true);
                            }}
                            className="text-gray-400 hover:text-gray-500"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </motion.button>
                        </div>
                      </div>
                      
                      {/* Progress Chart */}
                      <div className="mb-4 h-32">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={habit.history.slice(-7)}
                            margin={{
                              top: 5,
                              right: 0,
                              left: -20,
                              bottom: 5,
                            }}
                          >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis 
                              dataKey="date" 
                              tickFormatter={(date) => format(new Date(date), 'EEE')} 
                              axisLine={false}
                              tickLine={false}
                            />
                            <YAxis hide domain={[0, Math.max(habit.target * 1.5, ...habit.history.map(h => h.value))]} />
                            <Tooltip
                              formatter={(value) => [`${value} ${habit.unit}`, habit.name]}
                              labelFormatter={(label) => format(new Date(label), 'MMM d, yyyy')}
                            />
                            <Bar 
                              dataKey="value" 
                              fill={habit.color} 
                              radius={[4, 4, 0, 0]}
                              // Add a conditional fill based on target
                              isAnimationActive={false}
                            >
                              {habit.history.slice(-7).map((entry, index) => (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={entry.value >= habit.target ? habit.color : '#E5E7EB'} 
                                />
                              ))}
                            </Bar>
                            {/* Target line */}
                            <ReferenceLine 
                              y={habit.target} 
                              stroke="#9CA3AF" 
                              strokeDasharray="3 3" 
                              label={{ 
                                position: 'right', 
                                value: 'Target', 
                                fill: '#9CA3AF',
                                fontSize: 10
                              }} 
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      
                      {/* Check-in for today */}
                      <div>
                        <div className="flex justify-between mb-2">
                          <div className="text-sm font-medium text-gray-700">Today's Progress</div>
                          <div className="text-sm text-gray-500">
                            {(() => {
                              const today = format(new Date(), 'yyyy-MM-dd');
                              const todayEntry = habit.history.find(entry => entry.date === today);
                              return todayEntry ? `${todayEntry.value} / ${habit.target} ${habit.unit}` : `0 / ${habit.target} ${habit.unit}`;
                            })()}
                          </div>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max={habit.target * 2}
                          step={habit.unit === 'minutes' ? 5 : 0.5}
                          value={(() => {
                            const today = format(new Date(), 'yyyy-MM-dd');
                            const todayEntry = habit.history.find(entry => entry.date === today);
                            return todayEntry ? todayEntry.value : 0;
                          })()}
                          onChange={e => handleHabitValueChange(habit.id, parseFloat(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>0</span>
                          <span>{habit.target}</span>
                          <span>{habit.target * 2}</span>
                        </div>
                      </div>
                      
                      {/* Quick Actions */}
                      <div className="flex justify-end mt-4 space-x-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleHabitValueChange(habit.id, habit.target)}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full bg-indigo-100 text-indigo-700 hover:bg-indigo-200 focus:outline-none"
                        >
                          Mark Complete
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleHabitValueChange(habit.id, 0)}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-full bg-white text-gray-700 hover:bg-gray-50 focus:outline-none"
                        >
                          Skip Today
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Add Habit Button (Mobile) */}
                <div className="md:hidden fixed bottom-6 right-6">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      setModalType('addHabit');
                      setShowModal(true);
                    }}
                    className="h-14 w-14 rounded-full bg-indigo-600 text-white shadow-lg flex items-center justify-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* Stats & Analytics Tab */}
            {activeTab === 'stats' && (
              <motion.div
                key="stats"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Overview Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <motion.div
                    whileHover={{ y: -5 }}
                    className="bg-white rounded-lg shadow p-5"
                  >
                    <div className="text-sm font-medium text-gray-500 mb-1">Total Habits</div>
                    <div className="flex items-baseline">
                      <span className="text-3xl font-bold text-gray-900">{mockData.habits.length}</span>
                      <span className="ml-2 text-sm text-green-600">
                        Active tracking
                      </span>
                    </div>
                  </motion.div>
                  <motion.div
                    whileHover={{ y: -5 }}
                    className="bg-white rounded-lg shadow p-5"
                  >
                    <div className="text-sm font-medium text-gray-500 mb-1">Weekly Completion Rate</div>
                    <div className="flex items-baseline">
                      <span className="text-3xl font-bold text-gray-900">
                        {(() => {
                          let totalCompletions = 0;
                          let totalOpportunities = 0;
                          
                          mockData.habits.forEach(habit => {
                            habit.history.slice(-7).forEach(day => {
                              totalOpportunities++;
                              if (day.value >= habit.target) {
                                totalCompletions++;
                              }
                            });
                          });
                          
                          return Math.round((totalCompletions / totalOpportunities) * 100);
                        })()}%
                      </span>
                      <span className="ml-2 text-sm text-amber-600">
                        <span className="text-amber-500 mr-1">🔥</span>
                        Keep going!
                      </span>
                    </div>
                  </motion.div>
                  <motion.div
                    whileHover={{ y: -5 }}
                    className="bg-white rounded-lg shadow p-5"
                  >
                    <div className="text-sm font-medium text-gray-500 mb-1">Today's Progress</div>
                    <div className="flex items-baseline">
                      <span className="text-3xl font-bold text-gray-900">
                        {mockData.habits.filter(habit => {
                          const today = format(new Date(), 'yyyy-MM-dd');
                          const todayEntry = habit.history.find(entry => entry.date === today);
                          return todayEntry && todayEntry.value >= habit.target;
                        }).length} / {mockData.habits.length}
                      </span>
                      <span className="ml-2 text-sm text-indigo-600">
                        Habits completed
                      </span>
                    </div>
                  </motion.div>
                </div>
                
                {/* Weekly Overview Charts */}
                <div className="bg-white rounded-lg shadow p-5">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Weekly Overview</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={mockData.stats.dates.map((date, index) => ({
                          date,
                          sleep: mockData.stats.sleepHours[index],
                          water: mockData.stats.waterIntake[index],
                          screen: mockData.stats.screenTime[index] / 60, // convert to hours
                        }))}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 25,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis 
                          dataKey="date" 
                          axisLine={false}
                          tickLine={false}
                          padding={{ left: 10, right: 10 }}
                        />
                        <YAxis 
                          axisLine={false}
                          tickLine={false}
                          domain={[0, 'auto']}
                          tickCount={6}
                        />
                        <Tooltip />
                        <Legend verticalAlign="top" height={36} />
                        <Line
                          type="monotone"
                          dataKey="sleep"
                          name="Sleep (hours)"
                          stroke="#8B5CF6"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="water"
                          name="Water (glasses)"
                          stroke="#3B82F6"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="screen"
                          name="Screen Time (hours)"
                          stroke="#EC4899"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                {/* Habits Completion Rate */}
                <div className="bg-white rounded-lg shadow p-5">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Habit Completion Rates</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={mockData.habits.map(habit => ({
                              name: habit.name,
                              value: calculateStreakPercentage(habit),
                              color: habit.color,
                            }))}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {mockData.habits.map((habit, index) => (
                              <Cell key={`cell-${index}`} fill={habit.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [`${value}%`, 'Completion Rate']} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-4">
                      {mockData.habits.map(habit => {
                        const percentage = calculateStreakPercentage(habit);
                        return (
                          <div key={habit.id} className="space-y-2">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center">
                                <span className="mr-2">{habit.icon}</span>
                                <span className="font-medium">{habit.name}</span>
                              </div>
                              <span className="text-sm font-medium">{percentage}%</span>
                            </div>
                            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full rounded-full" 
                                style={{ 
                                  width: `${percentage}%`,
                                  backgroundColor: habit.color
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                
                {/* Individual Habit Stats */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Individual Habit Stats</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {mockData.habits.map(habit => {
                      const stats = getHabitStats(habit);
                      return (
                        <motion.div
                          key={habit.id}
                          whileHover={{ scale: 1.02 }}
                          className="bg-white rounded-lg shadow p-5"
                        >
                          <div className="flex items-center mb-4">
                            <div 
                              className="h-10 w-10 rounded-full flex items-center justify-center text-xl"
                              style={{ backgroundColor: `${habit.color}20` }}
                            >
                              {habit.icon}
                            </div>
                            <h4 className="ml-3 text-lg font-medium text-gray-900">{habit.name}</h4>
                          </div>
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">Average</span>
                              <span className="font-medium">{stats.average} {habit.unit}/day</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">Best Day</span>
                              <span className="font-medium">{stats.best} {habit.unit} ({stats.bestDate})</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">Current Streak</span>
                              <span className="font-medium flex items-center">
                                <span className="text-amber-500 mr-1">🔥</span> {stats.streak} days
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">7-Day Total</span>
                              <span className="font-medium">{stats.totalValue.toFixed(1)} {habit.unit}</span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Reminders Tab */}
            {activeTab === 'reminders' && (
              <motion.div
                key="reminders"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Reminders List */}
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Active Reminders</h3>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setModalType('addReminder');
                      setNewReminder({
                        habitId: mockData.habits?.[0]?.id,
                        message: '',
                        time: '12:00',
                        enabled: true,
                      });
                      setShowModal(true);
                    }}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Reminder
                  </motion.button>
                </div>
                
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <ul className="divide-y divide-gray-200">
                    {mockData.reminders.map((reminder) => {
                      const habit = mockData.habits.find(h => h.id === reminder.habitId);
                      return (
                        <motion.li
                          key={reminder.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.2 }}
                          className="p-4"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div 
                                className="h-10 w-10 rounded-full flex items-center justify-center text-xl"
                                style={{ backgroundColor: habit ? `${habit.color}20` : '#E5E7EB' }}
                              >
                                {habit?.icon || '⏰'}
                              </div>
                              <div className="ml-4">
                                <div className="flex items-center">
                                  <h4 className="text-sm font-medium text-gray-900">{reminder.message}</h4>
                                  {!reminder.enabled && (
                                    <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
                                      Disabled
                                    </span>
                                  )}
                                </div>
                                <div className="flex mt-1 space-x-2 text-xs text-gray-500">
                                  <span className="flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {formatTime(reminder.time)}
                                  </span>
                                  <span>•</span>
                                  <span>{habit?.name || 'Unknown Habit'}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleToggleReminder(reminder.id)}
                                className="relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                style={{
                                  backgroundColor: reminder.enabled ? '#4F46E5' : '#E5E7EB',
                                }}
                              >
                                <span className="sr-only">Toggle reminder</span>
                                <span
                                  aria-hidden="true"
                                  className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                                    reminder.enabled ? 'translate-x-5' : 'translate-x-0'
                                  }`}
                                />
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => {
                                  setMockData({
                                    ...mockData,
                                    reminders: mockData.reminders.filter(r => r.id !== reminder.id)
                                  });
                                  handleShowToast('Reminder deleted');
                                }}
                                className="text-gray-400 hover:text-gray-500"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </motion.button>
                            </div>
                          </div>
                        </motion.li>
                      );
                    })}
                  </ul>
                  {mockData.reminders.length === 0 && (
                    <div className="py-10 text-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No reminders</h3>
                      <p className="mt-1 text-sm text-gray-500">Get started by creating a new reminder.</p>
                      <div className="mt-6">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            setModalType('addReminder');
                            setShowModal(true);
                          }}
                          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          New Reminder
                        </motion.button>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Reminder Tips */}
                <div className="bg-indigo-50 rounded-lg p-5">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-indigo-800">About Reminders</h3>
                      <div className="mt-2 text-sm text-indigo-700">
                        <p>
                          Reminders help you stay on track with your habits. They'll appear as notifications at the scheduled time.
                          For optimal habit formation, set reminders at consistent times when you're most likely to complete your habits.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white mt-auto border-t border-gray-200">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 md:flex md:items-center md:justify-between lg:px-8">
          <div className="flex justify-center space-x-6 md:order-2">
            <a href="#" className="text-gray-400 hover:text-gray-500">
              <span className="sr-only">Help & FAQ</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </a>
            <a href="#" className="text-gray-400 hover:text-gray-500">
              <span className="sr-only">Terms of Service</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </a>
            <a href="#" className="text-gray-400 hover:text-gray-500">
              <span className="sr-only">Privacy Policy</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </a>
          </div>
          <div className="mt-8 md:mt-0 md:order-1">
            <p className="text-center text-sm text-gray-500">
              &copy; 2025 HabitSync. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 overflow-y-auto z-50"
          >
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={() => setShowModal(false)}></div>
              </div>

              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6"
              >
                {modalType === 'addHabit' && (
                  <>
                    <div className="sm:flex sm:items-start">
                      <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 sm:mx-0 sm:h-10 sm:w-10">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                      <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                          Add New Habit
                        </h3>
                        <div className="mt-2">
                          <p className="text-sm text-gray-500">
                            Create a new habit to track. Set a name, target, and choose an icon to represent it.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-5 space-y-4">
                      <div>
                        <label htmlFor="habitName" className="block text-sm font-medium text-gray-700">
                          Habit Name
                        </label>
                        <input
                          type="text"
                          name="habitName"
                          id="habitName"
                          value={newHabit.name}
                          onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          placeholder="e.g., Drink Water"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="habitTarget" className="block text-sm font-medium text-gray-700">
                            Daily Target
                          </label>
                          <input
                            type="number"
                            name="habitTarget"
                            id="habitTarget"
                            min="1"
                            step="0.5"
                            value={newHabit.target}
                            onChange={(e) => setNewHabit({ ...newHabit, target: parseFloat(e.target.value) })}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          />
                        </div>
                        <div>
                          <label htmlFor="habitUnit" className="block text-sm font-medium text-gray-700">
                            Unit
                          </label>
                          <input
                            type="text"
                            name="habitUnit"
                            id="habitUnit"
                            value={newHabit.unit}
                            onChange={(e) => setNewHabit({ ...newHabit, unit: e.target.value })}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder="e.g., glasses, minutes"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Icon
                        </label>
                        <div className="mt-1 grid grid-cols-8 gap-2">
                          {['💧', '🏃‍♂️', '🧘‍♀️', '📱', '🌙', '📚', '💊', '🥗', '🚰', '🏋️‍♀️'].map((icon) => (
                            <motion.button
                              key={icon}
                              whileHover={{ scale: 1.2 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => setNewHabit({ ...newHabit, icon })}
                              className={`h-10 w-10 flex items-center justify-center text-xl rounded-lg ${
                                newHabit.icon === icon ? 'bg-indigo-100 border-2 border-indigo-500' : 'bg-gray-100'
                              }`}
                            >
                              {icon}
                            </motion.button>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Color
                        </label>
                        <div className="mt-1 grid grid-cols-8 gap-2">
                          {['#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#EF4444', '#F97316', '#FBBF24', '#34D399'].map((color) => (
                            <motion.button
                              key={color}
                              whileHover={{ scale: 1.2 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => setNewHabit({ ...newHabit, color })}
                              className={`h-8 w-8 rounded-full ${
                                newHabit.color === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                              }`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3">
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        type="button"
                        onClick={() => setShowModal(false)}
                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0"
                      >
                        Cancel
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        type="button"
                        onClick={handleAddHabit}
                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none"
                      >
                        Add Habit
                      </motion.button>
                    </div>
                  </>
                )}

                {modalType === 'habitDetail' && activeHabit && (
                  <>
                    <div className="absolute top-0 right-0 pt-4 pr-4">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        type="button"
                        className="bg-white rounded-md text-gray-400 hover:text-gray-500"
                        onClick={() => setShowModal(false)}
                      >
                        <span className="sr-only">Close</span>
                        <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </motion.button>
                    </div>
                    <div className="sm:flex sm:items-start">
                      <div 
                        className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full sm:mx-0 sm:h-10 sm:w-10 text-xl"
                        style={{ backgroundColor: `${activeHabit.color}20` }}
                      >
                        {activeHabit.icon}
                      </div>
                      <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                          {activeHabit.name}
                        </h3>
                        <div className="mt-2">
                          <p className="text-sm text-gray-500">
                            Target: {activeHabit.target} {activeHabit.unit}/day
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-5">
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Stats</h4>
                        <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs text-gray-500">Current Streak</div>
                            <div className="text-lg font-semibold flex items-center">
                              <span className="text-amber-500 mr-1">🔥</span>
                              {activeHabit.streak} days
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Completion Rate</div>
                            <div className="text-lg font-semibold">
                              {calculateStreakPercentage(activeHabit)}%
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">7-Day Average</div>
                            <div className="text-lg font-semibold">
                              {(activeHabit.history.slice(-7).reduce((acc, day) => acc + day.value, 0) / 7).toFixed(1)} {activeHabit.unit}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Best Day</div>
                            <div className="text-lg font-semibold">
                              {Math.max(...activeHabit.history.map(day => day.value))} {activeHabit.unit}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">7-Day History</h4>
                        <div className="h-48">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={activeHabit.history.slice(-7)}
                              margin={{
                                top: 5,
                                right: 30,
                                left: 20,
                                bottom: 5,
                              }}
                            >
                              <CartesianGrid strokeDasharray="3 3" vertical={false} />
                              <XAxis 
                                dataKey="date" 
                                tickFormatter={(date) => format(new Date(date), 'EEE')}
                                axisLine={false}
                                tickLine={false} 
                              />
                              <YAxis
                                axisLine={false}
                                tickLine={false} 
                                domain={[0, Math.max(activeHabit.target * 1.5, ...activeHabit.history.map(h => h.value))]}
                              />
                              <Tooltip
                                formatter={(value) => [`${value} ${activeHabit.unit}`, activeHabit.name]}
                                labelFormatter={(label) => format(new Date(label), 'MMM d, yyyy')}
                              />
                              <Bar 
                                dataKey="value" 
                                fill={activeHabit.color}
                                radius={[4, 4, 0, 0]} 
                              >
                                {activeHabit.history.slice(-7).map((entry, index) => (
                                  <Cell 
                                    key={`cell-${index}`} 
                                    fill={entry.value >= activeHabit.target ? activeHabit.color : '#E5E7EB'} 
                                  />
                                ))}
                              </Bar>
                              <ReferenceLine 
                                y={activeHabit.target} 
                                stroke="#9CA3AF" 
                                strokeDasharray="3 3"
                                label={{ 
                                  position: 'right', 
                                  value: 'Target', 
                                  fill: '#9CA3AF',
                                  fontSize: 10 
                                }} 
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Reminders</h4>
                        <div className="space-y-2">
                          {mockData.reminders.filter(r => r.habitId === activeHabit.id).map(reminder => (
                            <div key={reminder.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                              <div className="flex items-center">
                                <span className="text-gray-600 mr-2">⏰</span>
                                <div>
                                  <div className="text-sm font-medium">{reminder.message}</div>
                                  <div className="text-xs text-gray-500">{formatTime(reminder.time)}</div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => handleToggleReminder(reminder.id)}
                                  className={`w-10 h-5 rounded-full ${reminder.enabled ? 'bg-indigo-600' : 'bg-gray-300'} relative transition-colors`}
                                >
                                  <div 
                                    className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full shadow transform transition-transform ${reminder.enabled ? 'translate-x-5' : ''}`}
                                  />
                                </motion.button>
                              </div>
                            </div>
                          ))}
                          {mockData.reminders.filter(r => r.habitId === activeHabit.id).length === 0 && (
                            <div className="text-center py-4 text-gray-500 text-sm">
                              No reminders set for this habit
                            </div>
                          )}
                          <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => {
                              setModalType('addReminder');
                              setNewReminder({
                                habitId: activeHabit.id,
                                message: `Time for your ${activeHabit.name.toLowerCase()}!`,
                                time: '12:00',
                                enabled: true,
                              });
                              setShowModal(true);
                            }}
                            className="mt-2 w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Add Reminder
                          </motion.button>
                        </div>
                      </div>
                    </div>
                    <div className="mt-5 flex justify-between">
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        type="button"
                        onClick={() => handleDeleteHabit(activeHabit.id)}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete Habit
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        type="button"
                        onClick={() => setShowModal(false)}
                        className="inline-flex justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Close
                      </motion.button>
                    </div>
                  </>
                )}

                {modalType === 'addReminder' && (
                  <>
                    <div className="sm:flex sm:items-start">
                      <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 sm:mx-0 sm:h-10 sm:w-10">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                          Add New Reminder
                        </h3>
                        <div className="mt-2">
                          <p className="text-sm text-gray-500">
                            Set up a reminder to help you stay on track with your habits.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-5 space-y-4">
                      <div>
                        <label htmlFor="reminderHabit" className="block text-sm font-medium text-gray-700">
                          Habit
                        </label>
                        <select
                          id="reminderHabit"
                          name="reminderHabit"
                          value={newReminder.habitId}
                          onChange={(e) => setNewReminder({ ...newReminder, habitId: e.target.value })}
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        >
                          <option value="">Select a habit</option>
                          {mockData.habits.map(habit => (
                            <option key={habit.id} value={habit.id}>
                              {habit.icon} {habit.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label htmlFor="reminderMessage" className="block text-sm font-medium text-gray-700">
                          Reminder Message
                        </label>
                        <input
                          type="text"
                          name="reminderMessage"
                          id="reminderMessage"
                          value={newReminder.message}
                          onChange={(e) => setNewReminder({ ...newReminder, message: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          placeholder="e.g., Time to drink water!"
                        />
                      </div>
                      <div>
                        <label htmlFor="reminderTime" className="block text-sm font-medium text-gray-700">
                          Time
                        </label>
                        <input
                          type="time"
                          name="reminderTime"
                          id="reminderTime"
                          value={newReminder.time}
                          onChange={(e) => setNewReminder({ ...newReminder, time: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>
                      <div className="flex items-center">
                        <input
                          id="reminderEnabled"
                          name="reminderEnabled"
                          type="checkbox"
                          checked={newReminder.enabled}
                          onChange={(e) => setNewReminder({ ...newReminder, enabled: e.target.checked })}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor="reminderEnabled" className="ml-2 block text-sm text-gray-900">
                          Enable reminder
                        </label>
                      </div>
                    </div>
                    <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3">
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        type="button"
                        onClick={() => setShowModal(false)}
                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0"
                      >
                        Cancel
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        type="button"
                        onClick={handleAddReminder}
                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none"
                      >
                        Add Reminder
                      </motion.button>
                    </div>
                  </>
                )}

                {modalType === 'settings' && (
                  <>
                    <div className="sm:flex sm:items-start">
                      <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 sm:mx-0 sm:h-10 sm:w-10">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                          Settings
                        </h3>
                        <div className="mt-2">
                          <p className="text-sm text-gray-500">
                            Adjust your app preferences and account settings.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-5 border-t border-gray-200 pt-5">
                      <div className="space-y-6">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">Theme Preferences</h4>
                          <div className="mt-4 space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="flex items-center text-sm text-gray-700">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                </svg>
                                Dark Mode
                              </span>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={toggleDarkMode}
                                className="relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 bg-gray-200"
                              >
                                <span className="sr-only">Toggle dark mode</span>
                                <span
                                  aria-hidden="true"
                                  className="translate-x-0 pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200"
                                />
                              </motion.button>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">Notification Preferences</h4>
                          <div className="mt-4 space-y-4">
                            <div className="flex items-center">
                              <input
                                id="pushNotifications"
                                name="pushNotifications"
                                type="checkbox"
                                defaultChecked
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                              />
                              <label htmlFor="pushNotifications" className="ml-3 text-sm text-gray-700">
                                Push notifications
                              </label>
                            </div>
                            <div className="flex items-center">
                              <input
                                id="emailNotifications"
                                name="emailNotifications"
                                type="checkbox"
                                defaultChecked
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                              />
                              <label htmlFor="emailNotifications" className="ml-3 text-sm text-gray-700">
                                Email notifications
                              </label>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">Privacy</h4>
                          <div className="mt-4 space-y-4">
                            <div className="flex items-center">
                              <input
                                id="dataCollection"
                                name="dataCollection"
                                type="checkbox"
                                defaultChecked
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                              />
                              <label htmlFor="dataCollection" className="ml-3 text-sm text-gray-700">
                                Allow anonymous usage data collection
                              </label>
                            </div>
                          </div>
                        </div>
                        
                        <div className="pt-5 border-t border-gray-200">
                          <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => {
                              handleShowToast('Account information updated');
                              setShowModal(false);
                            }}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
                          >
                            Save Preferences
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Dialog */}
      <AnimatePresence>
        {showConfirmation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 overflow-y-auto z-50"
          >
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={() => setShowConfirmation(false)}></div>
              </div>

              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6"
              >
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Delete Habit
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete this habit? All data associated with it will be permanently removed. This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={confirmDeleteHabit}
                  >
                    Delete
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm"
                    onClick={() => setShowConfirmation(false)}
                  >
                    Cancel
                  </motion.button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="fixed bottom-5 left-1/2 transform -translate-x-1/2 px-4 py-3 rounded-lg bg-gray-800 text-white shadow-lg z-50 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Custom Reference Line component for the charts
const ReferenceLine = (props) => {
  const { x, y, stroke, strokeDasharray, label } = props;
  return (
    <g>
      <line 
        x1="0%" 
        y1={y} 
        x2="100%" 
        y2={y} 
        stroke={stroke} 
        strokeDasharray={strokeDasharray} 
      />
      {label && (
        <text 
          x="98%" 
          y={y - 5} 
          textAnchor="end" 
          fill={label.fill} 
          fontSize={label.fontSize}
        >
          {label.value}
        </text>
      )}
    </g>
  );
};

export default HabitTracker;
