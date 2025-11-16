import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, MoreVertical } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export default function Ingredients() {
  const { t } = useTranslation();
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', unit: 'кг', price: 0 });

  useEffect(() => {
    fetchIngredients();
  }, []);

  const fetchIngredients = async () => {
    try {
      const res = await axios.get('/ingredients');
      setIngredients(res.data);
    } catch (err) {
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (ingredient) => {
    setIsEditing(true);
    setEditingId(ingredient._id);
    setFormData({ name: ingredient.name, unit: ingredient.unit, price: ingredient.price });
    setDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await axios.put(`/ingredients/${editingId}`, formData);
        toast.success(t('ingredients.updated'));
      } else {
        await axios.post('/ingredients', formData);
        toast.success(t('ingredients.created'));
      }
      setDialogOpen(false);
      resetForm();
      fetchIngredients();
    } catch (err) {
      toast.error(t('common.error'));
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(t('ingredients.deleteConfirm'))) return;
    try {
      await axios.delete(`/ingredients/${editingId}`);
      toast.success(t('ingredients.deleted'));
      setDialogOpen(false);
      resetForm();
      fetchIngredients();
    } catch (err) {
      toast.error(t('common.error'));
    }
  };

  const resetForm = () => {
    setFormData({ name: '', unit: 'кг', price: 0 });
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('ingredients.title')}</h1>
        <Button onClick={openNewDialog}>
          {t('ingredients.newIngredient')}
        </Button>
      </div>

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
            <DialogHeader>
              <DialogTitle>{isEditing ? t('ingredients.editIngredient') : t('ingredients.newIngredient')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t('ingredients.name')}</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">{t('ingredients.unit')}</Label>
                <Select value={formData.unit} onValueChange={(val) => setFormData({ ...formData, unit: val })}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('ingredients.unitPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="кг">кг</SelectItem>
                    <SelectItem value="г">г</SelectItem>
                    <SelectItem value="л">л</SelectItem>
                    <SelectItem value="мл">мл</SelectItem>
                    <SelectItem value="шт">шт</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">{t('ingredients.pricePerUnit')}</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  {t('common.cancel')}
                </Button>
                <Button type="submit">{isEditing ? t('common.save') : t('common.create')}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left">{t('ingredients.name')}</th>
              <th className="border p-2 text-left">{t('ingredients.unit')}</th>
              <th className="border p-2 text-left">{t('ingredients.pricePerUnit')}</th>
              <th className="border p-2 text-left">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {ingredients.length === 0 ? (
              <tr>
                <td colSpan={4} className="border p-4 text-center text-gray-500">
                  {t('ingredients.noIngredients')}
                </td>
              </tr>
            ) : (
              ingredients.map((ingredient) => (
                <tr key={ingredient._id}>
                  <td className="border p-2">{ingredient.name}</td>
                  <td className="border p-2">{ingredient.unit}</td>
                  <td className="border p-2">{ingredient.price} грн</td>
                  <td className="border p-2 space-x-2">
                    <Button size="sm" onClick={() => openEditDialog(ingredient)}>
                      {t('common.edit')}
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(ingredient._id)}>
                      {t('common.delete')}
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Ingredients;
