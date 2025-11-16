import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, ShoppingBag, TrendingUp, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';

const periodLabels = {
  week: 'Тиждень',
  month: 'Місяць',
  quarter: 'Квартал',
  year: 'Рік'
};

const statusLabels = {
  'New': 'Нове',
  'In Progress': 'В роботі',
  'Ready': 'Готово',
  'Delivered': 'Доставлено',
  'Cancelled': 'Скасовано'
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState('month');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [period]);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`/stats/dashboard?period=${period}`);
      setStats(response.data);
    } catch (error) {
      toast.error('Помилка завантаження статистики');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          Панель керування
        </h1>
        <p className="text-muted-foreground">Огляд вашого бізнесу</p>
      </div>

      {/* Revenue Card with Period Selector */}
      <Card className="border-primary/20 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-base font-medium">Загальний дохід</CardTitle>
            <CardDescription>Доставлені замовлення</CardDescription>
          </div>
          <TrendingUp className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-primary mb-4">
            {stats?.totalRevenue?.toFixed(2) || '0.00'} грн
          </div>
          <Tabs value={period} onValueChange={setPeriod} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              {Object.entries(periodLabels).map(([key, label]) => (
                <TabsTrigger key={key} value={key} data-testid={`period-${key}`}>
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate('/clients')}
          data-testid="clients-stat-card"
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Клієнти</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalClients || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              +{stats?.newClients || 0} цього місяця
            </p>
          </CardContent>
        </Card>

        <Card data-testid="active-orders-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Активні замовлення</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeOrders || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Нові та в роботі</p>
          </CardContent>
        </Card>

        <Card data-testid="recent-activities-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Останні активності</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.recentActivities || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Нових за тиждень</p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Майбутні замовлення</CardTitle>
          <CardDescription>Найближчі 5 замовлень</CardDescription>
        </CardHeader>
        <CardContent>
          {stats?.upcomingOrders?.length > 0 ? (
            <div className="space-y-3">
              {stats.upcomingOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => navigate('/orders')}
                  data-testid={`upcoming-order-${order.id}`}
                >
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">{order.item}</p>
                    <p className="text-sm text-muted-foreground">{order.client?.name}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-sm font-medium">
                      {order.dueDate ? format(new Date(order.dueDate), 'dd MMM yyyy, HH:mm', { locale: uk }) : ''}
                    </p>
                    <p className="text-xs text-muted-foreground">{statusLabels[order.status]}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Немає майбутніх замовлень</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}