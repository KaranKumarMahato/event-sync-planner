
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
         eachDayOfInterval, isSameMonth, isSameDay, parseISO, addDays } from 'date-fns';
import { Calendar, Users, Bell, PlusCircle, UserCheck, ChevronLeft, ChevronRight, 
         MessageSquare, Check, X, Info, MapPin, Clock } from 'lucide-react';

// Mock data for our application
const MOCK_USERS = [
  { id: 1, name: 'Alex Johnson', avatar: 'https://randomuser.me/api/portraits/men/32.jpg', status: 'online' },
  { id: 2, name: 'Jamie Smith', avatar: 'https://randomuser.me/api/portraits/women/44.jpg', status: 'online' },
  { id: 3, name: 'Taylor Brown', avatar: 'https://randomuser.me/api/portraits/women/17.jpg', status: 'offline' },
  { id: 4, name: 'Jordan Garcia', avatar: 'https://randomuser.me/api/portraits/men/91.jpg', status: 'online' },
  { id: 5, name: 'Casey Wilson', avatar: 'https://randomuser.me/api/portraits/women/68.jpg', status: 'offline' },
];

const MOCK_EVENTS = [
  { 
    id: 1, 
    title: 'Team Building Workshop', 
    description: 'Join us for a fun team building workshop with activities and snacks!',
    date: '2025-05-15T14:00:00', 
    location: 'Central Park',
    image: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    creator: 1,
    attendees: [1, 2, 4],
    comments: [
      { id: 1, userId: 2, text: 'Looking forward to this!', timestamp: '2025-05-01T08:23:00' },
      { id: 2, userId: 4, text: 'Should I bring anything?', timestamp: '2025-05-01T10:45:00' }
    ]
  },
  { 
    id: 2, 
    title: 'Product Launch Party', 
    description: 'Celebrating our newest product launch with drinks and networking.',
    date: '2025-05-20T18:00:00', 
    location: 'Skyline Rooftop',
    image: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    creator: 2,
    attendees: [1, 2, 3, 5],
    comments: [
      { id: 3, userId: 1, text: 'This sounds amazing!', timestamp: '2025-05-02T14:12:00' },
      { id: 4, userId: 5, text: 'Is there a dress code?', timestamp: '2025-05-02T16:30:00' },
      { id: 5, userId: 3, text: 'I can help with setup if needed.', timestamp: '2025-05-03T09:45:00' }
    ]
  },
  { 
    id: 3, 
    title: 'Monthly Planning Session', 
    description: 'Review our monthly goals and plan for the upcoming quarter.',
    date: '2025-05-08T10:00:00', 
    location: 'Conference Room A',
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    creator: 3,
    attendees: [1, 3, 4],
    comments: []
  },
  { 
    id: 4, 
    title: 'Happy Hour', 
    description: 'Unwind with colleagues after a productive week.',
    date: '2025-05-10T17:30:00', 
    location: 'Downtown Brewery',
    image: 'https://images.unsplash.com/photo-1575444758702-4a6b9222336e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    creator: 4,
    attendees: [2, 4],
    comments: []
  },
];

// Type definitions
interface User {
  id: number;
  name: string;
  avatar: string;
  status: 'online' | 'offline';
}

interface Comment {
  id: number;
  userId: number;
  text: string;
  timestamp: string;
}

interface Event {
  id: number;
  title: string;
  description: string;
  date: string;
  location: string;
  image: string;
  creator: number;
  attendees: number[];
  comments: Comment[];
}

const Index = () => {
  // State management
  const [currentUser, setCurrentUser] = useState<User>(MOCK_USERS[0]);
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [events, setEvents] = useState<Event[]>(MOCK_EVENTS);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<'dashboard' | 'calendar' | 'suggestions'>('dashboard');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalType, setModalType] = useState<'eventDetails' | 'newEvent' | 'profile'>('eventDetails');
  const [newEventData, setNewEventData] = useState<Partial<Event>>({
    title: '',
    description: '',
    date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    location: '',
    creator: currentUser.id,
    attendees: [currentUser.id],
    comments: [],
  });
  const [notification, setNotification] = useState<{ show: boolean, message: string }>({ show: false, message: '' });
  const [comment, setComment] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);

  // Helper functions
  const getUserById = (id: number) => {
    return users.find(user => user.id === id) || MOCK_USERS[0];
  };

  const formatEventDate = (dateString: string) => {
    const date = parseISO(dateString);
    return format(date, 'EEEE, MMMM d, yyyy h:mm a');
  };

  const handleShowNotification = (message: string) => {
    setNotification({ show: true, message });
    setTimeout(() => {
      setNotification({ show: false, message: '' });
    }, 3000);
  };

  const getEventsByDate = (date: Date) => {
    return events.filter(event => 
      isSameDay(parseISO(event.date), date)
    );
  };

  // Event handlers
  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleDateClick = (day: Date) => {
    setSelectedDate(day);
    const dayEvents = getEventsByDate(day);
    if (dayEvents.length > 0) {
      setSelectedEvent(dayEvents[0]);
      setModalType('eventDetails');
      setShowModal(true);
    }
  };

  const handleRSVP = (event: Event, attending: boolean) => {
    setEvents(events.map(e => {
      if (e.id === event.id) {
        const attendees = attending 
          ? [...e.attendees, currentUser.id]
          : e.attendees.filter(id => id !== currentUser.id);
        
        return { ...e, attendees };
      }
      return e;
    }));
    
    handleShowNotification(attending ? 'RSVP confirmed!' : 'RSVP canceled');
  };

  const handleAddComment = (event: Event) => {
    if (!comment.trim()) return;
    
    const newComment = {
      id: Math.max(0, ...event.comments.map(c => c.id)) + 1,
      userId: currentUser.id,
      text: comment,
      timestamp: new Date().toISOString(),
    };
    
    setEvents(events.map(e => {
      if (e.id === event.id) {
        return { ...e, comments: [...e.comments, newComment] };
      }
      return e;
    }));
    
    setComment('');
    setIsTyping(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewEventData({
      ...newEventData,
      [name]: value,
    });
  };

  const handleCreateEvent = () => {
    if (!newEventData.title || !newEventData.date || !newEventData.location) {
      handleShowNotification('Please fill in all required fields');
      return;
    }
    
    const newEvent: Event = {
      id: Math.max(0, ...events.map(e => e.id)) + 1,
      title: newEventData.title || '',
      description: newEventData.description || '',
      date: newEventData.date || new Date().toISOString(),
      location: newEventData.location || '',
      image: `https://source.unsplash.com/random/800x600?event&sig=${Math.random()}`,
      creator: currentUser.id,
      attendees: [currentUser.id],
      comments: [],
    };
    
    setEvents([...events, newEvent]);
    setNewEventData({
      title: '',
      description: '',
      date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      location: '',
      creator: currentUser.id,
      attendees: [currentUser.id],
      comments: [],
    });
    setShowModal(false);
    handleShowNotification('Event created successfully!');
  };
  
  // Rendering functions for calendar
  const renderCalendarHeader = () => {
    return (
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <div className="flex space-x-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handlePrevMonth}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <ChevronLeft size={16} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleNextMonth}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <ChevronRight size={16} />
          </motion.button>
        </div>
      </div>
    );
  };

  const renderCalendarDays = () => {
    const dateFormat = 'EEEEEE';
    const days = [];
    const startDate = startOfWeek(currentMonth);

    for (let i = 0; i < 7; i++) {
      days.push(
        <div key={i} className="font-medium text-center text-xs text-gray-500">
          {format(addDays(startDate, i), dateFormat)}
        </div>
      );
    }

    return <div className="grid grid-cols-7 gap-1 mb-2">{days}</div>;
  };

  const renderCalendarCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const dateFormat = 'd';
    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = '';

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, dateFormat);
        const cloneDay = day;
        const dayEvents = getEventsByDate(day);
        days.push(
          <motion.div
            key={day.toString()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`relative p-2 min-h-[60px] border rounded-lg ${
              !isSameMonth(day, monthStart)
                ? 'text-gray-300'
                : isSameDay(day, selectedDate)
                ? 'bg-purple-100 border-purple-300'
                : ''
            } ${dayEvents.length ? 'cursor-pointer' : ''}`}
            onClick={() => handleDateClick(cloneDay)}
          >
            <span className={`text-sm ${isSameDay(day, new Date()) ? 'font-bold text-purple-600' : ''}`}>{formattedDate}</span>
            {dayEvents.length > 0 && (
              <div className="mt-1 absolute bottom-1 left-1 right-1">
                {dayEvents.map((event, index) => (
                  index < 2 ? (
                    <div 
                      key={event.id}
                      className="text-xs p-1 mb-1 truncate rounded bg-purple-200 text-purple-800"
                    >
                      {event.title}
                    </div>
                  ) : index === 2 ? (
                    <div key={`more-${day}`} className="text-xs text-center text-purple-600">
                      +{dayEvents.length - 2} more
                    </div>
                  ) : null
                ))}
              </div>
            )}
          </motion.div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div key={day.toString()} className="grid grid-cols-7 gap-1 mb-1">
          {days}
        </div>
      );
      days = [];
    }
    return <div>{rows}</div>;
  };

  // Main application layout
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header/Navigation */}
      <header className="bg-white border-b border-gray-200 py-4 px-6 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <motion.div 
                initial={{ rotate: -10 }}
                animate={{ rotate: 0 }}
                className="text-purple-600 mr-3"
              >
                <Calendar size={28} />
              </motion.div>
              <h1 className="text-xl font-bold text-gray-900">EventSync</h1>
            </div>
            <div className="flex items-center space-x-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative cursor-pointer"
              >
                <Bell size={20} className="text-gray-600" />
                <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-red-500"></span>
              </motion.div>
              <motion.div 
                whileHover={{ scale: 1.05 }}
                onClick={() => {
                  setModalType('profile');
                  setShowModal(true);
                }}
                className="flex items-center space-x-2 cursor-pointer"
              >
                <div className="relative">
                  <img 
                    src={currentUser.avatar} 
                    alt={currentUser.name} 
                    className="w-8 h-8 rounded-full" 
                  />
                  <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ${
                    currentUser.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                  } border-2 border-white`}></span>
                </div>
                <span className="text-sm font-medium text-gray-700 hidden md:block">{currentUser.name}</span>
              </motion.div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6">
          {/* Tabs */}
          <div className="flex items-center space-x-6 border-b border-gray-200 pb-4 mb-6">
            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ y: 0 }}
              className={`flex items-center px-1 py-2 text-sm font-medium ${
                activeTab === 'dashboard'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('dashboard')}
            >
              <Users size={18} className="mr-2" />
              Dashboard
            </motion.button>
            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ y: 0 }}
              className={`flex items-center px-1 py-2 text-sm font-medium ${
                activeTab === 'calendar'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('calendar')}
            >
              <Calendar size={18} className="mr-2" />
              Calendar
            </motion.button>
            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ y: 0 }}
              className={`flex items-center px-1 py-2 text-sm font-medium ${
                activeTab === 'suggestions'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('suggestions')}
            >
              <MessageSquare size={18} className="mr-2" />
              Suggestions
            </motion.button>
            <div className="flex-grow"></div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700"
              onClick={() => {
                setModalType('newEvent');
                setShowModal(true);
              }}
            >
              <PlusCircle size={18} className="mr-2" />
              New Event
            </motion.button>
          </div>

          {/* Tab content */}
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Upcoming Events</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {events
                      .filter(event => new Date(event.date) >= new Date())
                      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                      .slice(0, 3)
                      .map(event => (
                        <motion.div
                          key={event.id}
                          whileHover={{ y: -5, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                          className="bg-white rounded-lg overflow-hidden shadow"
                        >
                          <div className="h-40 overflow-hidden">
                            <img 
                              src={event.image} 
                              alt={event.title} 
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="p-4">
                            <h3 className="text-lg font-bold text-gray-900 mb-2">{event.title}</h3>
                            <div className="flex items-center text-gray-600 mb-2">
                              <Clock size={16} className="mr-2" />
                              <span className="text-sm">
                                {formatEventDate(event.date)}
                              </span>
                            </div>
                            <div className="flex items-center text-gray-600 mb-4">
                              <MapPin size={16} className="mr-2" />
                              <span className="text-sm">{event.location}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex -space-x-2">
                                {event.attendees.slice(0, 3).map(attendeeId => {
                                  const attendee = getUserById(attendeeId);
                                  return (
                                    <div key={attendeeId} className="w-8 h-8 rounded-full border-2 border-white overflow-hidden">
                                      <img 
                                        src={attendee.avatar} 
                                        alt={attendee.name} 
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                  );
                                })}
                                {event.attendees.length > 3 && (
                                  <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center">
                                    <span className="text-xs text-gray-600 font-medium">+{event.attendees.length - 3}</span>
                                  </div>
                                )}
                              </div>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="text-sm font-medium text-purple-600"
                                onClick={() => {
                                  setSelectedEvent(event);
                                  setModalType('eventDetails');
                                  setShowModal(true);
                                }}
                              >
                                Details
                              </motion.button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <div className="bg-white p-5 rounded-lg shadow mb-6">
                      <h2 className="text-xl font-bold text-gray-900 mb-4">This Week's Activities</h2>
                      <div className="space-y-4">
                        {events
                          .filter(event => {
                            const eventDate = new Date(event.date);
                            const now = new Date();
                            const sevenDaysLater = addDays(now, 7);
                            return eventDate >= now && eventDate <= sevenDaysLater;
                          })
                          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                          .map(event => {
                            const isAttending = event.attendees.includes(currentUser.id);
                            return (
                              <div key={event.id} className="flex items-center border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mr-4">
                                  <Calendar size={18} className="text-purple-600" />
                                </div>
                                <div className="flex-grow">
                                  <h3 className="text-md font-medium text-gray-900">{event.title}</h3>
                                  <p className="text-sm text-gray-600">
                                    {format(parseISO(event.date), 'EEE, MMM d • h:mm a')} • {event.location}
                                  </p>
                                </div>
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                                    isAttending 
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-gray-100 text-gray-700 hover:bg-purple-100 hover:text-purple-700'
                                  }`}
                                  onClick={() => handleRSVP(event, !isAttending)}
                                >
                                  {isAttending ? 'Going' : 'RSVP'}
                                </motion.button>
                              </div>
                            );
                          })}
                          {events.filter(event => {
                            const eventDate = new Date(event.date);
                            const now = new Date();
                            const sevenDaysLater = addDays(now, 7);
                            return eventDate >= now && eventDate <= sevenDaysLater;
                          }).length === 0 && (
                            <div className="flex flex-col items-center justify-center text-center py-8">
                              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                                <Calendar size={24} className="text-gray-400" />
                              </div>
                              <h3 className="text-lg font-medium text-gray-700 mb-1">No events this week</h3>
                              <p className="text-sm text-gray-500">Time to plan something fun!</p>
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="bg-white p-5 rounded-lg shadow">
                      <h2 className="text-xl font-bold text-gray-900 mb-4">People</h2>
                      <div className="space-y-4">
                        {users.filter(user => user.id !== currentUser.id).map(user => (
                          <div key={user.id} className="flex items-center">
                            <div className="relative mr-3">
                              <img 
                                src={user.avatar} 
                                alt={user.name} 
                                className="w-10 h-10 rounded-full"
                              />
                              <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ${
                                user.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                              } border-2 border-white`}></span>
                            </div>
                            <div className="flex-grow">
                              <h3 className="text-sm font-medium text-gray-900">{user.name}</h3>
                              <p className="text-xs text-gray-500 capitalize">{user.status}</p>
                            </div>
                            <button className="text-xs text-gray-500">View</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'calendar' && (
              <motion.div
                key="calendar"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <div className="bg-white p-6 rounded-lg shadow">
                  {renderCalendarHeader()}
                  {renderCalendarDays()}
                  {renderCalendarCells()}
                </div>
              </motion.div>
            )}

            {activeTab === 'suggestions' && (
              <motion.div
                key="suggestions"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="bg-white p-6 rounded-lg shadow">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Suggest an Event</h2>
                  <p className="text-gray-600 mb-6">Have an idea for a group activity? Suggest it below and get feedback from others!</p>
                  
                  <form className="space-y-4">
                    <div>
                      <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Event Title</label>
                      <input
                        type="text"
                        id="title"
                        name="title"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Give your event a catchy name"
                        value={newEventData.title}
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
                        <input
                          type="datetime-local"
                          id="date"
                          name="date"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          value={newEventData.date}
                          onChange={handleInputChange}
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                        <input
                          type="text"
                          id="location"
                          name="location"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Where will it be held?"
                          value={newEventData.location}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        id="description"
                        name="description"
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Tell everyone what this event is about..."
                        value={newEventData.description}
                        onChange={handleInputChange}
                      ></textarea>
                    </div>
                    
                    <div className="flex justify-end">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        onClick={handleCreateEvent}
                        className="px-4 py-2 bg-purple-600 text-white font-medium rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                      >
                        Submit Suggestion
                      </motion.button>
                    </div>
                  </form>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Suggestions</h2>
                  <div className="space-y-4">
                    {events
                      .sort((a, b) => b.id - a.id)
                      .slice(0, 3)
                      .map(event => (
                        <motion.div
                          key={event.id}
                          initial={{ opacity: 0.8 }}
                          whileHover={{ opacity: 1, backgroundColor: '#F9FAFB' }}
                          className="flex items-start p-4 border rounded-lg"
                        >
                          <div className="flex-shrink-0 mr-4">
                            <img 
                              src={getUserById(event.creator).avatar} 
                              alt={getUserById(event.creator).name}
                              className="w-10 h-10 rounded-full" 
                            />
                          </div>
                          <div className="flex-grow">
                            <div className="flex items-baseline">
                              <h3 className="text-md font-medium text-gray-900">{event.title}</h3>
                              <span className="ml-2 text-xs text-gray-500">
                                suggested by {getUserById(event.creator).name}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                            <div className="flex items-center space-x-4 mt-3">
                              <div className="flex items-center text-xs text-gray-500">
                                <Calendar size={14} className="mr-1" />
                                {format(parseISO(event.date), 'MMM d, yyyy')}
                              </div>
                              <div className="flex items-center text-xs text-gray-500">
                                <Clock size={14} className="mr-1" />
                                {format(parseISO(event.date), 'h:mm a')}
                              </div>
                              <div className="flex items-center text-xs text-gray-500">
                                <MapPin size={14} className="mr-1" />
                                {event.location}
                              </div>
                            </div>
                            <div className="flex items-center justify-between mt-4">
                              <div className="flex items-center">
                                <UserCheck size={16} className="mr-1 text-gray-500" />
                                <span className="text-xs text-gray-500">
                                  {event.attendees.length} {event.attendees.length === 1 ? 'person' : 'people'} going
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                                    event.attendees.includes(currentUser.id)
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-gray-100 text-gray-700 hover:bg-purple-100 hover:text-purple-700'
                                  }`}
                                  onClick={() => handleRSVP(event, !event.attendees.includes(currentUser.id))}
                                >
                                  {event.attendees.includes(currentUser.id) ? 'Going' : 'RSVP'}
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium hover:bg-gray-200"
                                  onClick={() => {
                                    setSelectedEvent(event);
                                    setModalType('eventDetails');
                                    setShowModal(true);
                                  }}
                                >
                                  Details
                                </motion.button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-4 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center mb-4 md:mb-0">
              <motion.div 
                animate={{ rotate: [0, -10, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 5 }}
                className="text-purple-600 mr-2"
              >
                <Calendar size={18} />
              </motion.div>
              <p className="text-sm text-gray-600">EventSync &copy; 2025</p>
            </div>
            <div className="flex items-center space-x-6">
              <a href="#" className="text-sm text-gray-600 hover:text-purple-600">About</a>
              <a href="#" className="text-sm text-gray-600 hover:text-purple-600">Privacy</a>
              <a href="#" className="text-sm text-gray-600 hover:text-purple-600">Terms</a>
              <a href="#" className="text-sm text-gray-600 hover:text-purple-600">Contact</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 overflow-y-auto"
          >
            <div className="flex min-h-screen items-center justify-center p-4 text-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="fixed inset-0 bg-black bg-opacity-50"
                onClick={() => setShowModal(false)}
              ></motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="relative bg-white rounded-lg shadow-xl w-full max-w-md md:max-w-lg transform overflow-hidden text-left p-6"
              >
                {modalType === 'eventDetails' && selectedEvent && (
                  <div>
                    <button
                      className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                      onClick={() => setShowModal(false)}
                    >
                      <X size={20} />
                    </button>
                    
                    <div className="mb-6">
                      <h2 className="text-2xl font-bold text-gray-900">{selectedEvent.title}</h2>
                      <div className="flex items-center mt-2 text-gray-600">
                        <Clock size={16} className="mr-2" />
                        <span className="text-sm">{formatEventDate(selectedEvent.date)}</span>
                      </div>
                      <div className="flex items-center mt-1 text-gray-600">
                        <MapPin size={16} className="mr-2" />
                        <span className="text-sm">{selectedEvent.location}</span>
                      </div>
                    </div>
                    
                    <div className="h-48 mb-6 rounded-lg overflow-hidden">
                      <img 
                        src={selectedEvent.image} 
                        alt={selectedEvent.title} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <div className="mb-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">About</h3>
                      <p className="text-gray-600">{selectedEvent.description}</p>
                    </div>
                    
                    <div className="mb-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-3">Attendees</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedEvent.attendees.map(attendeeId => {
                          const attendee = getUserById(attendeeId);
                          return (
                            <div key={attendeeId} className="flex items-center space-x-2 bg-gray-100 rounded-full px-3 py-1">
                              <div className="w-6 h-6 rounded-full overflow-hidden">
                                <img 
                                  src={attendee.avatar} 
                                  alt={attendee.name} 
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <span className="text-xs font-medium text-gray-700">{attendee.name}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-lg font-medium text-gray-900">Comments</h3>
                        <span className="text-xs text-gray-500">{selectedEvent.comments.length} comments</span>
                      </div>
                      
                      <div className="space-y-4 max-h-60 overflow-y-auto mb-4">
                        {selectedEvent.comments.map(comment => {
                          const commentUser = getUserById(comment.userId);
                          return (
                            <div key={comment.id} className="flex">
                              <div className="flex-shrink-0 mr-3">
                                <div className="w-8 h-8 rounded-full overflow-hidden">
                                  <img 
                                    src={commentUser.avatar} 
                                    alt={commentUser.name} 
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              </div>
                              <div className="flex-grow">
                                <div className="flex items-baseline">
                                  <span className="font-medium text-gray-900 text-sm">{commentUser.name}</span>
                                  <span className="ml-2 text-xs text-gray-500">
                                    {format(parseISO(comment.timestamp), 'MMM d, h:mm a')}
                                  </span>
                                </div>
                                <p className="text-gray-600 text-sm">{comment.text}</p>
                              </div>
                            </div>
                          );
                        })}
                        
                        {selectedEvent.comments.length === 0 && (
                          <div className="text-center py-6">
                            <MessageSquare size={24} className="mx-auto text-gray-400 mb-2" />
                            <p className="text-sm text-gray-500">No comments yet. Be the first to comment!</p>
                          </div>
                        )}
                      </div>
                      
                      {isTyping && (
                        <div className="px-3 py-1 text-xs text-gray-500 italic mb-2">
                          {currentUser.name} is typing...
                        </div>
                      )}
                      
                      <div className="flex items-center">
                        <div className="flex-shrink-0 mr-3">
                          <div className="w-8 h-8 rounded-full overflow-hidden">
                            <img 
                              src={currentUser.avatar} 
                              alt={currentUser.name} 
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                        <input
                          type="text"
                          className="flex-grow px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Add a comment..."
                          value={comment}
                          onChange={(e) => {
                            setComment(e.target.value);
                            if (e.target.value && !isTyping) setIsTyping(true);
                            if (!e.target.value) setIsTyping(false);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && comment.trim()) {
                              handleAddComment(selectedEvent);
                            }
                          }}
                        />
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-4 py-2 bg-purple-600 text-white rounded-r-md hover:bg-purple-700 focus:outline-none"
                          onClick={() => handleAddComment(selectedEvent)}
                          disabled={!comment.trim()}
                        >
                          Send
                        </motion.button>
                      </div>
                    </div>
                    
                    <div className="flex justify-between">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none"
                        onClick={() => setShowModal(false)}
                      >
                        Close
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`px-4 py-2 rounded-md ${
                          selectedEvent.attendees.includes(currentUser.id)
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        } focus:outline-none`}
                        onClick={() => {
                          handleRSVP(selectedEvent, !selectedEvent.attendees.includes(currentUser.id));
                          setShowModal(false);
                        }}
                      >
                        {selectedEvent.attendees.includes(currentUser.id) 
                          ? 'Cancel RSVP' 
                          : 'RSVP to Event'
                        }
                      </motion.button>
                    </div>
                  </div>
                )}
                
                {modalType === 'newEvent' && (
                  <div>
                    <button
                      className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                      onClick={() => setShowModal(false)}
                    >
                      <X size={20} />
                    </button>
                    
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Event</h2>
                    
                    <form className="space-y-4">
                      <div>
                        <label htmlFor="modal-title" className="block text-sm font-medium text-gray-700 mb-1">Event Title</label>
                        <input
                          type="text"
                          id="modal-title"
                          name="title"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Give your event a catchy name"
                          value={newEventData.title}
                          onChange={handleInputChange}
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="modal-date" className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
                        <input
                          type="datetime-local"
                          id="modal-date"
                          name="date"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          value={newEventData.date}
                          onChange={handleInputChange}
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="modal-location" className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                        <input
                          type="text"
                          id="modal-location"
                          name="location"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Where will it be held?"
                          value={newEventData.location}
                          onChange={handleInputChange}
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="modal-description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                          id="modal-description"
                          name="description"
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Tell everyone what this event is about..."
                          value={newEventData.description}
                          onChange={handleInputChange}
                        ></textarea>
                      </div>
                    </form>
                    
                    <div className="flex justify-end mt-6 space-x-3">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none"
                        onClick={() => setShowModal(false)}
                      >
                        Cancel
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleCreateEvent}
                        className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none"
                      >
                        Create Event
                      </motion.button>
                    </div>
                  </div>
                )}
                
                {modalType === 'profile' && (
                  <div>
                    <button
                      className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                      onClick={() => setShowModal(false)}
                    >
                      <X size={20} />
                    </button>
                    
                    <div className="flex flex-col items-center">
                      <div className="relative mb-4">
                        <img 
                          src={currentUser.avatar} 
                          alt={currentUser.name} 
                          className="w-24 h-24 rounded-full"
                        />
                        <span className={`absolute bottom-0 right-0 w-4 h-4 rounded-full ${
                          currentUser.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                        } border-2 border-white`}></span>
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-1">{currentUser.name}</h2>
                      <div className="flex items-center mb-6">
                        <span className={`w-2 h-2 rounded-full ${
                          currentUser.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                        } mr-2`}></span>
                        <span className="text-sm text-gray-600 capitalize">{currentUser.status}</span>
                      </div>
                      
                      <div className="w-full border-t border-gray-200 pt-4 mb-6">
                        <p className="text-gray-600 text-center">
                          Change your profile information or switch accounts
                        </p>
                      </div>
                      
                      <div className="w-full space-y-4">
                        <h3 className="text-lg font-medium text-gray-900">Switch Profile</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {users.map(user => (
                            <motion.button
                              key={user.id}
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.97 }}
                              onClick={() => {
                                setCurrentUser(user);
                                setShowModal(false);
                              }}
                              className={`flex items-center p-2 rounded-lg ${
                                currentUser.id === user.id
                                  ? 'bg-purple-100 border border-purple-300'
                                  : 'hover:bg-gray-100 border border-transparent'
                              }`}
                            >
                              <div className="relative mr-3">
                                <img 
                                  src={user.avatar} 
                                  alt={user.name} 
                                  className="w-8 h-8 rounded-full"
                                />
                                <span className={`absolute bottom-0 right-0 w-2 h-2 rounded-full ${
                                  user.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                                } border-1 border-white`}></span>
                              </div>
                              <div className="text-left">
                                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                                <p className="text-xs text-gray-500 capitalize">{user.status}</p>
                              </div>
                              {currentUser.id === user.id && (
                                <Check size={16} className="ml-auto text-purple-600" />
                              )}
                            </motion.button>
                          ))}
                        </div>
                      </div>
                      
                      <div className="w-full pt-4 mt-4">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none"
                          onClick={() => setShowModal(false)}
                        >
                          Close
                        </motion.button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notification Toast */}
      <AnimatePresence>
        {notification.show && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white px-4 py-3 rounded-lg shadow-lg flex items-center border-l-4 border-purple-600"
          >
            <Info size={18} className="mr-3 text-purple-600" />
            <p className="text-gray-700">{notification.message}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
