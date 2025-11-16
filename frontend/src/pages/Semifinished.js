import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, MoreVertical, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export default function Semifinished() {
  const { t } = useTranslation();
  const [semiProducts, setSemiProducts] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    unit: 'кг',
    ingredients: [{ ingredientId: '', quantity: 0 }]
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [semiRes, ingRes] = await Promise.all([
        axios.get('/semifinished'),
        axios.get('/ingredients')
      ]);
      setSemiProducts(semiRes.data);
      setIngredients(ingRes.data);
    } catch (err) {
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (sp) => {
    setIsEditing(true);
    setEditingId(sp._id);
    setFormData({
      name: sp.name,
      unit: sp.unit,
      ingredients: sp.ingredients || [{ ingredientId: '', quantity: 0 }]
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await axios.put(`/semifinished/${editingId}`, formData);
        toast.success(t('semifinished.updated'));
      } else {
        await axios.post('/semifinished', formData);
        toast.success(t('semifinished.created'));
      }
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (err) {
      toast.error(t('common.error'));
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(t('semifinished.deleteConfirm'))) return;
    try {
      await axios.delete(`/semifinished/${editingId}`);
      toast.success(t('semifinished.deleted'));
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (err) {
      toast.error(t('common.error'));
    }
  };

  const resetForm = () => {
    setFormData({ name: '', unit: 'кг', ingredients: [{ ingredientId: '', quantity: 0 }] });
    setIsEditing(false);
    setEditingId(null);
  };

  const addIngredientRow = () => {
    setFormData(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, { ingredientId: '', quantity: 0 }]
    }));
  };

  const removeIngredientRow = (index) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }));
  };

  const updateIngredientRow = (index, field, value) => {
    setFormData(prev => {
      const newIngredients = [...prev.ingredients];
      newIngredients[index][field] = value;
      return { ...prev, ingredients: newIngredients };
    });
  };

  const computeCost = (spIngredients) => {
    let total = 0;
    for (const ing of spIngredients) {
      const ingredient = ingredients.find(i => i._id === ing.ingredientId);
      if (ingredient) {
        total += ingredient.price * ing.quantity;
      }
    }
    return total.toFixed(2);
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
        <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          {t('semifinished.newSemifinished')}
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {semiProducts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="text-left p-4 font-semibold">{t('semifinished.name')}</th>
                    <th className="text-left p-4 font-semibold">{t('semifinished.unit')}</th>
                    <th className="text-left p-4 font-semibold">{t('recipes.costPrice')}</th>
                    <th className="text-right p-4 font-semibold">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {semiProducts.map((sp) => (
                    <tr key={sp._id} className="hover:bg-muted/50 transition-colors">
                      <td className="p-4">{sp.name}</td>
                      <td className="p-4">{sp.unit}</td>
                      <td className="p-4">{computeCost(sp.ingredients)} грн</td>
                      <td className="p-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(sp)}>
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
              <p className="text-lg text-muted-foreground mb-2">{t('semifinished.noSemifinished')}</p>
              <p className="text-sm text-muted-foreground">{t('semifinished.addFirst')}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{isEditing ? t('semifinished.editSemifinished') : t('semifinished.newSemifinished')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t('semifinished.name')}</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">{t('semifinished.unit')}</Label>
                <Select value={formData.unit} onValueChange={(val) => setFormData({ ...formData, unit: val })}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('semifinished.unitPlaceholder')} />
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
                <Label>{t('semifinished.ingredients')}</Label>
                {formData.ingredients.map((ing, idx) => (
                  <div key={idx} className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Label htmlFor={`ing-${idx}`}>{t('recipes.ingredient')}</Label>
                      <Select
                        value={ing.ingredientId}
                        onValueChange={(val) => updateIngredientRow(idx, 'ingredientId', val)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('semifinished.selectIngredient')} />
                        </SelectTrigger>
                        <SelectContent>
                          {ingredients.map(i => (
                            <SelectItem key={i._id} value={i._id}>{i.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-32">
                      <Label htmlFor={`qty-${idx}`}>{t('semifinished.quantity')}</Label>
                      <Input
                        id={`qty-${idx}`}
                        type="number"
                        step="0.01"
                        value={ing.quantity}
                        onChange={(e) => updateIngredientRow(idx, 'quantity', parseFloat(e.target.value))}
                        required
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeIngredientRow(idx)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addIngredientRow}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('semifinished.addIngredient')}
                </Button>
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

