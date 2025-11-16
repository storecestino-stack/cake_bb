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
import { useTranslation } from 'react-i18next';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const languageOptions = [
  { value: 'uk', label: 'Українська', flag: '🇺🇦' },
  { value: 'pl', label: 'Польська', flag: '🇵🇱' },
  { value: 'en', label: 'Англійська', flag: '🇬🇧' },
  { value: 'ru', label: 'Російська', flag: '🇷🇺' }
];

export default function Settings({ user: initialUser, setUser: setGlobalUser }) {
  const { theme, updateTheme } = useTheme();
  const { t, i18n } = useTranslation();
  
  const themeOptions = [
    { value: 'minimal', label: t('settings.appearance.themes.minimal.label'), description: t('settings.appearance.themes.minimal.description') },
    { value: 'dark', label: t('settings.appearance.themes.dark.label'), description: t('settings.appearance.themes.dark.description') },
    { value: 'elegant', label: t('settings.appearance.themes.elegant.label'), description: t('settings.appearance.themes.elegant.description') },
    { value: 'dramatic', label: t('settings.appearance.themes.dramatic.label'), description: t('settings.appearance.themes.dramatic.description') },
    { value: 'contrast', label: t('settings.appearance.themes.contrast.label'), description: t('settings.appearance.themes.contrast.description') }
  ];
  const [name, setName] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [user, setUser] = useState(initialUser);
  const [loading, setLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [language, setLanguage] = useState(i18n.language || 'uk');
  
  // Password visibility states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (initialUser) {
      setUser(initialUser);
      setName(initialUser.name);
      setLanguage(initialUser.language || 'uk');
    } else {
      fetchUser();
    }
  }, [initialUser]);

  const fetchUser = async () => {
    try {
      const response = await axios.get('/auth/me');
      setUser(response.data);
      setName(response.data.name);
      setLanguage(response.data.language || 'uk');
      if (setGlobalUser) {
        setGlobalUser(response.data);
      }
    } catch (error) {
      toast.error(t('settings.profile.profileError'));
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
      toast.error(t('settings.profile.nameError'));
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
      toast.success(t('settings.profile.photoUpdated'));
      setAvatarFile(null);
      fetchUser();
    } catch (error) {
      toast.error(t('settings.profile.photoError'));
    } finally {
      setLoading(false);
    }
  };

  const handleThemeChange = async (newTheme) => {
    try {
      await axios.put('/auth/me', { theme: newTheme });
      
      // Update local and global user state
      const updatedUser = { ...user, theme: newTheme };
      setUser(updatedUser);
      if (setGlobalUser) {
        setGlobalUser(updatedUser);
      }
      
      updateTheme(newTheme);
      toast.success(t('settings.appearance.themeChanged'));
    } catch (error) {
      toast.error(t('settings.appearance.themeError'));
    }
  };

  const handleLanguageChange = async (newLanguage) => {
    try {
      await axios.put('/auth/me', { language: newLanguage });
      
      // Change i18n language
      i18n.changeLanguage(newLanguage);
      
      // Update local and global user state
      const updatedUser = { ...user, language: newLanguage };
      setUser(updatedUser);
      setLanguage(newLanguage);
      if (setGlobalUser) {
        setGlobalUser(updatedUser);
      }
      
      toast.success(t('settings.appearance.languageChanged'));
    } catch (error) {
      toast.error(t('settings.appearance.languageError'));
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error(t('settings.security.passwordMismatch'));
      return;
    }

    if (newPassword.length < 6) {
      toast.error(t('settings.security.passwordTooShort'));
      return;
    }

    setLoading(true);
    try {
      await axios.post('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword
      });
      toast.success(t('settings.security.passwordChanged'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error(error.response?.data?.detail || t('settings.security.passwordError'));
    } finally {
      setLoading(false);
    }
  };

  const avatarUrl = user?.avatar ? `${BACKEND_URL}${user.avatar}` : null;

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          {t('settings.title')}
        </h1>
        <p className="text-muted-foreground">{t('settings.subtitle')}</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList>
          <TabsTrigger value="profile" data-testid="profile-tab">{t('settings.tabs.profile')}</TabsTrigger>
          <TabsTrigger value="security" data-testid="security-tab">{t('settings.tabs.security')}</TabsTrigger>
          <TabsTrigger value="appearance" data-testid="appearance-tab">{t('settings.tabs.appearance')}</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          {/* Avatar */}
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.profile.photo')}</CardTitle>
              <CardDescription>{t('settings.profile.photoDescription')}</CardDescription>
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
                    {loading ? t('settings.profile.uploading') : t('settings.profile.uploadPhoto')}
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>

          {/* Name */}
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.profile.userName')}</CardTitle>
              <CardDescription>{t('settings.profile.userNameDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleNameUpdate} className="space-y-3">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('settings.profile.namePlaceholder')}
                  required
                  data-testid="name-input"
                />
                <Button
                  type="submit"
                  disabled={loading || name === user?.name}
                  data-testid="name-submit-button"
                >
                  {loading ? t('settings.profile.saving') : t('settings.profile.saveName')}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.security.changePassword')}</CardTitle>
              <CardDescription>{t('settings.security.changePasswordDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">{t('settings.security.currentPassword')}</Label>
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
                  <Label htmlFor="new-password">{t('settings.security.newPassword')}</Label>
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
                  <Label htmlFor="confirm-password">{t('settings.security.confirmPassword')}</Label>
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
                  {loading ? t('settings.security.changing') : t('settings.security.changePasswordButton')}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          {/* Language Selection */}
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.appearance.language')}</CardTitle>
              <CardDescription>{t('settings.appearance.languageDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {languageOptions.map((option) => (
                  <div
                    key={option.value}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      language === option.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => handleLanguageChange(option.value)}
                    data-testid={`language-${option.value}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{option.flag}</span>
                        <h3 className="font-semibold text-foreground">{option.label}</h3>
                      </div>
                      {language === option.value && (
                        <div className="h-2 w-2 rounded-full bg-primary"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Theme Selection */}
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.appearance.theme')}</CardTitle>
              <CardDescription>{t('settings.appearance.themeDescription')}</CardDescription>
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