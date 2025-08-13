
import React, { useState, useMemo, FC } from 'react';
import Card, { CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Instrument, Booking, UsageLogEntry } from '../types';
import { mockInstruments } from '../data/mockInstrumentData';
import { mockBookings as initialBookings } from '../data/mockInstrumentData';
import { mockUsageLog } from '../data/mockInstrumentData';
import { ChevronLeftIcon, ChevronRightIcon, CalendarClockIcon } from '../components/icons';

const getWeekDays = (startDate: Date): Date[] => {
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
        const day = new Date(startDate);
        day.setDate(day.getDate() + i);
        days.push(day);
    }
    return days;
};

const getStartOfWeek = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    return new Date(d.setDate(diff));
};

const ScheduleView: FC<{ bookings: Booking[]; week: Date[] }> = ({ bookings, week }) => {
    const timeLabels = Array.from({ length: 12 }, (_, i) => `${i + 8}:00`); // 8 AM to 7 PM

    const bookingsByDay = useMemo(() => {
        const map: { [key: string]: Booking[] } = {};
        week.forEach(day => {
            const dayStr = day.toISOString().split('T')[0];
            map[dayStr] = bookings.filter(b => b.startTime.startsWith(dayStr));
        });
        return map;
    }, [bookings, week]);

    const getBookingPosition = (booking: Booking): { top: string; height: string } => {
        const start = new Date(booking.startTime);
        const end = new Date(booking.endTime);
        const dayStartHour = 8;
        const totalHours = 12; // 8 AM to 8 PM

        const startOffset = (start.getHours() - dayStartHour) * 60 + start.getMinutes();
        const duration = (end.getTime() - start.getTime()) / (1000 * 60);

        const top = `${(startOffset / (totalHours * 60)) * 100}%`;
        const height = `${(duration / (totalHours * 60)) * 100}%`;
        
        return { top, height };
    };

    return (
        <div className="flex bg-white p-4 rounded-lg border">
            <div className="w-16 flex-shrink-0 text-right pr-2">
                {timeLabels.map(time => (
                    <div key={time} className="h-20 flex items-start justify-end">
                        <span className="text-xs text-slate-500 -translate-y-1/2">{time}</span>
                    </div>
                ))}
            </div>
            <div className="flex-grow grid grid-cols-7 gap-1">
                {week.map(day => (
                    <div key={day.toISOString()} className="relative border-l border-slate-200">
                        {timeLabels.map((_, index) => (
                             <div key={index} className="h-20 border-t border-slate-200"></div>
                        ))}
                        {bookingsByDay[day.toISOString().split('T')[0]].map(booking => {
                            const { top, height } = getBookingPosition(booking);
                            return (
                                <div
                                    key={booking.id}
                                    className="absolute w-full p-2 rounded-lg bg-blue-100 border border-blue-300 overflow-hidden group"
                                    style={{ top, height }}
                                >
                                    <p className="text-xs font-semibold text-blue-800 truncate">{booking.title}</p>
                                    <p className="text-xs text-blue-600 truncate">{booking.userId}</p>
                                </div>
                            )
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
};

const BookingForm: FC<{ instrument: Instrument; bookings: Booking[]; onBook: (booking: Booking) => void }> = ({ instrument, bookings, onBook }) => {
    const [title, setTitle] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('10:00');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const start = new Date(`${date}T${startTime}`);
        const end = new Date(`${date}T${endTime}`);

        if (end <= start) {
            setError('End time must be after start time.');
            return;
        }

        const conflict = bookings.some(b => {
            const existingStart = new Date(b.startTime);
            const existingEnd = new Date(b.endTime);
            return b.instrumentId === instrument.id && start < existingEnd && end > existingStart;
        });

        if (conflict) {
            setError('This time slot conflicts with an existing booking.');
            return;
        }

        onBook({
            id: `book-${Date.now()}`,
            instrumentId: instrument.id,
            userId: 'Dr. Evelyn Reed', // Hardcoded for now
            title,
            startTime: start.toISOString(),
            endTime: end.toISOString(),
        });

        setTitle('');
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-slate-50 rounded-lg border">
            <div>
                <label htmlFor="title" className="block text-sm font-medium text-slate-700">Booking Title</label>
                <Input id="title" value={title} onChange={e => setTitle(e.target.value)} required />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div>
                    <label htmlFor="date" className="block text-sm font-medium text-slate-700">Date</label>
                    <Input id="date" type="date" value={date} onChange={e => setDate(e.target.value)} required />
                 </div>
                 <div>
                    <label htmlFor="startTime" className="block text-sm font-medium text-slate-700">Start Time</label>
                    <Input id="startTime" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} required />
                 </div>
                 <div>
                    <label htmlFor="endTime" className="block text-sm font-medium text-slate-700">End Time</label>
                    <Input id="endTime" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} required />
                 </div>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" disabled={instrument.status !== 'Operational'}>
                {instrument.status === 'Operational' ? 'Book Time Slot' : 'Instrument Unavailable'}
            </Button>
        </form>
    );
};

const UsageLogView: FC<{ log: UsageLogEntry[] }> = ({ log }) => (
    <div className="space-y-4 p-4 bg-slate-50 rounded-lg border max-h-96 overflow-y-auto">
        {log.length > 0 ? log.map(entry => (
            <div key={entry.id} className="p-3 bg-white rounded-md border">
                 <div className="flex justify-between items-center">
                    <p className="font-semibold text-slate-800">{entry.userId}</p>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        entry.type === 'Usage' ? 'bg-blue-100 text-blue-800' :
                        entry.type === 'Maintenance' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                    }`}>{entry.type}</span>
                </div>
                <p className="text-sm text-slate-500">
                    {new Date(entry.startTime).toLocaleString()} to {new Date(entry.endTime).toLocaleString()}
                </p>
                {entry.notes && <p className="mt-2 text-sm text-slate-600 bg-slate-50 p-2 rounded">{entry.notes}</p>}
            </div>
        )) : <p className="text-slate-500 text-center">No log entries for this instrument.</p>}
    </div>
);


const InstrumentsPage: FC = () => {
    const [selectedInstrumentId, setSelectedInstrumentId] = useState<string>(mockInstruments[0].id);
    const [bookings, setBookings] = useState<Booking[]>(initialBookings);
    const [currentWeek, setCurrentWeek] = useState<Date>(getStartOfWeek(new Date()));

    const selectedInstrument = useMemo(() => mockInstruments.find(i => i.id === selectedInstrumentId)!, [selectedInstrumentId]);
    const instrumentBookings = useMemo(() => bookings.filter(b => b.instrumentId === selectedInstrumentId), [bookings, selectedInstrumentId]);
    const instrumentLog = useMemo(() => mockUsageLog.filter(l => l.instrumentId === selectedInstrumentId).sort((a,b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()), [selectedInstrumentId]);

    const handleAddBooking = (booking: Booking) => {
        setBookings([...bookings, booking]);
    };

    const changeWeek = (offset: number) => {
        const newDate = new Date(currentWeek);
        newDate.setDate(newDate.getDate() + offset * 7);
        setCurrentWeek(newDate);
    };

    const weekDays = getWeekDays(currentWeek);
    const weekDisplay = `${weekDays[0].toLocaleDateString(undefined, {month: 'short', day: 'numeric'})} - ${weekDays[6].toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})}`;

    const statusClasses: Record<Instrument['status'], string> = {
        Operational: 'bg-green-500',
        'Under Maintenance': 'bg-yellow-500',
        Offline: 'bg-red-500',
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Instrument Booking & Logs</h1>
                <p className="mt-1 text-md text-slate-600">Schedule time on shared equipment and view usage history.</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader><CardTitle>Instruments</CardTitle></CardHeader>
                        <CardContent className="p-2 space-y-1">
                            {mockInstruments.map(inst => (
                                <button
                                    key={inst.id}
                                    onClick={() => setSelectedInstrumentId(inst.id)}
                                    className={`w-full text-left p-3 rounded-md transition-colors ${selectedInstrumentId === inst.id ? 'bg-slate-800 text-white' : 'hover:bg-slate-100'}`}
                                >
                                    <div className="flex justify-between items-center">
                                        <span className="font-semibold">{inst.name}</span>
                                        <span className={`h-2.5 w-2.5 rounded-full ${statusClasses[inst.status]}`}></span>
                                    </div>
                                    <p className={`text-sm ${selectedInstrumentId === inst.id ? 'text-slate-300' : 'text-slate-500'}`}>{inst.type}</p>
                                </button>
                            ))}
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-3 space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle>Schedule for {selectedInstrument.name}</CardTitle>
                                    <CardDescription>{weekDisplay}</CardDescription>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="secondary" size="sm" onClick={() => changeWeek(-1)}><ChevronLeftIcon className="h-5 w-5" /></Button>
                                    <Button variant="secondary" size="sm" onClick={() => changeWeek(1)}><ChevronRightIcon className="h-5 w-5" /></Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <ScheduleView bookings={instrumentBookings} week={weekDays} />
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader><CardTitle>Book a Time Slot</CardTitle></CardHeader>
                        <CardContent>
                            <BookingForm instrument={selectedInstrument} bookings={instrumentBookings} onBook={handleAddBooking} />
                        </CardContent>
                    </Card>
                    
                     <Card>
                        <CardHeader><CardTitle>Usage & Maintenance Log</CardTitle></CardHeader>
                        <CardContent>
                           <UsageLogView log={instrumentLog} />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default InstrumentsPage;