import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

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
  const [selectedDate, setSelectedDate] = useState(null);
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

  const handleDateSelect = (date) => {
    setSelectedDate(date);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          Календар
        </h1>
        <p className="text-muted-foreground">Плануйте замовлення на календарі</p>
      </div>

      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Замовлення по датах</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            locale={uk}
            className="rounded-md border"
            modifiers={{
              hasOrders: getDatesWithOrders()
            }}
            modifiersClassNames={{
              hasOrders: 'bg-primary/20 font-bold'
            }}
            data-testid="calendar-component"
          />
        </CardContent>
      </Card>

      {/* Day Orders Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Замовлення на {selectedDate && format(selectedDate, 'dd MMMM yyyy', { locale: uk })}
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
                    {statusLabels[order.status]}
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
            <DialogTitle>Деталі замовлення</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Клієнт</p>
                <p className="text-lg font-medium">{selectedOrder.client?.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Виріб</p>
                <p className="text-lg font-medium">{selectedOrder.item}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Статус</p>
                <p className="text-lg">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[selectedOrder.status]}`}>
                    {statusLabels[selectedOrder.status]}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Дата виконання</p>
                <p className="text-lg font-medium">
                  {selectedOrder.dueDate && format(new Date(selectedOrder.dueDate), 'dd MMMM yyyy, HH:mm', { locale: uk })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Сума</p>
                <p className="text-2xl font-bold text-primary">{selectedOrder.total.toFixed(2)} грн</p>
              </div>
              {selectedOrder.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Примітки</p>
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