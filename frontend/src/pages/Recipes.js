import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const API_URL = process.env.REACT_APP_BACKEND_URL;

function Recipes() {
  const { t } = useTranslation();
  const [recipes, setRecipes] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [semiProducts, setSemiProducts] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    laborCost: 0,
    components: [{ type: 'ingredient', id: '', quantity: 0 }]
  });

  useEffect(() => {
    fetchRecipes();
    fetchIngredients();
    fetchSemiProducts();
  }, []);

  const fetchRecipes = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/recipes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setRecipes(data);
    } catch (err) {
      console.error('Failed to fetch recipes', err);
    }
  };

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

  const fetchSemiProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/semifinished`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setSemiProducts(data);
    } catch (err) {
      console.error('Failed to fetch semi-products', err);
    }
  };

  const openNewDialog = () => {
    setIsEditing(false);
    setCurrentId(null);
    setFormData({
      name: '',
      description: '',
      laborCost: 0,
      components: [{ type: 'ingredient', id: '', quantity: 0 }]
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (recipe) => {
    setIsEditing(true);
    setCurrentId(recipe._id);
    setFormData({
      name: recipe.name,
      description: recipe.description || '',
      laborCost: recipe.laborCost || 0,
      components: recipe.components || [{ type: 'ingredient', id: '', quantity: 0 }]
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const url = isEditing
        ? `${API_URL}/api/recipes/${currentId}`
        : `${API_URL}/api/recipes`;
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
        fetchRecipes();
        const toast = (await import('sonner')).toast;
        toast.success(isEditing ? t('recipes.updated') : t('recipes.created'));
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
    if (!window.confirm(t('recipes.deleteConfirm'))) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/recipes/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchRecipes();
        const toast = (await import('sonner')).toast;
        toast.success(t('recipes.deleted'));
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

  const handleCopy = async (recipe) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/recipes`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: `${recipe.name} (копія)`,
          description: recipe.description,
          laborCost: recipe.laborCost,
          components: recipe.components
        })
      });
      if (res.ok) {
        fetchRecipes();
        const toast = (await import('sonner')).toast;
        toast.success(t('recipes.copied'));
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

  const addComponentRow = () => {
    setFormData(prev => ({
      ...prev,
      components: [...prev.components, { type: 'ingredient', id: '', quantity: 0 }]
    }));
  };

  const removeComponentRow = (index) => {
    setFormData(prev => ({
      ...prev,
      components: prev.components.filter((_, i) => i !== index)
    }));
  };

  const updateComponentRow = (index, field, value) => {
    setFormData(prev => {
      const newComponents = [...prev.components];
      newComponents[index][field] = value;
      // Reset id when type changes
      if (field === 'type') {
        newComponents[index].id = '';
      }
      return { ...prev, components: newComponents };
    });
  };

  const computeCost = (recipeComponents) => {
    let total = 0;
    for (const comp of recipeComponents) {
      if (comp.type === 'ingredient') {
        const ingredient = ingredients.find(i => i._id === comp.id);
        if (ingredient) {
          total += ingredient.price * comp.quantity;
        }
      } else if (comp.type === 'semifinished') {
        const sp = semiProducts.find(s => s._id === comp.id);
        if (sp && sp.ingredients) {
          for (const ing of sp.ingredients) {
            const ingredient = ingredients.find(i => i._id === ing.ingredientId);
            if (ingredient) {
              total += ingredient.price * ing.quantity * comp.quantity;
            }
          }
        }
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
  const Textarea = ({ ...props }) => <textarea {...props} className="border rounded p-2 w-full" />;
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
        <h1 className="text-2xl font-bold">{t('recipes.title')}</h1>
        <Button onClick={openNewDialog}>
          {t('recipes.newRecipe')}
        </Button>
      </div>

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{isEditing ? t('recipes.editRecipe') : t('recipes.newRecipe')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t('recipes.name')}</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">{t('orders.notes')}</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="laborCost">{t('recipes.laborCost')}</Label>
                <Input
                  id="laborCost"
                  type="number"
                  step="0.01"
                  value={formData.laborCost}
                  onChange={(e) => setFormData({ ...formData, laborCost: parseFloat(e.target.value) })}
                />
              </div>

              <div className="space-y-2">
                <Label>{t('recipes.components')}</Label>
                {formData.components.map((comp, idx) => (
                  <div key={idx} className="flex gap-2 items-end">
                    <div className="w-40">
                      <Label htmlFor={`type-${idx}`}>{t('recipes.componentType')}</Label>
                      <Select
                        value={comp.type}
                        onValueChange={(val) => updateComponentRow(idx, 'type', val)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('recipes.componentType')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ingredient">{t('recipes.ingredient')}</SelectItem>
                          <SelectItem value="semifinished">{t('recipes.semifinished')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1">
                      <Label htmlFor={`comp-${idx}`}>{comp.type === 'ingredient' ? t('recipes.ingredient') : t('recipes.semifinished')}</Label>
                      <Select
                        value={comp.id}
                        onValueChange={(val) => updateComponentRow(idx, 'id', val)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={comp.type === 'ingredient' ? t('recipes.selectIngredient') : t('recipes.selectSemifinished')} />
                        </SelectTrigger>
                        <SelectContent>
                          {comp.type === 'ingredient'
                            ? ingredients.map(i => <SelectItem key={i._id} value={i._id}>{i.name}</SelectItem>)
                            : semiProducts.map(s => <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>)
                          }
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-32">
                      <Label htmlFor={`qty-${idx}`}>{t('recipes.quantity')}</Label>
                      <Input
                        id={`qty-${idx}`}
                        type="number"
                        step="0.01"
                        value={comp.quantity}
                        onChange={(e) => updateComponentRow(idx, 'quantity', parseFloat(e.target.value))}
                        required
                      />
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeComponentRow(idx)}
                    >
                      {t('common.delete')}
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addComponentRow}>
                  + {t('recipes.addComponent')}
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
              <th className="border p-2 text-left">{t('recipes.name')}</th>
              <th className="border p-2 text-left">{t('orders.notes')}</th>
              <th className="border p-2 text-left">{t('recipes.costPrice')}</th>
              <th className="border p-2 text-left">{t('recipes.laborCost')}</th>
              <th className="border p-2 text-left">{t('recipes.finalPrice')}</th>
              <th className="border p-2 text-left">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {recipes.length === 0 ? (
              <tr>
                <td colSpan={6} className="border p-4 text-center text-gray-500">
                  {t('recipes.noRecipes')}
                </td>
              </tr>
            ) : (
              recipes.map((recipe) => {
                const cost = parseFloat(computeCost(recipe.components || []));
                const labor = recipe.laborCost || 0;
                const total = (cost + labor).toFixed(2);
                return (
                  <tr key={recipe._id}>
                    <td className="border p-2">{recipe.name}</td>
                    <td className="border p-2">{recipe.description || '—'}</td>
                    <td className="border p-2">{cost} грн</td>
                    <td className="border p-2">{labor} грн</td>
                    <td className="border p-2">{total} грн</td>
                    <td className="border p-2 space-x-2">
                      <Button size="sm" onClick={() => openEditDialog(recipe)}>
                        {t('common.edit')}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleCopy(recipe)}>
                        {t('recipes.copy')}
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(recipe._id)}>
                        {t('common.delete')}
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Recipes;
