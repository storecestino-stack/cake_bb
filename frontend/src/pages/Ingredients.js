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
  const DialogContent = ({ children }) => <div className="p-6">{children}</div>;
  const DialogHeader = ({ children }) => <div className="mb-4">{children}</div>;
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
