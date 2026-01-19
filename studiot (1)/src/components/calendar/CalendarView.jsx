import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  isToday,
  addMonths,
  subMonths,
  parseISO
} from 'date-fns';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import StatusBadge from '@/components/ui/StatusBadge';
import PlatformIcon from '@/components/ui/PlatformIcon';
import { cn } from "@/lib/utils";

export default function CalendarView({ 
  posts, 
  accounts, 
  isReadOnly = false,
  onDateClick,
  onPostClick 
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  const getPostsForDay = (day) => {
    return posts.filter(post => {
      if (!post.scheduled_date) return false;
      return isSameDay(parseISO(post.scheduled_date), day);
    });
  };

  const getAccountById = (id) => accounts.find(a => a.id === id);

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-100">
        <h2 className="text-xl font-semibold text-slate-900">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button 
            variant="outline"
            onClick={() => setCurrentMonth(new Date())}
          >
            Today
          </Button>
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Week day headers */}
      <div className="grid grid-cols-7 border-b border-slate-100">
        {weekDays.map(day => (
          <div 
            key={day} 
            className="py-3 text-center text-sm font-medium text-slate-500"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {days.map((day, idx) => {
          const dayPosts = getPostsForDay(day);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isCurrentDay = isToday(day);

          return (
            <div
              key={idx}
              className={cn(
                "min-h-[120px] border-b border-r border-slate-100 p-2 transition-colors",
                !isCurrentMonth && "bg-slate-50/50",
                isCurrentDay && "bg-violet-50/50",
                !isReadOnly && "cursor-pointer hover:bg-slate-50"
              )}
              onClick={() => !isReadOnly && onDateClick?.(day)}
            >
              {/* Day number */}
              <div className="flex items-center justify-between mb-2">
                <span className={cn(
                  "text-sm font-medium",
                  !isCurrentMonth && "text-slate-400",
                  isCurrentMonth && "text-slate-700",
                  isCurrentDay && "w-7 h-7 rounded-full bg-violet-600 text-white flex items-center justify-center"
                )}>
                  {format(day, 'd')}
                </span>
                {!isReadOnly && isCurrentMonth && dayPosts.length === 0 && (
                  <Plus className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100" />
                )}
              </div>

              {/* Posts */}
              <div className="space-y-1">
                {dayPosts.slice(0, 3).map(post => {
                  const account = getAccountById(post.social_account_id);
                  return (
                    <div
                      key={post.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onPostClick?.(post);
                      }}
                      className={cn(
                        "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs cursor-pointer transition-all hover:shadow-sm",
                        post.status === 'draft' && "bg-slate-100 hover:bg-slate-200",
                        post.status === 'internal_review' && "bg-amber-100 hover:bg-amber-200",
                        post.status === 'sent_to_client' && "bg-blue-100 hover:bg-blue-200",
                        post.status === 'approved' && "bg-emerald-100 hover:bg-emerald-200",
                        post.status === 'ready_to_post' && "bg-purple-100 hover:bg-purple-200",
                        post.status === 'posted' && "bg-green-100 hover:bg-green-200 opacity-60"
                      )}
                    >
                      <PlatformIcon platform={post.platform} size="sm" />
                      <span className="truncate font-medium text-slate-700">
                        @{account?.handle || 'Unknown'}
                      </span>
                      {post.scheduled_time && (
                        <span className="text-slate-500 ml-auto">
                          {post.scheduled_time}
                        </span>
                      )}
                    </div>
                  );
                })}
                {dayPosts.length > 3 && (
                  <div className="text-xs text-slate-500 px-2">
                    +{dayPosts.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}