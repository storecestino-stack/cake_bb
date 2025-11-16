import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, isSameDay, isSameMonth } from 'date-fns';
import { uk } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const statusColors = {
  'New': 'bg-blue-100 text-blue-800',
  'In Progress': 'bg-yellow-100 text-yellow-800',
  'Ready': 'bg-green-100 text-green-800',
  'Delivered': 'bg-gray-100 text-gray-800',
  'Cancelled': 'bg-red-100 text-red-800'
};

export default function CalendarPage() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // 'day', 'week', 'month', 'year'
  const [dayOrders, setDayOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get('/orders');
      setOrders(response.data);
    } catch (error) {
      toast.error(t('orders.errorLoad'));
    } finally {
      setLoading(false);
    }
  };

  const getOrdersForDate = (date) => {
    if (!date) return [];
    const dateStr = format(date, 'yyyy-MM-dd');
    return orders.filter(order => {
      if (!order.dueDate) return false;
      const orderDateStr = format(new Date(order.dueDate), 'yyyy-MM-dd');
      return orderDateStr === dateStr;
    });
  };

  const getOrdersForPeriod = (startDate, endDate) => {
    return orders.filter(order => {
      if (!order.dueDate) return false;
      const orderDate = new Date(order.dueDate);
      return orderDate >= startDate && orderDate <= endDate;
    });
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setCurrentDate(date);
    const ordersOnDate = getOrdersForDate(date);
    setDayOrders(ordersOnDate);
    if (ordersOnDate.length > 0) {
      setDialogOpen(true);
    }
  };

  const handleOrderClick = (order) => {
    setSelectedOrder(order);
    setDialogOpen(false);
    setDetailsOpen(true);
  };

  const getDatesWithOrders = () => {
    return orders
      .filter(order => order.dueDate)
      .map(order => new Date(order.dueDate));
  };

  const navigatePrevious = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() - 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (viewMode === 'year') {
      newDate.setFullYear(newDate.getFullYear() - 1);
    }
    setCurrentDate(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() + 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (viewMode === 'year') {
      newDate.setFullYear(newDate.getFullYear() + 1);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const renderDayView = () => {
    const dayOrders = getOrdersForDate(currentDate).sort((a, b) => {
      return new Date(a.dueDate) - new Date(b.dueDate);
    });
    
    return (
      <div className="space-y-4">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold">{format(currentDate, 'dd MMMM yyyy', { locale: uk })}</h3>
          <p className="text-sm text-muted-foreground mt-1">{format(currentDate, 'EEEE', { locale: uk })}</p>
        </div>
        
        {dayOrders.length > 0 ? (
          <div className="max-w-3xl mx-auto">
            {/* Порядок денний / Time schedule */}
            <div className="space-y-2">
              {dayOrders.map((order) => {
                const orderTime = format(new Date(order.dueDate), 'HH:mm');
                return (
                  <div
                    key={order.id}
                    className="flex gap-4 p-4 border-l-4 border-primary bg-card rounded-r-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => handleOrderClick(order)}
                  >
                    {/* Time column */}
                    <div className="flex-shrink-0 w-20">
                      <div className="text-lg font-bold text-primary">{orderTime}</div>
                    </div>
                    
                    {/* Order details column */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <h4 className="font-semibold text-foreground text-lg">{order.item}</h4>
                        <span className={`flex-shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                          {t(`orders.statuses.${order.status}`)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          👤 {order.client?.name}
                        </span>
                        {order.total && (
                          <span className="flex items-center gap-1">
                            💰 {order.total.toFixed(2)} грн
                          </span>
                        )}
                      </div>
                      
                      {order.notes && (
                        <p className="mt-2 text-sm text-muted-foreground italic">
                          {order.notes}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📅</div>
            <p className="text-lg text-muted-foreground">{t('dashboard.noUpcomingOrders')}</p>
          </div>
        )}
      </div>
    );
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate, { locale: uk });
    const weekEnd = endOfWeek(currentDate, { locale: uk });
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
    
    return (
      <div className="space-y-4">
        <div className="text-center mb-4">
          <h3 className="text-xl font-bold">
            {format(weekStart, 'dd MMM', { locale: uk })} - {format(weekEnd, 'dd MMM yyyy', { locale: uk })}
          </h3>
        </div>
        
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day) => {
            const dayOrders = getOrdersForDate(day).sort((a, b) => {
              return new Date(a.dueDate) - new Date(b.dueDate);
            });
            const isToday = isSameDay(day, new Date());
            
            return (
              <div
                key={day.toISOString()}
                className={`border rounded-lg overflow-hidden ${
                  isToday ? 'border-primary bg-primary/5' : 'border-border'
                }`}
              >
                {/* Day header */}
                <div 
                  className={`p-2 text-center font-semibold cursor-pointer hover:bg-muted/50 ${
                    isToday ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  }`}
                  onClick={() => {
                    setCurrentDate(day);
                    setViewMode('day');
                  }}
                >
                  <div className="text-xs">{format(day, 'EEE', { locale: uk })}</div>
                  <div className="text-lg">{format(day, 'd')}</div>
                </div>
                
                {/* Orders list */}
                <div className="p-2 space-y-1.5 max-h-[400px] overflow-y-auto">
                  {dayOrders.length > 0 ? (
                    dayOrders.map((order) => (
                      <div
                        key={order.id}
                        className="text-xs p-2 bg-card border border-border rounded cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleOrderClick(order)}
                      >
                        <div className="font-medium text-foreground mb-1 line-clamp-2">
                          {order.item}
                        </div>
                        <div className="text-[10px] text-muted-foreground flex items-center justify-between">
                          <span>{format(new Date(order.dueDate), 'HH:mm')}</span>
                          <span className={`px-1 py-0.5 rounded text-[9px] ${statusColors[order.status]}`}>
                            {t(`orders.statuses.${order.status}`).substring(0, 3)}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-xs text-muted-foreground">
                      Немає
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { locale: uk });
    const calendarEnd = endOfWeek(monthEnd, { locale: uk });
    const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    
    // Group days into weeks
    const weeks = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
      weeks.push(calendarDays.slice(i, i + 7));
    }
    
    return (
      <div className="space-y-4">
        <div className="text-center mb-4">
          <h3 className="text-2xl font-bold">{format(currentDate, 'LLLL yyyy', { locale: uk })}</h3>
        </div>
        
        {/* Day names header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'].map((day, idx) => (
            <div key={idx} className="text-center font-semibold text-sm text-muted-foreground py-2">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar grid */}
        <div className="space-y-1">
          {weeks.map((week, weekIdx) => (
            <div key={weekIdx} className="grid grid-cols-7 gap-1" style={{ minHeight: '120px' }}>
              {week.map((day) => {
                const dayOrders = getOrdersForDate(day).sort((a, b) => {
                  return new Date(a.dueDate) - new Date(b.dueDate);
                });
                const isToday = isSameDay(day, new Date());
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                
                return (
                  <div
                    key={day.toISOString()}
                    className={`border rounded-lg overflow-hidden transition-colors cursor-pointer ${
                      isToday ? 'border-primary border-2' : 'border-border'
                    } ${isSelected ? 'ring-2 ring-primary' : ''} ${
                      !isCurrentMonth ? 'bg-muted/30' : 'bg-card'
                    } hover:bg-muted/50`}
                    onClick={() => {
                      setSelectedDate(day);
                      setCurrentDate(day);
                      setViewMode('day');
                    }}
                  >
                    {/* Day header */}
                    <div 
                      className={`p-1.5 text-center font-semibold ${
                        isToday ? 'bg-primary text-primary-foreground' : 'bg-muted'
                      } ${!isCurrentMonth ? 'opacity-50' : ''}`}
                    >
                      <div className="text-sm">{format(day, 'd')}</div>
                    </div>
                    
                    {/* Orders list */}
                    <div className="p-1 space-y-0.5">
                      {dayOrders.slice(0, 4).map((order) => (
                        <div
                          key={order.id}
                          className={`text-[10px] p-1 rounded truncate ${statusColors[order.status]} hover:opacity-80`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOrderClick(order);
                          }}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="truncate font-medium">{order.item}</span>
                            <span className="flex-shrink-0">{format(new Date(order.dueDate), 'HH:mm')}</span>
                          </div>
                        </div>
                      ))}
                      {dayOrders.length > 4 && (
                        <div className="text-[9px] text-center text-muted-foreground font-medium">
                          +{dayOrders.length - 4} ще
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderYearView = () => {
    const yearStart = startOfYear(currentDate);
    const yearEnd = endOfYear(currentDate);
    const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });
    
    return (
      <div className="space-y-4">
        <div className="text-center mb-4">
          <h3 className="text-2xl font-bold">{format(currentDate, 'yyyy')}</h3>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
          {months.map((month) => {
            const monthStart = startOfMonth(month);
            const monthEnd = endOfMonth(month);
            const monthOrders = getOrdersForPeriod(monthStart, monthEnd);
            
            return (
              <div
                key={month.toISOString()}
                className="p-4 border border-border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => {
                  setCurrentDate(month);
                  setViewMode('month');
                }}
              >
                <div className="font-semibold text-center mb-2">
                  {format(month, 'LLLL', { locale: uk })}
                </div>
                <div className="text-center">
                  <span className="text-2xl font-bold text-primary">{monthOrders.length}</span>
                  <div className="text-xs text-muted-foreground">{t('orders.title')}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          {t('nav.calendar')}
        </h1>
        <p className="text-muted-foreground">{t('nav.calendar')}</p>
      </div>

      <Card className="max-w-6xl mx-auto">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <CardTitle>{t('orders.title')}</CardTitle>
            
            {/* View Mode Selector */}
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'day' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('day')}
              >
                День
              </Button>
              <Button
                variant={viewMode === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('week')}
              >
                Тиждень
              </Button>
              <Button
                variant={viewMode === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('month')}
              >
                Місяць
              </Button>
              <Button
                variant={viewMode === 'year' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('year')}
              >
                Рік
              </Button>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between mt-4">
            <Button variant="outline" size="sm" onClick={navigatePrevious}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <Button variant="outline" size="sm" onClick={goToToday}>
              Сьогодні
            </Button>
            
            <Button variant="outline" size="sm" onClick={navigateNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {viewMode === 'day' && renderDayView()}
          {viewMode === 'week' && renderWeekView()}
          {viewMode === 'month' && renderMonthView()}
          {viewMode === 'year' && renderYearView()}
        </CardContent>
      </Card>

      {/* Day Orders Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t('orders.title')} {selectedDate && format(selectedDate, 'dd MMMM yyyy', { locale: uk })}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {dayOrders.map((order) => (
              <div
                key={order.id}
                className="p-4 border border-border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => handleOrderClick(order)}
                data-testid={`calendar-order-${order.id}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-foreground">{order.item}</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                    {t(`orders.statuses.${order.status}`)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{order.client?.name}</span>
                  <span>{format(new Date(order.dueDate), 'HH:mm')}</span>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Order Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('orders.orderDetails')}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">{t('orders.client')}</p>
                <p className="text-lg font-medium">{selectedOrder.client?.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('orders.product')}</p>
                <p className="text-lg font-medium">{selectedOrder.item}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('orders.status')}</p>
                <p className="text-lg">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[selectedOrder.status]}`}>
                    {t(`orders.statuses.${selectedOrder.status}`)}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('orders.dueDate')}</p>
                <p className="text-lg font-medium">
                  {selectedOrder.dueDate && format(new Date(selectedOrder.dueDate), 'dd MMMM yyyy, HH:mm', { locale: uk })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('orders.amount')}</p>
                <p className="text-2xl font-bold text-primary">{selectedOrder.total.toFixed(2)} грн</p>
              </div>
              {selectedOrder.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">{t('orders.notes')}</p>
                  <p className="text-sm">{selectedOrder.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}