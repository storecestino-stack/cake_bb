import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, MoreVertical, Copy, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export default function Recipes() {
  const { t } = useTranslation();
  const [recipes, setRecipes] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [semiProducts, setSemiProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [categoryFormData, setCategoryFormData] = useState({ name: '', color: '#3B82F6' });
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    description: '',
    laborCost: 0,
    components: [{ type: 'ingredient', id: '', quantity: 0 }]
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [recipesRes, ingRes, semiRes, catRes] = await Promise.all([
        axios.get('/recipes'),
        axios.get('/ingredients'),
        axios.get('/semifinished'),
        axios.get('/categories')
      ]);
      setRecipes(recipesRes.data);
      setIngredients(ingRes.data);
      setSemiProducts(semiRes.data);
      setCategories(catRes.data);
    } catch (err) {
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (recipe) => {
    setIsEditing(true);
    setEditingId(recipe._id);
    setFormData({
      name: recipe.name,
      categoryId: recipe.categoryId || '',
      description: recipe.description || '',
      laborCost: recipe.laborCost || 0,
      components: recipe.components || [{ type: 'ingredient', id: '', quantity: 0 }]
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await axios.put(`/recipes/${editingId}`, formData);
        toast.success(t('recipes.updated'));
      } else {
        await axios.post('/recipes', formData);
        toast.success(t('recipes.created'));
      }
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (err) {
      toast.error(t('common.error'));
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(t('recipes.deleteConfirm'))) return;
    try {
      await axios.delete(`/recipes/${editingId}`);
      toast.success(t('recipes.deleted'));
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (err) {
      toast.error(t('common.error'));
    }
  };

  const handleCopy = async (recipe) => {
    try {
      await axios.post('/recipes', {
        name: `${recipe.name} (копія)`,
        description: recipe.description,
        laborCost: recipe.laborCost,
        components: recipe.components
      });
      toast.success(t('recipes.copied'));
      fetchData();
    } catch (err) {
      toast.error(t('common.error'));
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      categoryId: '',
      description: '',
      laborCost: 0,
      components: [{ type: 'ingredient', id: '', quantity: 0 }]
    });
    setIsEditing(false);
    setEditingId(null);
  };

  const openCategoryDialog = (category = null) => {
    if (category) {
      setCategoryFormData({ name: category.name, color: category.color });
      setEditingCategoryId(category.id);
    } else {
      setCategoryFormData({ name: '', color: '#3B82F6' });
      setEditingCategoryId(null);
    }
    setCategoryDialogOpen(true);
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCategoryId) {
        await axios.put(`/categories/${editingCategoryId}`, categoryFormData);
        toast.success(t('recipes.categoryUpdated'));
      } else {
        await axios.post('/categories', categoryFormData);
        toast.success(t('recipes.categoryCreated'));
      }
      setCategoryDialogOpen(false);
      fetchData();
    } catch (err) {
      toast.error(t('common.error'));
    }
  };

  const handleCategoryDelete = async (categoryId) => {
    try {
      await axios.delete(`/categories/${categoryId}`);
      toast.success(t('recipes.categoryDeleted'));
      fetchData();
    } catch (err) {
      if (err.response?.status === 400) {
        toast.error(t('recipes.categoryDeleteError'));
      } else {
        toast.error(t('common.error'));
      }
    }
  };

  const filteredRecipes = selectedCategory === 'all' 
    ? recipes 
    : selectedCategory === 'uncategorized'
    ? recipes.filter(r => !r.categoryId)
    : recipes.filter(r => r.categoryId === selectedCategory);

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
            {t('recipes.title')}
          </h1>
          <p className="text-muted-foreground">{t('recipes.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => openCategoryDialog()}>
            {t('recipes.manageCategories')}
          </Button>
          <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            {t('recipes.newRecipe')}
          </Button>
        </div>
      </div>

      {/* Category filters */}
      {categories.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('all')}
          >
            {t('recipes.allCategories')}
          </Button>
          <Button
            variant={selectedCategory === 'uncategorized' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('uncategorized')}
          >
            {t('recipes.uncategorized')}
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(cat.id)}
              style={{ 
                borderColor: selectedCategory === cat.id ? cat.color : undefined,
                backgroundColor: selectedCategory === cat.id ? cat.color : undefined
              }}
            >
              {cat.name}
            </Button>
          ))}
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {filteredRecipes.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="text-left p-4 font-semibold">{t('recipes.name')}</th>
                    <th className="text-left p-4 font-semibold">{t('recipes.category')}</th>
                    <th className="text-left p-4 font-semibold">{t('orders.notes')}</th>
                    <th className="text-left p-4 font-semibold">{t('recipes.costPrice')}</th>
                    <th className="text-left p-4 font-semibold">{t('recipes.laborCost')}</th>
                    <th className="text-left p-4 font-semibold">{t('recipes.finalPrice')}</th>
                    <th className="text-right p-4 font-semibold">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredRecipes.map((recipe) => {
                    const category = categories.find(c => c.id === recipe.categoryId);
                    const cost = parseFloat(computeCost(recipe.components || []));
                    const labor = recipe.laborCost || 0;
                    const total = (cost + labor).toFixed(2);
                    return (
                      <tr key={recipe._id} className="hover:bg-muted/50 transition-colors">
                        <td className="p-4">{recipe.name}</td>
                        <td className="p-4">
                          {category ? (
                            <span 
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                              style={{ backgroundColor: category.color }}
                            >
                              {category.name}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </td>
                        <td className="p-4">{recipe.description || '—'}</td>
                        <td className="p-4">{cost} грн</td>
                        <td className="p-4">{labor} грн</td>
                        <td className="p-4">{total} грн</td>
                        <td className="p-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditDialog(recipe)}>
                                {t('common.edit')}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleCopy(recipe)}>
                                <Copy className="mr-2 h-4 w-4" />
                                {t('recipes.copy')}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-lg text-muted-foreground mb-2">{t('recipes.noRecipes')}</p>
              <p className="text-sm text-muted-foreground">{t('recipes.addFirst')}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
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
                <Label htmlFor="category">{t('recipes.category')}</Label>
                <Select value={formData.categoryId || 'uncategorized'} onValueChange={(val) => setFormData({ ...formData, categoryId: val === 'uncategorized' ? '' : val })}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('recipes.selectCategory')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="uncategorized">{t('recipes.uncategorized')}</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                      variant="ghost"
                      size="icon"
                      onClick={() => removeComponentRow(idx)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addComponentRow}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('recipes.addComponent')}
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

      {/* Category Management Dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategoryId ? t('recipes.editCategory') : t('recipes.newCategory')}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCategorySubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="categoryName">{t('recipes.categoryName')}</Label>
              <Input
                id="categoryName"
                value={categoryFormData.name}
                onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoryColor">{t('recipes.categoryColor')}</Label>
              <div className="flex gap-2">
                <Input
                  id="categoryColor"
                  type="color"
                  value={categoryFormData.color}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, color: e.target.value })}
                  className="w-20 h-10"
                />
                <Input
                  type="text"
                  value={categoryFormData.color}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, color: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>
            <DialogFooter className={editingCategoryId ? "flex justify-between" : ""}>
              {editingCategoryId && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    handleCategoryDelete(editingCategoryId);
                    setCategoryDialogOpen(false);
                  }}
                >
                  {t('common.delete')}
                </Button>
              )}
              <Button type="submit">
                {editingCategoryId ? t('common.save') : t('common.create')}
              </Button>
            </DialogFooter>
          </form>

          {/* Existing Categories List */}
          {!editingCategoryId && categories.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <h4 className="font-semibold mb-3">{t('recipes.manageCategories')}</h4>
              <div className="space-y-2">
                {categories.map((cat) => {
                  const recipesInCategory = recipes.filter(r => r.categoryId === cat.id).length;
                  return (
                    <div key={cat.id} className="flex items-center justify-between p-2 rounded hover:bg-muted">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span>{cat.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({recipesInCategory} {recipesInCategory === 1 ? 'виріб' : 'виробів'})
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openCategoryDialog(cat)}
                      >
                        {t('common.edit')}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
