import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Pencil } from 'lucide-react';
import { toast } from 'sonner';

export default function Ingredients() {
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', unit: '', price: 0 });
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchIngredients();
  }, []);

  const fetchIngredients = async () => {
    try {
      const response = await axios.get('/ingredients');
      setIngredients(response.data);
    } catch (error) {
      toast.error('Помилка завантаження інгредієнтів');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await axios.put(`/ingredients/${editingId}`, formData);
        toast.success('Інгредієнт оновлено');
      } else {
        await axios.post('/ingredients', formData);
        toast.success('Інгредієнт створено');
      }
      setDialogOpen(false);
      resetForm();
      fetchIngredients();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Помилка');
    }
  };

  const handleEdit = (ingredient) => {
    setFormData({
      name: ingredient.name,
      unit: ingredient.unit,
      price: ingredient.price
    });
    setEditingId(ingredient.id);
    setIsEditing(true);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!editingId) return;
    
    if (!window.confirm('Ви впевнені, що хочете видалити цей інгредієнт?')) return;
    
    try {
      await axios.delete(`/ingredients/${editingId}`);
      toast.success('Інгредієнт видалено');
      setDialogOpen(false);
      resetForm();
      fetchIngredients();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Помилка видалення');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', unit: '', price: 0 });
    setIsEditing(false);
    setEditingId(null);
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
            Інгредієнти
          </h1>
          <p className="text-muted-foreground">Керуйте списком інгредієнтів та цінами</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button data-testid="create-ingredient-button">
              <Plus className="mr-2 h-4 w-4" />
              Новий інгредієнт
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isEditing ? 'Редагувати інгредієнт' : 'Новий інгредієнт'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Назва</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  data-testid="ingredient-name-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Одиниця виміру</Label>
                <Input
                  id="unit"
                  placeholder="грами, кг, штуки..."
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  required
                  data-testid="ingredient-unit-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Ціна за одиницю (грн)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                  required
                  data-testid="ingredient-price-input"
                />
              </div>
              <DialogFooter className={isEditing ? "flex justify-between" : ""}>
                {isEditing && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDelete}
                    data-testid="ingredient-delete-button"
                  >
                    Видалити
                  </Button>
                )}
                <Button type="submit" data-testid="ingredient-submit-button">
                  {isEditing ? 'Зберегти' : 'Створити'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {ingredients.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Назва</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Одиниця</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Ціна</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {ingredients.map((ingredient) => (
                    <tr key={ingredient.id} className="hover:bg-muted/30 transition-colors" data-testid={`ingredient-row-${ingredient.id}`}>
                      <td className="px-4 py-3 font-medium text-foreground">{ingredient.name}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{ingredient.unit}</td>
                      <td className="px-4 py-3 text-sm font-medium">{ingredient.price.toFixed(2)} грн</td>
                      <td className="px-4 py-3">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(ingredient)}
                          data-testid={`edit-ingredient-${ingredient.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">Ще немає інгредієнтів</p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Додати перший інгредієнт
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}