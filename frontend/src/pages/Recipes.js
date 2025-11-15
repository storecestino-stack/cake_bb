import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, X } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function Recipes() {
  const [recipes, setRecipes] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    laborCost: 0,
    ingredients: [],
    imageFile: null
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
  }, [formData.ingredients, formData.laborCost, formData.markup]);

  const fetchData = async () => {
    try {
      const [recipesRes, ingredientsRes] = await Promise.all([
        axios.get('/recipes'),
        axios.get('/ingredients')
      ]);
      setRecipes(recipesRes.data);
      setIngredients(ingredientsRes.data);
    } catch (error) {
      toast.error('Помилка завантаження даних');
    } finally {
      setLoading(false);
    }
  };

  const calculateCost = () => {
    let totalCost = 0;
    formData.ingredients.forEach(recipeIng => {
      const ingredient = ingredients.find(i => i.id === recipeIng.ingredientId);
      if (ingredient) {
        totalCost += ingredient.price * recipeIng.quantity;
      }
    });
    
    const laborCost = parseFloat(formData.laborCost) || 0;
    const markup = parseFloat(formData.markup) || 0;
    const finalPrice = (totalCost + laborCost) * (1 + markup / 100);
    
    setCosts({
      recipeCost: totalCost,
      laborCost: laborCost,
      totalCost: totalCost + laborCost,
      markup: markup,
      finalPrice: finalPrice
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let imageUrl = '';
      
      // Upload image if selected
      if (formData.imageFile) {
        const imageFormData = new FormData();
        imageFormData.append('file', formData.imageFile);
        const imageRes = await axios.post('/upload/recipe', imageFormData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        imageUrl = imageRes.data.imageUrl;
      }

      const recipeData = {
        name: formData.name,
        description: formData.description || `${formData.ingredients.length} інгредієнтів`,
        laborCost: parseFloat(formData.laborCost) || 0,
        markup: parseFloat(formData.markup) || 0,
        ingredients: formData.ingredients
      };

      if (isEditing) {
        await axios.put(`/recipes/${editingId}`, recipeData);
        toast.success('Рецепт оновлено');
      } else {
        await axios.post('/recipes', recipeData);
        toast.success('Рецепт створено');
      }
      
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Помилка');
    }
  };

  const handleEdit = (recipe) => {
    setFormData({
      name: recipe.name,
      description: recipe.description,
      laborCost: recipe.laborCost,
      markup: recipe.markup,
      ingredients: recipe.ingredients || [],
      imageFile: null
    });
    setEditingId(recipe.id);
    setIsEditing(true);
    setDialogOpen(true);
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
      description: '',
      laborCost: 0,
      markup: 0,
      ingredients: [],
      imageFile: null
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
            Рецепти
          </h1>
          <p className="text-muted-foreground">Створюйте рецепти та розраховуйте собівартість</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button data-testid="create-recipe-button">
              <Plus className="mr-2 h-4 w-4" />
              Новий рецепт
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{isEditing ? 'Редагувати рецепт' : 'Новий рецепт'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Назва</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  data-testid="recipe-name-input"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="image">Зображення</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFormData({ ...formData, imageFile: e.target.files[0] })}
                  data-testid="recipe-image-input"
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="laborCost">Вартість роботи (грн)</Label>
                  <Input
                    id="laborCost"
                    type="number"
                    step="0.01"
                    value={formData.laborCost}
                    onChange={(e) => setFormData({ ...formData, laborCost: e.target.value })}
                    data-testid="recipe-labor-cost-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="markup">Націнка (%)</Label>
                  <Input
                    id="markup"
                    type="number"
                    step="0.01"
                    value={formData.markup}
                    onChange={(e) => setFormData({ ...formData, markup: e.target.value })}
                    data-testid="recipe-markup-input"
                  />
                </div>
              </div>

              {costs.finalPrice > 0 && (
                <div className="p-4 bg-muted/50 rounded-lg space-y-1">
                  <p className="text-sm text-muted-foreground">Собівартість: {costs.recipeCost?.toFixed(2)} грн</p>
                  <p className="text-lg font-bold text-primary">Фінальна ціна: {costs.finalPrice?.toFixed(2)} грн</p>
                </div>
              )}

              <DialogFooter>
                <Button type="submit" data-testid="recipe-submit-button">
                  {isEditing ? 'Зберегти' : 'Створити'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {recipes.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe) => (
            <Card key={recipe.id} className="overflow-hidden hover:shadow-lg transition-shadow" data-testid={`recipe-card-${recipe.id}`}>
              {recipe.imageUrl && (
                <div className="aspect-video w-full overflow-hidden bg-muted">
                  <img
                    src={`${BACKEND_URL}${recipe.imageUrl}`}
                    alt={recipe.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <CardHeader>
                <CardTitle>{recipe.name}</CardTitle>
                <CardDescription>{recipe.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Інгредієнтів: {recipe.ingredients?.length || 0}</p>
                  <p className="text-lg font-bold text-primary">
                    Ціна: {((recipe.ingredients?.reduce((sum, ing) => {
                      const ingredient = ingredients.find(i => i.id === ing.ingredientId);
                      return sum + (ingredient ? ingredient.price * ing.quantity : 0);
                    }, 0) || 0) + recipe.laborCost) * (1 + recipe.markup / 100)}.00 грн
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleEdit(recipe)}
                  data-testid={`edit-recipe-${recipe.id}`}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Редагувати
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <img
              src="https://images.pexels.com/photos/205961/pexels-photo-205961.jpeg"
              alt="No recipes"
              className="w-48 h-48 mx-auto mb-4 rounded-lg opacity-50 object-cover"
            />
            <p className="text-muted-foreground mb-4">Ще немає рецептів</p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Створити перший рецепт
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
