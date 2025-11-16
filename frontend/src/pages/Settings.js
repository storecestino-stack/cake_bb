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
  { value: 'system', label: 'На ваш розсуд', description: 'Класичний світлий вигляд' },
  { value: 'minimal', label: 'Мінімалістичні', description: 'Чисті блакитні тони' },
  { value: 'pastel', label: 'М\'які пастельні', description: 'Ніжні рожево-зелено-фіолетові відтінки' },
  { value: 'vibrant', label: 'Яскраві енергійні', description: 'Насичені фіолетово-рожеві кольори' },
  { value: 'dark', label: 'Темна тема', description: 'Темний режим для роботи вночі' }
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

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await axios.get('/auth/me');
      setUser(response.data);
      setName(response.data.name);
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
                  <Input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    data-testid="current-password-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">Новий пароль</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    data-testid="new-password-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Підтвердіть новий пароль</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    data-testid="confirm-password-input"
                  />
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
        </TabsContent>
      </Tabs>
    </div>
  );
}