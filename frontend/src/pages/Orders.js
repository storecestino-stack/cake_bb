import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, MoreVertical, Eye, X } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';

const statusOptions = ['New', 'In Progress', 'Ready', 'Delivered', 'Cancelled'];
const statusLabels = {
  'New': 'Нове',
  'In Progress': 'В роботі',
  'Ready': 'Готово',
  'Delivered': 'Доставлено',
  'Cancelled': 'Скасовано'
};

const statusColors = {
  'New': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  'In Progress': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  'Ready': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  'Delivered': 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  'Cancelled': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [clients, setClients] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [formData, setFormData] = useState({
    clientId: '',
    item: '',
    dueDate: '',
    total: 0,
    notes: '',
    orderRecipes: [] // [{recipeId, quantity}]
  });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [ordersRes, clientsRes, recipesRes] = await Promise.all([
        axios.get('/orders'),
        axios.get('/clients'),
        axios.get('/recipes')
      ]);
      setOrders(ordersRes.data);
      setClients(clientsRes.data);
      setRecipes(recipesRes.data);
    } catch (error) {
      toast.error('Помилка завантаження даних');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing && selectedOrder) {
        await axios.put(`/orders/${selectedOrder.id}`, formData);
        toast.success('Замовлення оновлено');
      } else {
        await axios.post('/orders', formData);
        toast.success('Замовлення створено');
      }
      setDialogOpen(false);
      setDetailsOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Помилка');
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await axios.put(`/orders/${orderId}`, { status: newStatus });
      toast.success('Статус оновлено');
      fetchData();
    } catch (error) {
      toast.error('Помилка оновлення статусу');
    }
  };

  const handleDelete = async () => {
    if (!selectedOrder) return;
    
    if (!window.confirm('Ви впевнені, що хочете видалити це замовлення?')) return;
    
    try {
      await axios.delete(`/orders/${selectedOrder.id}`);
      toast.success('Замовлення видалено');
      setDialogOpen(false);
      setDetailsOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Помилка видалення');
    }
  };

  const addRecipeToOrder = () => {
    setFormData({
      ...formData,
      orderRecipes: [...formData.orderRecipes, { recipeId: '', quantity: 1 }]
    });
  };

  const removeRecipeFromOrder = (index) => {
    const newRecipes = formData.orderRecipes.filter((_, i) => i !== index);
    setFormData({ ...formData, orderRecipes: newRecipes });
    calculateOrderTotal(newRecipes);
  };

  const updateOrderRecipe = async (index, field, value) => {
    const newRecipes = [...formData.orderRecipes];
    newRecipes[index][field] = field === 'quantity' ? parseInt(value) : value;
    setFormData({ ...formData, orderRecipes: newRecipes });
    
    if (field === 'recipeId' || field === 'quantity') {
      await calculateOrderTotal(newRecipes);
    }
  };

  const calculateOrderTotal = async (orderRecipes) => {
    let total = 0;
    for (const orderRecipe of orderRecipes) {
      if (orderRecipe.recipeId && orderRecipe.quantity > 0) {
        try {
          const response = await axios.get(`/recipes/${orderRecipe.recipeId}/calculate`);
          total += response.data.finalPrice * orderRecipe.quantity;
        } catch (error) {
          console.error('Error calculating recipe price:', error);
        }
      }
    }
    setFormData(prev => ({ ...prev, total: total }));
  };

  const resetForm = () => {
    setFormData({
      clientId: '',
      item: '',
      dueDate: '',
      total: 0,
      notes: '',
      orderRecipes: []
    });
    setIsEditing(false);
    setSelectedOrder(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (order) => {
    setSelectedOrder(order);
    setFormData({
      clientId: order.clientId,
      item: order.item,
      dueDate: order.dueDate?.substring(0, 16),
      total: order.total,
      notes: order.notes || '',
      orderRecipes: []
    });
    setIsEditing(true);
    setDetailsOpen(false);
    setDialogOpen(true);
  };

  const openDetailsDialog = (order) => {
    setSelectedOrder(order);
    setDetailsOpen(true);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Замовлення
          </h1>
          <p className="text-muted-foreground">Керуйте всіма замовленнями</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} data-testid="create-order-button">
              <Plus className="mr-2 h-4 w-4" />
              Нове замовлення
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{isEditing ? 'Редагувати замовлення' : 'Нове замовлення'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="clientId">Клієнт</Label>
                <Select value={formData.clientId} onValueChange={(value) => setFormData({ ...formData, clientId: value })} required>
                  <SelectTrigger data-testid="order-client-select">
                    <SelectValue placeholder="Оберіть клієнта" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Рецепти</Label>
                  <Button type="button" size="sm" onClick={addRecipeToOrder} data-testid="add-recipe-to-order-button">
                    <Plus className="h-4 w-4 mr-1" />
                    Додати рецепт
                  </Button>
                </div>
                <div className="space-y-2">
                  {formData.orderRecipes.map((orderRecipe, index) => (
                    <div key={index} className="flex gap-2 items-center p-3 border border-border rounded-lg">
                      <Select
                        value={orderRecipe.recipeId}
                        onValueChange={(value) => updateOrderRecipe(index, 'recipeId', value)}
                      >
                        <SelectTrigger className="flex-1" data-testid={`order-recipe-select-${index}`}>
                          <SelectValue placeholder="Оберіть рецепт" />
                        </SelectTrigger>
                        <SelectContent>
                          {recipes.map((recipe) => (
                            <SelectItem key={recipe.id} value={recipe.id}>{recipe.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        min="1"
                        placeholder="Кількість"
                        value={orderRecipe.quantity}
                        onChange={(e) => updateOrderRecipe(index, 'quantity', e.target.value)}
                        className="w-24"
                        data-testid={`order-recipe-quantity-${index}`}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeRecipeFromOrder(index)}
                        data-testid={`remove-order-recipe-${index}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="item">Назва замовлення</Label>
                <Input
                  id="item"
                  value={formData.item}
                  onChange={(e) => setFormData({ ...formData, item: e.target.value })}
                  placeholder="Наприклад: Весільний торт"
                  required
                  data-testid="order-item-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Дата виконання</Label>
                <Input
                  id="dueDate"
                  type="datetime-local"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  required
                  data-testid="order-duedate-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="total">Сума (грн)</Label>
                <Input
                  id="total"
                  type="number"
                  step="0.01"
                  value={formData.total}
                  onChange={(e) => setFormData({ ...formData, total: parseFloat(e.target.value) })}
                  required
                  data-testid="order-total-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Примітки</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  data-testid="order-notes-input"
                />
              </div>
              <DialogFooter className={isEditing ? "flex justify-between" : ""}>
                {isEditing && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDelete}
                    data-testid="order-delete-button"
                  >
                    Видалити
                  </Button>
                )}
                <Button type="submit" data-testid="order-submit-button">
                  {isEditing ? 'Зберегти' : 'Створити'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {orders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">ID</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Клієнт</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Виріб</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Статус</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Дата</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Сума</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {orders.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-muted/30 cursor-pointer transition-colors"
                      onClick={() => openDetailsDialog(order)}
                      data-testid={`order-row-${order.id}`}
                    >
                      <td className="px-4 py-3 text-sm text-muted-foreground">...{order.id.slice(-6)}</td>
                      <td className="px-4 py-3 text-sm font-medium">{order.client?.name}</td>
                      <td className="px-4 py-3 text-sm">{order.item}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                          {statusLabels[order.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {order.dueDate ? format(new Date(order.dueDate), 'dd MMM yyyy, HH:mm', { locale: uk }) : ''}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">{order.total.toFixed(2)} грн</td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" data-testid={`order-menu-${order.id}`}>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {statusOptions.map((status) => (
                              <DropdownMenuItem
                                key={status}
                                onClick={() => handleStatusChange(order.id, status)}
                                data-testid={`status-${status}`}
                              >
                                {statusLabels[status]}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <img
                src="https://images.unsplash.com/photo-1555507036-ab1f4038808a"
                alt="No orders"
                className="w-48 h-48 mx-auto mb-4 rounded-lg opacity-50 object-cover"
              />
              <p className="text-muted-foreground mb-4">Ще немає замовлень</p>
              <Button onClick={openCreateDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Створити перше замовлення
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Деталі замовлення</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Клієнт</Label>
                <p className="text-lg font-medium">{selectedOrder.client?.name}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Виріб</Label>
                <p className="text-lg font-medium">{selectedOrder.item}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Статус</Label>
                <p className="text-lg">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[selectedOrder.status]}`}>
                    {statusLabels[selectedOrder.status]}
                  </span>
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Дата виконання</Label>
                <p className="text-lg font-medium">
                  {selectedOrder.dueDate ? format(new Date(selectedOrder.dueDate), 'dd MMMM yyyy, HH:mm', { locale: uk }) : ''}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Сума</Label>
                <p className="text-2xl font-bold text-primary">{selectedOrder.total.toFixed(2)} грн</p>
              </div>
              {selectedOrder.notes && (
                <div>
                  <Label className="text-muted-foreground">Примітки</Label>
                  <p className="text-sm">{selectedOrder.notes}</p>
                </div>
              )}
              <DialogFooter>
                <Button onClick={() => openEditDialog(selectedOrder)} data-testid="edit-order-button">
                  Редагувати
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}