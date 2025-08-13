
import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card, { CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { 
    AlertTriangleIcon, BellIcon, CalendarDaysIcon, CheckCircleIcon, ChevronLeftIcon, 
    ChevronRightIcon, LightbulbIcon, MessageSquareQuestionIcon, BookOpenIcon
} from '../components/icons';
import { ActiveExperiment, DashboardTask, DashboardNotification, CalendarEvent, DashboardNotification as DashboardNotificationType } from '../types';
import { mockActiveExperiments, mockTasks, mockCalendarEvents } from '../data/mockDashboardData';
import { mockInventory } from '../data/mockInventoryData';
import { mockHelpRequests } from '../data/mockHelpData';
import { mockBookings } from '../data/mockInstrumentData';
import { mockInstruments } from '../data/mockInstrumentData';


// --- WIDGETS ---

const CurrentExperimentsWidget: React.FC = () => {
    const [experiments, setExperiments] = useState(mockActiveExperiments);

    useEffect(() => {
        const interval = setInterval(() => {
            setExperiments(prev => prev.map(exp => {
                if (exp.timeLeftMs && exp.timeLeftMs > 0) {
                    return { ...exp, timeLeftMs: exp.timeLeftMs - 1000 };
                }
                return exp;
            }));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const formatTime = (ms: number) => {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}m ${seconds.toString().padStart(2, '0')}s left`;
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Current Experiments</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {experiments.map(exp => (
                        <div key={exp.id}>
                            <div className="flex justify-between items-center mb-1">
                                <Link to={exp.link} className="font-semibold text-slate-800 hover:text-blue-600 transition-colors">{exp.name}</Link>
                                <span className="text-sm text-slate-500">{exp.status}</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2.5">
                                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${exp.progress}%` }}></div>
                            </div>
                            {exp.timeLeftMs && exp.timeLeftMs > 0 && (
                                <p className="text-right text-sm text-blue-700 font-medium mt-1">{formatTime(exp.timeLeftMs)}</p>
                            )}
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

const TasksWidget: React.FC = () => {
    const [tasks, setTasks] = useState(mockTasks);
    const [newTask, setNewTask] = useState('');

    const toggleTask = (id: string) => {
        setTasks(tasks.map(t => t.id === id ? { ...t, isCompleted: !t.isCompleted } : t));
    };

    const addTask = (e: React.FormEvent) => {
        e.preventDefault();
        if (newTask.trim() === '') return;
        const newTaskObj: DashboardTask = {
            id: `task-${Date.now()}`,
            text: newTask,
            isCompleted: false,
            priority: 'Medium'
        };
        setTasks([newTaskObj, ...tasks]);
        setNewTask('');
    };
    
    const priorityColors = { High: 'border-red-500', Medium: 'border-yellow-500', Low: 'border-slate-300' };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Today's Tasks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {tasks.map(task => (
                    <div key={task.id} className="flex items-center">
                        <input
                            type="checkbox"
                            id={task.id}
                            checked={task.isCompleted}
                            onChange={() => toggleTask(task.id)}
                            className={`h-5 w-5 rounded border-2 ${priorityColors[task.priority]} text-slate-600 focus:ring-slate-500 cursor-pointer`}
                        />
                        <label htmlFor={task.id} className={`ml-3 text-sm font-medium ${task.isCompleted ? 'text-slate-400 line-through' : 'text-slate-700'} `}>
                            {task.text}
                        </label>
                    </div>
                ))}
                <form onSubmit={addTask} className="flex gap-2 pt-4 border-t">
                    <Input value={newTask} onChange={e => setNewTask(e.target.value)} placeholder="Add a new task..." className="h-9"/>
                    <Button type="submit" size="sm">Add</Button>
                </form>
            </CardContent>
        </Card>
    );
};

const NotificationsWidget: React.FC = () => {
    const notifications = useMemo((): DashboardNotificationType[] => {
        const generated: DashboardNotificationType[] = [];
        const currentUser = 'Dr. Evelyn Reed';
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

        // Upcoming bookings notification
        const upcomingBookings = mockBookings.filter(b => {
            const startTime = new Date(b.startTime);
            return b.userId === currentUser && startTime >= todayStart && startTime < todayEnd && startTime > now;
        });

        if (upcomingBookings.length > 0) {
            const soonestBooking = upcomingBookings.sort((a,b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())[0];
            const instrument = mockInstruments.find(i => i.id === soonestBooking.instrumentId);
            const time = new Date(soonestBooking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            generated.push({
                id: `notif-booking-${soonestBooking.id}`,
                type: 'Booking',
                message: `Upcoming: ${instrument?.name || 'Instrument'} at ${time}`,
                link: '/instruments',
                date: 'Today',
            });
        }
        
        // Low stock notification
        const lowStockItems = mockInventory.filter(item => 
            item.lowStockThreshold !== undefined && item.quantity.value < item.lowStockThreshold
        );

        if (lowStockItems.length > 0) {
            const message = lowStockItems.length === 1 
                ? `Low Stock: "${lowStockItems[0].name}" is running low.`
                : `${lowStockItems.length} items are running low. Check inventory.`

            generated.push({
                id: 'notif-stock',
                type: 'Alert',
                message: message,
                link: '/inventory',
                date: 'Just now',
            });
        }

        // Help request notification
        const openHelpRequest = mockHelpRequests.find(req => req.status === 'Open');
        if (openHelpRequest) {
            generated.push({
                id: 'notif-help',
                type: 'Help',
                message: `New request in Help Forum: "${openHelpRequest.title}"`,
                link: '/help',
                date: '2 hours ago'
            });
        }
        
        // Protocol update notification
        generated.push({
            id: 'notif-protocol',
            type: 'Info',
            message: 'Protocol "Western Blot" was updated to v2.2.',
            link: '/protocols/western-blot-101',
            date: '1 day ago'
        });
        
        return generated.sort((a, b) => {
            if (a.type === 'Alert') return -1;
            if (b.type === 'Alert') return 1;
            if (a.type === 'Booking') return -1;
            if (b.type === 'Booking') return 1;
            return 0;
        });
    }, []);

    const notificationIcons: Record<DashboardNotificationType['type'], React.ReactElement> = {
        Alert: <AlertTriangleIcon className="h-5 w-5 text-red-500" />,
        Info: <BookOpenIcon className="h-5 w-5 text-blue-500" />,
        Help: <MessageSquareQuestionIcon className="h-5 w-5 text-green-500" />,
        Booking: <CalendarDaysIcon className="h-5 w-5 text-purple-500" />,
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Notifications & Alerts</CardTitle>
            </CardHeader>
            <CardContent>
                <ul className="space-y-4">
                    {notifications.map(n => (
                        <li key={n.id} className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-0.5">{notificationIcons[n.type]}</div>
                            <div>
                                <Link to={n.link} className="text-sm font-medium text-slate-800 hover:underline">{n.message}</Link>
                                <p className="text-xs text-slate-500">{n.date}</p>
                            </div>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    );
};

const CalendarWidget: React.FC = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());

    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDay = startOfMonth.getDay();
    const daysInMonth = endOfMonth.getDate();
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const blanks = Array.from({ length: startDay }, (_, i) => i);

    const eventsByDate = useMemo(() => {
        return mockCalendarEvents.reduce((acc, event) => {
            (acc[event.date] = acc[event.date] || []).push(event);
            return acc;
        }, {} as Record<string, CalendarEvent[]>);
    }, []);

    const changeMonth = (offset: number) => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
    };
    
    const formatDateKey = (date: Date) => date.toISOString().split('T')[0];

    const selectedDayEvents = eventsByDate[formatDateKey(selectedDate)] || [];
    
    const eventTypeStyles = {
        Meeting: 'bg-purple-500',
        Experiment: 'bg-blue-500',
        Booking: 'bg-green-500',
    };

    return (
        <Card>
            <CardContent>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-800">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => changeMonth(-1)}><ChevronLeftIcon className="h-5 w-5"/></Button>
                        <Button variant="ghost" size="sm" onClick={() => changeMonth(1)}><ChevronRightIcon className="h-5 w-5"/></Button>
                    </div>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-sm">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div key={day} className="font-medium text-slate-500">{day}</div>)}
                    {blanks.map(b => <div key={`blank-${b}`}></div>)}
                    {days.map(day => {
                        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                        const dateKey = formatDateKey(date);
                        const isToday = dateKey === formatDateKey(new Date());
                        const isSelected = dateKey === formatDateKey(selectedDate);
                        const hasEvents = eventsByDate[dateKey];
                        
                        return (
                            <div key={day} onClick={() => setSelectedDate(date)} className={`p-2 rounded-full cursor-pointer transition-colors relative ${isSelected ? 'bg-slate-800 text-white' : isToday ? 'bg-slate-200' : 'hover:bg-slate-100'}`}>
                                {day}
                                {hasEvents && <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 h-1.5 w-1.5 bg-red-500 rounded-full"></div>}
                            </div>
                        );
                    })}
                </div>
                <div className="mt-4 pt-4 border-t">
                    <h4 className="font-semibold text-slate-700 mb-2">Events for {selectedDate.toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric' })}</h4>
                     {selectedDayEvents.length > 0 ? (
                         <ul className="space-y-2">
                            {selectedDayEvents.map(event => (
                                <li key={event.id} className="flex items-center gap-3 p-2 bg-slate-50 rounded-md">
                                    <div className={`flex-shrink-0 h-2 w-2 rounded-full ${eventTypeStyles[event.type]}`}></div>
                                    <div className="flex-grow">
                                        <p className="font-medium text-sm text-slate-800">{event.title}</p>
                                        <p className="text-xs text-slate-500">{event.time}</p>
                                    </div>
                                </li>
                            ))}
                         </ul>
                    ) : (
                        <p className="text-sm text-slate-500">No events scheduled for this day.</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

// --- MAIN PAGE COMPONENT ---

const HomePage: React.FC = () => {
  const today = new Date();
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Good Morning, Dr. Reed!</h1>
        <p className="mt-1 text-md text-slate-600">
            Welcome to Digital Research Manager - Your AI-powered research platform. Here's your overview for {today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
            <CalendarWidget />
            <CurrentExperimentsWidget />
        </div>

        <div className="xl:col-span-1 space-y-6">
            <NotificationsWidget />
            <TasksWidget />
        </div>
      </div>
    </div>
  );
};

export default HomePage;