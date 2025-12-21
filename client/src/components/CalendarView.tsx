import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { useState } from "react";
import {
  getMonthDays,
  getWeekDays,
  formatMonthYear,
  formatWeekRange,
  isSameDay,
  addMonths,
  addWeeks,
  startOfMonth,
  startOfWeek,
} from "@/lib/calendar-utils";

type ViewMode = "month" | "week" | "day";

interface CalendarViewProps {
  timeSlots: any[];
  onSlotClick: (slot: any) => void;
  showLocation?: boolean;
  selectedSlots?: any[]; // Add selected slots prop
}

export default function CalendarView({ timeSlots, onSlotClick, showLocation = false, selectedSlots = [] }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const handlePrevious = () => {
    if (viewMode === "month") {
      setCurrentDate(addMonths(currentDate, -1));
    } else if (viewMode === "week") {
      setCurrentDate(addWeeks(currentDate, -1));
    } else if (viewMode === "day" && selectedDate) {
      const newDate = new Date(selectedDate);
      newDate.setDate(newDate.getDate() - 1);
      setSelectedDate(newDate);
    }
  };

  const handleNext = () => {
    if (viewMode === "month") {
      setCurrentDate(addMonths(currentDate, 1));
    } else if (viewMode === "week") {
      setCurrentDate(addWeeks(currentDate, 1));
    } else if (viewMode === "day" && selectedDate) {
      const newDate = new Date(selectedDate);
      newDate.setDate(newDate.getDate() + 1);
      setSelectedDate(newDate);
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(null);
    setViewMode("month");
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setViewMode("day");
  };

  const getSlotsForDate = (date: Date) => {
    return timeSlots.filter(slot => {
      const slotDate = new Date(slot.startTime);
      return isSameDay(slotDate, date);
    }).sort((a, b) => a.startTime - b.startTime);
  };

  const getAvailableSlotsCount = (date: Date) => {
    const slots = getSlotsForDate(date);
    return slots.filter(slot => slot.currentBookings < slot.maxBookings).length;
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const days = getMonthDays(monthStart);
    const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map(day => (
            <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {days.map((day, index) => {
            const availableSlots = getAvailableSlotsCount(day.date);
            const isCurrentMonth = day.isCurrentMonth;
            const isToday = isSameDay(day.date, new Date());

            return (
              <button
                key={index}
                onClick={() => isCurrentMonth && handleDayClick(day.date)}
                disabled={!isCurrentMonth || availableSlots === 0}
                className={`
                  min-h-[80px] p-2 rounded-lg border transition-all
                  ${isCurrentMonth ? 'bg-white hover:bg-blue-50 hover:border-blue-300' : 'bg-gray-50 text-gray-400'}
                  ${isToday ? 'border-blue-500 border-2' : 'border-gray-200'}
                  ${availableSlots === 0 && isCurrentMonth ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  disabled:cursor-not-allowed disabled:hover:bg-gray-50
                `}
              >
                <div className="text-left">
                  <div className={`text-sm font-semibold ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                    {day.date.getDate()}
                  </div>
                  {isCurrentMonth && availableSlots > 0 && (
                    <div className="mt-1 text-xs text-green-600 font-medium">
                      {availableSlots} slot{availableSlots !== 1 ? 's' : ''}
                    </div>
                  )}
                  {isCurrentMonth && availableSlots === 0 && (
                    <div className="mt-1 text-xs text-gray-400">
                      No slots
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    if (!selectedDate) return null;

    const slots = getSlotsForDate(selectedDate);
    const dateStr = selectedDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    if (slots.length === 0) {
      return (
        <div className="text-center py-12">
          <CalendarIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No time slots available for {dateStr}</p>
          <Button 
            variant="outline" 
            onClick={() => setViewMode("month")} 
            className="mt-4"
          >
            Back to Month View
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{dateStr}</h3>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setViewMode("month")}
          >
            Back to Month
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl">
          {slots.map(slot => {
            const startTime = new Date(slot.startTime);
            const endTime = new Date(slot.endTime);
            const timeStr = `${startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })} - ${endTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`;
            const isAvailable = slot.currentBookings < slot.maxBookings;
            const spotsLeft = slot.maxBookings - slot.currentBookings;

            const isSelected = selectedSlots.some(s => s.id === slot.id);
            
            return (
              <Card
                key={slot.id}
                className={`
                  p-4 cursor-pointer transition-all border-2
                  ${isSelected 
                    ? 'bg-blue-100 border-blue-600 shadow-lg ring-2 ring-blue-400' 
                    : isAvailable 
                      ? 'hover:border-blue-500 hover:shadow-md bg-white' 
                      : 'bg-gray-50 border-gray-200 opacity-60 cursor-pointer hover:opacity-80'}
                `}
                onClick={() => onSlotClick(slot)}
              >
                <div className="space-y-2">
                  <div className="font-semibold text-gray-900">{timeStr}</div>
                  {showLocation && (
                    <div className="text-sm text-gray-600">{slot.location}</div>
                  )}
                  <div className={`text-sm font-medium ${isAvailable ? 'text-green-600' : 'text-red-600'}`}>
                    {isAvailable ? `${spotsLeft} spot${spotsLeft !== 1 ? 's' : ''} left` : 'Fully booked'}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate);
    const days = getWeekDays(weekStart);
    const hours = Array.from({ length: 11 }, (_, i) => i + 9); // 9 AM to 7 PM

    return (
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          <div className="grid grid-cols-8 gap-2">
            <div className="text-center text-sm font-semibold text-gray-600 py-2">Time</div>
            {days.map((day, index) => {
              const dayName = day.toLocaleDateString('en-US', { weekday: 'short' });
              const dayNum = day.getDate();
              const isToday = isSameDay(day, new Date());
              
              return (
                <div 
                  key={index} 
                  className={`text-center text-sm font-semibold py-2 rounded-t-lg ${isToday ? 'bg-blue-100 text-blue-700' : 'text-gray-600'}`}
                >
                  <div>{dayName}</div>
                  <div className="text-lg">{dayNum}</div>
                </div>
              );
            })}
          </div>

          {hours.map(hour => (
            <div key={hour} className="grid grid-cols-8 gap-2 mb-2">
              <div className="text-sm text-gray-600 py-2 text-right pr-2">
                {hour === 12 ? '12:00 PM' : hour > 12 ? `${hour - 12}:00 PM` : `${hour}:00 AM`}
              </div>
              {days.map((day, dayIndex) => {
                const daySlots = getSlotsForDate(day).filter(slot => {
                  const slotHour = new Date(slot.startTime).getHours();
                  return slotHour === hour;
                });

                return (
                  <div key={dayIndex} className="space-y-1">
                    {daySlots.map(slot => {
                      const isAvailable = slot.currentBookings < slot.maxBookings;
                      const spotsLeft = slot.maxBookings - slot.currentBookings;

                      const isSelected = selectedSlots.some(s => s.id === slot.id);
                      
                      return (
                        <button
                          key={slot.id}
                          onClick={() => onSlotClick(slot)}
                          className={`
                            w-full text-xs p-2 rounded border transition-all cursor-pointer
                            ${isSelected 
                              ? 'bg-blue-600 border-blue-700 text-white ring-2 ring-blue-400' 
                              : isAvailable 
                                ? 'bg-blue-50 border-blue-300 hover:bg-blue-100 text-blue-700' 
                                : 'bg-gray-100 border-gray-300 text-gray-500 hover:bg-gray-200'}
                          `}
                        >
                          <div className="font-medium">{spotsLeft}/{slot.maxBookings}</div>
                          {showLocation && <div className="text-[10px]">{slot.location}</div>}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const getTitle = () => {
    if (viewMode === "day" && selectedDate) {
      return selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    } else if (viewMode === "week") {
      return formatWeekRange(startOfWeek(currentDate));
    } else {
      return formatMonthYear(currentDate);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrevious}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleToday}>
            Today
          </Button>
          <h2 className="text-xl font-bold text-gray-900 ml-4">{getTitle()}</h2>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === "month" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setViewMode("month");
              setSelectedDate(null);
            }}
          >
            Month
          </Button>
          <Button
            variant={viewMode === "week" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setViewMode("week");
              setSelectedDate(null);
            }}
          >
            Week
          </Button>
        </div>
      </div>

      {viewMode === "month" && renderMonthView()}
      {viewMode === "week" && renderWeekView()}
      {viewMode === "day" && renderDayView()}
    </div>
  );
}
