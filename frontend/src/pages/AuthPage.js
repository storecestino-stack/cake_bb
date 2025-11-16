import { useState } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { ChefHat, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function AuthPage({ onLogin }) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({ name: '', email: '', password: '' });
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetStep, setResetStep] = useState(1); // 1: email, 2: code+password
  
  // Password visibility states
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await axios.post('/auth/login', loginData);
      onLogin(response.data.access_token, response.data.user);
      toast.success(t('auth.successLogin'));
    } catch (error) {
      toast.error(error.response?.data?.detail || t('auth.errorLogin'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await axios.post('/auth/signup', signupData);
      onLogin(response.data.access_token, response.data.user);
      toast.success(t('auth.successSignup'));
    } catch (error) {
      toast.error(error.response?.data?.detail || t('auth.errorSignup'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetRequest = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await axios.post('/auth/password-reset-request', { email: resetEmail });
      toast.success(t('auth.resetCodeSent'));
      // In development, show the code
      if (response.data.reset_code) {
        toast.info(`Код для тестування: ${response.data.reset_code}`);
      }
      setResetStep(2);
    } catch (error) {
      toast.error(error.response?.data?.detail || t('auth.errorLogin'));
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await axios.post('/auth/password-reset', {
        email: resetEmail,
        reset_code: resetCode,
        new_password: newPassword
      });
      toast.success(t('auth.passwordChanged'));
      setShowResetForm(false);
      setResetStep(1);
      setResetEmail('');
      setResetCode('');
      setNewPassword('');
    } catch (error) {
      toast.error(error.response?.data?.detail || t('auth.errorLogin'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{
      background: 'linear-gradient(135deg, hsl(var(--secondary)) 0%, hsl(var(--background)) 50%, hsl(var(--accent)) 100%)'
    }}>
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left side - decorative */}
        <div className="hidden lg:flex flex-col items-center justify-center space-y-6">
          <div className="w-24 h-24 rounded-2xl bg-primary/10 flex items-center justify-center backdrop-blur-sm">
            <ChefHat className="w-14 h-14 text-primary" />
          </div>
          <div className="text-center space-y-2">
            <h1 className="text-4xl lg:text-5xl font-bold text-foreground" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {t('auth.appTitle')}
            </h1>
            <p className="text-lg text-muted-foreground">{t('auth.appDescription')}</p>
          </div>
        </div>

        {/* Right side - auth forms */}
        <Card className="w-full max-w-md mx-auto shadow-2xl backdrop-blur-sm bg-card/95">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center lg:hidden mb-4">
              <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                <ChefHat className="w-10 h-10 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center">{t('auth.welcome')}</CardTitle>
            <CardDescription className="text-center">{t('auth.loginDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login" data-testid="login-tab">{t('auth.loginTab')}</TabsTrigger>
                <TabsTrigger value="signup" data-testid="signup-tab">{t('auth.signupTab')}</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                {!showResetForm ? (
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">{t('auth.email')}</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="example@email.com"
                        value={loginData.email}
                        onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                        required
                        data-testid="login-email-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">{t('auth.password')}</Label>
                      <div className="relative">
                        <Input
                          id="login-password"
                          type={showLoginPassword ? "text" : "password"}
                          value={loginData.password}
                          onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                          required
                          data-testid="login-password-input"
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowLoginPassword(!showLoginPassword)}
                          data-testid="toggle-login-password"
                        >
                          {showLoginPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="link"
                      className="px-0 text-sm"
                      onClick={() => setShowResetForm(true)}
                      data-testid="forgot-password-link"
                    >
                      Забули пароль?
                    </Button>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading}
                      data-testid="login-submit-button"
                    >
                      {isLoading ? 'Вхід...' : 'Увійти'}
                    </Button>
                  </form>
                ) : (
                  <div className="space-y-4">
                    {resetStep === 1 ? (
                      <form onSubmit={handleResetRequest} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="reset-email">Email</Label>
                          <Input
                            id="reset-email"
                            type="email"
                            placeholder="example@email.com"
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                            required
                            data-testid="reset-email-input"
                          />
                        </div>
                        <Button
                          type="submit"
                          className="w-full"
                          disabled={isLoading}
                          data-testid="reset-request-button"
                        >
                          {isLoading ? 'Надсилання...' : 'Надіслати код'}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          className="w-full"
                          onClick={() => {
                            setShowResetForm(false);
                            setResetStep(1);
                          }}
                        >
                          Повернутися до входу
                        </Button>
                      </form>
                    ) : (
                      <form onSubmit={handlePasswordReset} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="reset-code">Код відновлення</Label>
                          <Input
                            id="reset-code"
                            type="text"
                            placeholder="123456"
                            value={resetCode}
                            onChange={(e) => setResetCode(e.target.value)}
                            required
                            data-testid="reset-code-input"
                          />
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
                              data-testid="new-password-input"
                              className="pr-10"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              data-testid="toggle-new-password"
                            >
                              {showNewPassword ? (
                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <Eye className="h-4 w-4 text-muted-foreground" />
                              )}
                            </Button>
                          </div>
                        </div>
                        <Button
                          type="submit"
                          className="w-full"
                          disabled={isLoading}
                          data-testid="reset-password-button"
                        >
                          {isLoading ? 'Зміна...' : 'Змінити пароль'}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          className="w-full"
                          onClick={() => {
                            setShowResetForm(false);
                            setResetStep(1);
                          }}
                        >
                          Повернутися до входу
                        </Button>
                      </form>
                    )}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Ім'я</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Ваше ім'я"
                      value={signupData.name}
                      onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                      required
                      data-testid="signup-name-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="example@email.com"
                      value={signupData.email}
                      onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                      required
                      data-testid="signup-email-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Пароль</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showSignupPassword ? "text" : "password"}
                        value={signupData.password}
                        onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                        required
                        data-testid="signup-password-input"
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowSignupPassword(!showSignupPassword)}
                        data-testid="toggle-signup-password"
                      >
                        {showSignupPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading}
                    data-testid="signup-submit-button"
                  >
                    {isLoading ? 'Створення...' : 'Створити акаунт'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}