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

  // UI Components (shadcn)
  const Dialog = ({ open, onOpenChange, children }) => {
    if (!open) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50" onClick={() => onOpenChange(false)}></div>
        <div className="relative bg-white rounded-lg shadow-lg z-10">{children}</div>
      </div>
    );
  };

  const DialogTrigger = ({ children }) => <>{children}</>;
  const DialogContent = ({ children, className }) => <div className={className}>{children}</div>;
  const DialogHeader = ({ children }) => <div className="p-4 border-b">{children}</div>;
  const DialogTitle = ({ children }) => <h2 className="text-xl font-bold">{children}</h2>;
  const Button = ({ children, onClick, variant, size, type }) => (
    <button
      type={type || 'button'}
      onClick={onClick}
      className={`px-4 py-2 rounded ${variant === 'destructive' ? 'bg-red-600 text-white' : variant === 'outline' ? 'border border-gray-300' : 'bg-blue-600 text-white'} ${size === 'sm' ? 'text-sm' : ''}`}
    >
      {children}
    </button>
  );
  const Input = ({ ...props }) => <input {...props} className="border rounded p-2 w-full" />;
  const Label = ({ children, htmlFor }) => <label htmlFor={htmlFor} className="block font-medium mb-1">{children}</label>;
  const Select = ({ value, onValueChange, children }) => (
    <select value={value} onChange={(e) => onValueChange(e.target.value)} className="border rounded p-2 w-full">
      {children}
    </select>
  );
  const SelectTrigger = ({ children }) => <>{children}</>;
  const SelectValue = ({ placeholder }) => <option value="">{placeholder}</option>;
  const SelectContent = ({ children }) => <>{children}</>;
  const SelectItem = ({ value, children }) => <option value={value}>{children}</option>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('semifinished.title')}</h1>
        <Button onClick={openNewDialog}>
          {t('semifinished.newSemifinished')}
        </Button>
      </div>

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
                      variant="destructive"
                      size="sm"
                      onClick={() => removeIngredientRow(idx)}
                    >
                      {t('common.delete')}
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addIngredientRow}>
                  + {t('semifinished.addIngredient')}
                </Button>
              </div>

              <div className="flex justify-end gap-2 pt-4">
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
              <th className="border p-2 text-left">{t('semifinished.name')}</th>
              <th className="border p-2 text-left">{t('semifinished.unit')}</th>
              <th className="border p-2 text-left">{t('recipes.costPrice')}</th>
              <th className="border p-2 text-left">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {semiProducts.length === 0 ? (
              <tr>
                <td colSpan={4} className="border p-4 text-center text-gray-500">
                  {t('semifinished.noSemifinished')}
                </td>
              </tr>
            ) : (
              semiProducts.map((sp) => (
                <tr key={sp._id}>
                  <td className="border p-2">{sp.name}</td>
                  <td className="border p-2">{sp.unit}</td>
                  <td className="border p-2">{computeCost(sp.ingredients)} грн</td>
                  <td className="border p-2 space-x-2">
                    <Button size="sm" onClick={() => openEditDialog(sp)}>
                      {t('common.edit')}
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(sp._id)}>
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

export default Semifinished;
