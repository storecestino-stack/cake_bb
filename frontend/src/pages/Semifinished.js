import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, MoreVertical, X } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export default function Semifinished() {
  const { t } = useTranslation();
  const [semifinished, setSemifinished] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    unit: '',
    laborCost: 0,
    ingredients: []
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [costs, setCosts] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (formData.ingredients.length > 0) {
      calculateCost();
    }
  }, [formData.ingredients, formData.laborCost]);

  const fetchData = async () => {
    try {
      const [semifinishedRes, ingredientsRes] = await Promise.all([
        axios.get('/semifinished'),
        axios.get('/ingredients')
      ]);
      setSemifinished(semifinishedRes.data);
      setIngredients(ingredientsRes.data);
    } catch (error) {
      toast.error(t('semifinished.errorLoad'));
    } finally {
      setLoading(false);
    }
  };

  const calculateCost = () => {
    let totalCost = 0;
    formData.ingredients.forEach(item => {
      const ingredient = ingredients.find(i => i.id === item.ingredientId);
      if (ingredient) {
        totalCost += ingredient.price * item.quantity;
      }
    });
    
    const laborCost = parseFloat(formData.laborCost) || 0;
    const finalPrice = totalCost + laborCost;
    
    setCosts({
      ingredientsCost: totalCost,
      laborCost: laborCost,
      totalCost: totalCost + laborCost,
      finalPrice: finalPrice
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        name: formData.name,
        unit: formData.unit,
        laborCost: parseFloat(formData.laborCost) || 0,
        ingredients: formData.ingredients
      };

      if (isEditing) {
        await axios.put(`/semifinished/${editingId}`, data);
        toast.success(t('semifinished.updated'));
      } else {
        await axios.post('/semifinished', data);
        toast.success(t('semifinished.created'));
      }
      
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || t('semifinished.error'));
    }
  };

  const handleEdit = (item) => {
    setFormData({
      name: item.name,
      unit: item.unit,
      laborCost: item.laborCost,
      ingredients: item.ingredients || []
    });
    setEditingId(item.id);
    setIsEditing(true);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!editingId) return;
    
    if (!window.confirm(t('semifinished.deleteConfirm'))) return;
    
    try {
      await axios.delete(`/semifinished/${editingId}`);
      toast.success(t('semifinished.deleted'));
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || t('semifinished.error'));
    }
  };

  const addIngredient = () => {
    setFormData({
      ...formData,
      ingredients: [...formData.ingredients, { ingredientId: '', quantity: 0 }]
    });
  };

  const removeIngredient = (index) => {
    const newIngredients = formData.ingredients.filter((_, i) => i !== index);
    setFormData({ ...formData, ingredients: newIngredients });
  };

  const updateIngredient = (index, field, value) => {
    const newIngredients = [...formData.ingredients];
    newIngredients[index][field] = field === 'quantity' ? parseFloat(value) : value;
    setFormData({ ...formData, ingredients: newIngredients });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      unit: '',
      laborCost: 0,
      ingredients: []
    });
    setIsEditing(false);
    setEditingId(null);
    setCosts({});
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
            {t('semifinished.title')}
          </h1>
          <p className="text-muted-foreground">{t('semifinished.subtitle')}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button data-testid="create-semifinished-button">
              <Plus className="mr-2 h-4 w-4" />
              {t('semifinished.newSemifinished')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{isEditing ? t('semifinished.editSemifinished') : '{t('semifinished.newSemifinished')}'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Назва</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  data-testid="semifinished-name-input"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="unit">Одиниця виміру</Label>
                <Input
                  id="unit"
                  placeholder="кг, шт, л..."
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  required
                  data-testid="semifinished-unit-input"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Інгредієнти</Label>
                  <Button type="button" size="sm" onClick={addIngredient} data-testid="add-ingredient-button">
                    <Plus className="h-4 w-4 mr-1" />
                    Додати
                  </Button>
                </div>
                <div className="space-y-2">
                  {formData.ingredients.map((ing, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <Select
                        value={ing.ingredientId}
                        onValueChange={(value) => updateIngredient(index, 'ingredientId', value)}
                      >
                        <SelectTrigger className="flex-1" data-testid={`ingredient-select-${index}`}>
                          <SelectValue placeholder="Оберіть інгредієнт" />
                        </SelectTrigger>
                        <SelectContent>
                          {ingredients.map((ingredient) => (
                            <SelectItem key={ingredient.id} value={ingredient.id}>
                              {ingredient.name} ({ingredient.unit})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Кількість"
                        value={ing.quantity}
                        onChange={(e) => updateIngredient(index, 'quantity', e.target.value)}
                        className="w-32"
                        data-testid={`ingredient-quantity-${index}`}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeIngredient(index)}
                        data-testid={`remove-ingredient-${index}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="laborCost">Вартість роботи (грн)</Label>
                <Input
                  id="laborCost"
                  type="number"
                  step="0.01"
                  value={formData.laborCost}
                  onChange={(e) => setFormData({ ...formData, laborCost: e.target.value })}
                  data-testid="semifinished-labor-cost-input"
                />
              </div>

              {costs.finalPrice > 0 && (
                <div className="p-4 bg-muted/50 rounded-lg space-y-1">
                  <p className="text-sm text-muted-foreground">Вартість інгредієнтів: {costs.ingredientsCost?.toFixed(2)} грн</p>
                  <p className="text-lg font-bold text-primary">Фінальна ціна: {costs.finalPrice?.toFixed(2)} грн</p>
                </div>
              )}

              <DialogFooter className={isEditing ? "flex justify-between" : ""}>
                {isEditing && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDelete}
                    data-testid="semifinished-delete-button"
                  >
                    Видалити
                  </Button>
                )}
                <Button type="submit" data-testid="semifinished-submit-button">
                  {isEditing ? 'Зберегти' : 'Створити'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {semifinished.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Назва</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Одиниця</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Інгредієнтів</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Ціна</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {semifinished.map((item) => {
                    const totalCost = (item.ingredients || []).reduce((sum, ing) => {
                      const ingredient = ingredients.find(i => i.id === ing.ingredientId);
                      return sum + (ingredient ? ingredient.price * ing.quantity : 0);
                    }, 0);
                    const finalPrice = totalCost + item.laborCost;
                    
                    return (
                      <tr key={item.id} className="hover:bg-muted/30 transition-colors" data-testid={`semifinished-row-${item.id}`}>
                        <td className="px-4 py-3 font-medium text-foreground">{item.name}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{item.unit}</td>
                        <td className="px-4 py-3 text-sm">{item.ingredients?.length || 0}</td>
                        <td className="px-4 py-3 text-sm font-medium">{finalPrice.toFixed(2)} грн</td>
                        <td className="px-4 py-3">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(item)}
                            data-testid={`edit-semifinished-${item.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">{t('semifinished.noSemifinished')}</p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                {t('semifinished.createFirst')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
