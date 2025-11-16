import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useTheme } from '../contexts/ThemeContext';
import { Eye, EyeOff } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const themeOptions = [
  { value: 'minimal', label: 'Мінімалістичні', description: 'Чисті блакитні тони' },
  { value: 'dark', label: 'Темна тема', description: 'Темний режим для роботи вночі' },
  { value: 'custom', label: 'Користувацька', description: 'Створіть власну колірну схему' }
];

const colorPalette = [
  '#FF6B6B', '#FFA07A', '#FFD93D', '#6BCF7F', '#4ECDC4', '#45B7D1',
  '#5E60CE', '#A29BFE', '#FD79A8', '#FDCB6E', '#00B894', '#00CEC9',
  '#0984E3', '#6C5CE7', '#E17055', '#D63031', '#FDCB6E', '#FFA502',
  '#FF6348', '#2ECC71', '#3498DB', '#9B59B6', '#34495E', '#95A5A6'
];

export default function Settings() {
  const { theme, updateTheme } = useTheme();
  const [name, setName] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Password visibility states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Custom colors
  const [customColors, setCustomColors] = useState({
    background: '#FFFFFF',
    foreground: '#000000',
    border: '#E5E5E5',
    primary: '#3B82F6'
  });

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await axios.get('/auth/me');
      setUser(response.data);
      setName(response.data.name);
      if (response.data.customColors) {
        setCustomColors(response.data.customColors);
      }
    } catch (error) {
      toast.error('Помилка завантаження профілю');
    }
  };

  const handleNameUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.put('/auth/me', { name });
      toast.success('Ім\'я оновлено');
      fetchUser();
    } catch (error) {
      toast.error('Помилка оновлення імені');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    e.preventDefault();
    if (!avatarFile) return;
    
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', avatarFile);
      await axios.post('/upload/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Аватар оновлено');
      setAvatarFile(null);
      fetchUser();
    } catch (error) {
      toast.error('Помилка завантаження аватара');
    } finally {
      setLoading(false);
    }
  };

  const handleThemeChange = async (newTheme) => {
    try {
      await axios.put('/auth/me', { theme: newTheme });
      updateTheme(newTheme);
      toast.success('Тему змінено');
    } catch (error) {
      toast.error('Помилка зміни теми');
    }
  };

  const handleCustomColorChange = async (colorType, color) => {
    const newColors = { ...customColors, [colorType]: color };
    setCustomColors(newColors);
    
    try {
      await axios.put('/auth/me', { customColors: newColors });
      
      // Apply custom colors to CSS variables
      if (theme === 'custom') {
        applyCustomColors(newColors);
      }
    } catch (error) {
      toast.error('Помилка збереження кольорів');
    }
  };

  const applyCustomColors = (colors) => {
    const root = document.documentElement;
    // Convert hex to HSL for CSS variables
    root.style.setProperty('--custom-background', colors.background);
    root.style.setProperty('--custom-foreground', colors.foreground);
    root.style.setProperty('--custom-border', colors.border);
    root.style.setProperty('--custom-primary', colors.primary);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error('Паролі не співпадають');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Пароль має містити мінімум 6 символів');
      return;
    }

    setLoading(true);
    try {
      await axios.post('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword
      });
      toast.success('Пароль успішно змінено');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Помилка зміни пароля');
    } finally {
      setLoading(false);
    }
  };

  const avatarUrl = user?.avatar ? `${BACKEND_URL}${user.avatar}` : null;

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          Налаштування
        </h1>
        <p className="text-muted-foreground">Керуйте своїм профілем та налаштуваннями</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList>
          <TabsTrigger value="profile" data-testid="profile-tab">Профіль</TabsTrigger>
          <TabsTrigger value="security" data-testid="security-tab">Безпека</TabsTrigger>
          <TabsTrigger value="appearance" data-testid="appearance-tab">Вигляд</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          {/* Avatar */}
          <Card>
            <CardHeader>
              <CardTitle>Фото профілю</CardTitle>
              <CardDescription>Завантажте або змініть своє фото</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24">
                  {avatarUrl && <AvatarImage src={avatarUrl} alt={user?.name} />}
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                    {user?.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <form onSubmit={handleAvatarUpload} className="flex-1 space-y-3">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setAvatarFile(e.target.files[0])}
                    data-testid="avatar-input"
                  />
                  <Button
                    type="submit"
                    disabled={!avatarFile || loading}
                    data-testid="avatar-submit-button"
                  >
                    {loading ? 'Завантаження...' : 'Завантажити фото'}
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>

          {/* Name */}
          <Card>
            <CardHeader>
              <CardTitle>Ім'я користувача</CardTitle>
              <CardDescription>Змініть своє відображуване ім'я</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleNameUpdate} className="space-y-3">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ваше ім'я"
                  required
                  data-testid="name-input"
                />
                <Button
                  type="submit"
                  disabled={loading || name === user?.name}
                  data-testid="name-submit-button"
                >
                  {loading ? 'Збереження...' : 'Зберегти ім\'я'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Зміна пароля</CardTitle>
              <CardDescription>Оновіть свій пароль для безпеки акаунту</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Поточний пароль</Label>
                  <div className="relative">
                    <Input
                      id="current-password"
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      data-testid="current-password-input"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">Новий пароль</Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                      data-testid="new-password-input"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Підтвердіть новий пароль</Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      data-testid="confirm-password-input"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  data-testid="change-password-button"
                >
                  {loading ? 'Зміна...' : 'Змінити пароль'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Колірна тема</CardTitle>
              <CardDescription>Оберіть колірну схему додатку</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {themeOptions.map((option) => (
                  <div
                    key={option.value}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      theme === option.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => handleThemeChange(option.value)}
                    data-testid={`theme-${option.value}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-foreground">{option.label}</h3>
                      {theme === option.value && (
                        <div className="h-2 w-2 rounded-full bg-primary"></div>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {theme === 'custom' && (
            <Card>
              <CardHeader>
                <CardTitle>Конструктор кольорів</CardTitle>
                <CardDescription>Налаштуйте власну колірну схему</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Background Color */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Колір фону</Label>
                  <div className="grid grid-cols-8 gap-2">
                    {colorPalette.map((color, index) => (
                      <button
                        key={`bg-${index}`}
                        type="button"
                        onClick={() => handleCustomColorChange('background', color)}
                        className={`w-10 h-10 rounded-md border-2 transition-all ${
                          customColors.background === color
                            ? 'border-foreground scale-110 shadow-lg'
                            : 'border-transparent hover:scale-105'
                        }`}
                        style={{ backgroundColor: color }}
                        data-testid={`color-background-${index}`}
                        aria-label={`Колір фону ${color}`}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm text-muted-foreground">Обраний колір:</span>
                    <div
                      className="w-8 h-8 rounded-md border border-border"
                      style={{ backgroundColor: customColors.background }}
                    />
                    <span className="text-sm font-mono">{customColors.background}</span>
                  </div>
                </div>

                {/* Foreground/Font Color */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Колір шрифту</Label>
                  <div className="grid grid-cols-8 gap-2">
                    {colorPalette.map((color, index) => (
                      <button
                        key={`fg-${index}`}
                        type="button"
                        onClick={() => handleCustomColorChange('foreground', color)}
                        className={`w-10 h-10 rounded-md border-2 transition-all ${
                          customColors.foreground === color
                            ? 'border-foreground scale-110 shadow-lg'
                            : 'border-transparent hover:scale-105'
                        }`}
                        style={{ backgroundColor: color }}
                        data-testid={`color-foreground-${index}`}
                        aria-label={`Колір шрифту ${color}`}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm text-muted-foreground">Обраний колір:</span>
                    <div
                      className="w-8 h-8 rounded-md border border-border"
                      style={{ backgroundColor: customColors.foreground }}
                    />
                    <span className="text-sm font-mono">{customColors.foreground}</span>
                  </div>
                </div>

                {/* Border Color */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Колір рамок</Label>
                  <div className="grid grid-cols-8 gap-2">
                    {colorPalette.map((color, index) => (
                      <button
                        key={`border-${index}`}
                        type="button"
                        onClick={() => handleCustomColorChange('border', color)}
                        className={`w-10 h-10 rounded-md border-2 transition-all ${
                          customColors.border === color
                            ? 'border-foreground scale-110 shadow-lg'
                            : 'border-transparent hover:scale-105'
                        }`}
                        style={{ backgroundColor: color }}
                        data-testid={`color-border-${index}`}
                        aria-label={`Колір рамок ${color}`}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm text-muted-foreground">Обраний колір:</span>
                    <div
                      className="w-8 h-8 rounded-md border border-border"
                      style={{ backgroundColor: customColors.border }}
                    />
                    <span className="text-sm font-mono">{customColors.border}</span>
                  </div>
                </div>

                {/* Primary/Icon Color */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Колір іконок (Основний)</Label>
                  <div className="grid grid-cols-8 gap-2">
                    {colorPalette.map((color, index) => (
                      <button
                        key={`primary-${index}`}
                        type="button"
                        onClick={() => handleCustomColorChange('primary', color)}
                        className={`w-10 h-10 rounded-md border-2 transition-all ${
                          customColors.primary === color
                            ? 'border-foreground scale-110 shadow-lg'
                            : 'border-transparent hover:scale-105'
                        }`}
                        style={{ backgroundColor: color }}
                        data-testid={`color-primary-${index}`}
                        aria-label={`Колір іконок ${color}`}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm text-muted-foreground">Обраний колір:</span>
                    <div
                      className="w-8 h-8 rounded-md border border-border"
                      style={{ backgroundColor: customColors.primary }}
                    />
                    <span className="text-sm font-mono">{customColors.primary}</span>
                  </div>
                </div>

                {/* Preview Section */}
                <div className="p-4 border-2 border-border rounded-lg space-y-3">
                  <Label className="text-base font-semibold">Попередній перегляд</Label>
                  <div
                    className="p-4 rounded-md"
                    style={{
                      backgroundColor: customColors.background,
                      color: customColors.foreground,
                      border: `2px solid ${customColors.border}`
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: customColors.primary }}
                      />
                      <p style={{ color: customColors.foreground }}>
                        Приклад тексту з вашими кольорами
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}