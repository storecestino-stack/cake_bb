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
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {t('ingredients.title')}
          </h1>
          <p className="text-muted-foreground">{t('ingredients.subtitle')}</p>
        </div>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          {t('ingredients.newIngredient')}
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {ingredients.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="text-left p-4 font-semibold">{t('ingredients.name')}</th>
                    <th className="text-left p-4 font-semibold">{t('ingredients.unit')}</th>
                    <th className="text-left p-4 font-semibold">{t('ingredients.pricePerUnit')}</th>
                    <th className="text-right p-4 font-semibold">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {ingredients.map((ingredient) => (
                    <tr key={ingredient._id} className="hover:bg-muted/50 transition-colors">
                      <td className="p-4">{ingredient.name}</td>
                      <td className="p-4">{ingredient.unit}</td>
                      <td className="p-4">{ingredient.price} грн</td>
                      <td className="p-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(ingredient)}>
                              {t('common.edit')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-lg text-muted-foreground mb-2">{t('ingredients.noIngredients')}</p>
              <p className="text-sm text-muted-foreground">{t('ingredients.addFirst')}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
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
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>
            <DialogFooter className={isEditing ? "flex justify-between" : ""}>
              {isEditing && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                >
                  {t('common.delete')}
                </Button>
              )}
              <Button type="submit">
                {isEditing ? t('common.save') : t('common.create')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

