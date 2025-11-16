import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const API_URL = process.env.REACT_APP_BACKEND_URL;

function Ingredients() {
  const { t } = useTranslation();
  const [ingredients, setIngredients] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [formData, setFormData] = useState({ name: '', unit: 'кг', price: 0 });

  useEffect(() => {
    fetchIngredients();
  }, []);

  const fetchIngredients = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/ingredients`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setIngredients(data);
    } catch (err) {
      console.error('Failed to fetch ingredients', err);
    }
  };

  const openNewDialog = () => {
    setIsEditing(false);
    setCurrentId(null);
    setFormData({ name: '', unit: 'кг', price: 0 });
    setIsDialogOpen(true);
  };

  const openEditDialog = (ingredient) => {
    setIsEditing(true);
    setCurrentId(ingredient._id);
    setFormData({ name: ingredient.name, unit: ingredient.unit, price: ingredient.price });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const url = isEditing
        ? `${API_URL}/api/ingredients/${currentId}`
        : `${API_URL}/api/ingredients`;
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setIsDialogOpen(false);
        fetchIngredients();
        const toast = (await import('sonner')).toast;
        toast.success(isEditing ? t('ingredients.updated') : t('ingredients.created'));
      } else {
        const toast = (await import('sonner')).toast;
        toast.error(t('common.error'));
      }
    } catch (err) {
      console.error(err);
      const toast = (await import('sonner')).toast;
      toast.error(t('common.error'));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('ingredients.deleteConfirm'))) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/ingredients/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchIngredients();
        const toast = (await import('sonner')).toast;
        toast.success(t('ingredients.deleted'));
      } else {
        const toast = (await import('sonner')).toast;
        toast.error(t('common.error'));
      }
    } catch (err) {
      console.error(err);
      const toast = (await import('sonner')).toast;
      toast.error(t('common.error'));
    }
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
