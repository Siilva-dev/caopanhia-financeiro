import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/hooks/useTheme";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useProfile, useUpdateProfile } from "@/hooks/useSupabaseData";
import ConfiguracoesFuncionario from './ConfiguracoesFuncionario';
import { ChangePasswordModal } from '@/components/configuracoes/ChangePasswordModal';
import { TwoFactorModal } from '@/components/configuracoes/TwoFactorModal';
import { Toaster } from "@/components/ui/toaster";
import { 
  Settings, 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Database, 
  Download,
  Upload,
  Trash2,
  Key,
  Moon,
  Sun,
  Globe
} from "lucide-react";

const Configuracoes = () => {
  const { userRole, user } = useAuth();
  const { data: profile } = useProfile();
  const updateProfileMutation = useUpdateProfile();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showTwoFactorModal, setShowTwoFactorModal] = useState(false);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  
  // Carregar foto do perfil quando o componente monta ou perfil muda
  useEffect(() => {
    if (profile?.avatar_url) {
      setAvatarUrl(profile.avatar_url);
    }
  }, [profile]);

  // Verificar status do MFA quando o componente monta
  useEffect(() => {
    const checkMFAStatus = async () => {
      try {
        const { data: factors } = await supabase.auth.mfa.listFactors();
        setMfaEnabled(factors.totp.length > 0);
        setConfiguracoes(prev => ({
          ...prev,
          autenticacaoDoisFatores: factors.totp.length > 0
        }));
      } catch (error) {
        console.error('Erro ao verificar status do MFA:', error);
      }
    };

    checkMFAStatus();
  }, []);
  
  // Se for funcionário, renderiza página simplificada
  if (userRole === 'funcionario') {
    return <ConfiguracoesFuncionario />;
  }
  const { theme, setTheme } = useTheme();
  
  const [configuracoes, setConfiguracoes] = useState({
    // Perfil
    nome: "Admin Master",
    email: "admin@petshop.com",
    telefone: "(11) 99999-9999",
    cargo: "Administrador",
    
    // Notificações
    emailNotificacoes: true,
    pushNotificacoes: true,
    alertasGastos: true,
    alertasMetas: true,
    
    // Aparência
    idioma: "pt-BR",
    moeda: "BRL",
    formatoData: "DD/MM/YYYY",
    
    // Segurança
    autenticacaoDoisFatores: false,
    loginAutomatico: true,
    tempoSessao: "30"
  });

  const handleSave = () => {
    try {
      // Salvar configurações no localStorage
      localStorage.setItem('appConfiguracoes', JSON.stringify(configuracoes));
      
      toast({
        title: "Configurações salvas com sucesso!",
        description: "Todas as suas preferências foram atualizadas.",
      });
    } catch (error) {
      toast({
        title: "Erro ao salvar configurações",
        description: "Não foi possível salvar as alterações. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const limparCache = () => {
    try {
      // Limpa todos os dados do localStorage exceto dados de autenticação
      const user = localStorage.getItem('user');
      localStorage.clear();
      
      // Restaura dados do usuário para manter a sessão
      if (user) {
        localStorage.setItem('user', user);
      }
      
      toast({
        title: "Cache limpo com sucesso!",
        description: "Todos os dados temporários foram removidos do sistema.",
      });
    } catch (error) {
      toast({
        title: "Erro ao limpar cache",
        description: "Não foi possível limpar o cache. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // NOVAS FUNCIONALIDADES DOS BOTÕES
  const handleUploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file || !user) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Atualizar na tabela profiles
      await updateProfileMutation.mutateAsync({ 
        avatar_url: data.publicUrl 
      });

      setAvatarUrl(data.publicUrl);
      
      toast({
        title: "Foto atualizada!",
        description: "Sua foto de perfil foi alterada com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao enviar foto",
        description: "Não foi possível alterar a foto. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      if (!user) return;
      
      // Remover do storage (tentando diferentes extensões)
      const extensions = ['jpg', 'jpeg', 'png', 'gif'];
      for (const ext of extensions) {
        const fileName = `${user.id}/avatar.${ext}`;
        await supabase.storage.from('avatars').remove([fileName]);
      }

      // Atualizar na tabela profiles
      await updateProfileMutation.mutateAsync({ 
        avatar_url: null 
      });
      
      setAvatarUrl(null);
      
      toast({
        title: "Foto removida!",
        description: "Sua foto de perfil foi removida com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao remover foto",
        description: "Não foi possível remover a foto. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleBackup = () => {
    try {
      // Cria backup dos dados do localStorage
      const backupData = {
        configuracoes,
        timestamp: new Date().toISOString(),
        version: "1.0.0"
      };
      
      const dataStr = JSON.stringify(backupData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup_sistema_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Backup criado com sucesso!",
        description: "Os dados foram exportados para seu computador.",
      });
    } catch (error) {
      toast({
        title: "Erro ao criar backup",
        description: "Não foi possível gerar o backup. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleRestore = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (e) => {
      try {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;
        
        const text = await file.text();
        const backupData = JSON.parse(text);
        
        if (backupData.configuracoes) {
          setConfiguracoes(backupData.configuracoes);
          localStorage.setItem('appConfiguracoes', JSON.stringify(backupData.configuracoes));
          
          toast({
            title: "Restauração concluída!",
            description: "As configurações foram restauradas com sucesso.",
          });
        } else {
          throw new Error('Arquivo de backup inválido');
        }
      } catch (error) {
        toast({
          title: "Erro na restauração",
          description: "Arquivo de backup inválido ou corrompido.",
          variant: "destructive",
        });
      }
    };
    
    input.click();
  };

  const handleClearAll = async () => {
    if (confirm('ATENÇÃO: Esta ação irá apagar TODOS os dados do sistema (transações, contas, cofres, metas, etc.). Tem certeza?')) {
      try {
        if (!user) {
          toast({
            title: "Erro",
            description: "Usuário não encontrado.",
            variant: "destructive",
          });
          return;
        }

        // Apagar todos os dados do Supabase para o usuário atual
        const promises = [
          supabase.from('transactions').delete().eq('user_id', user.id),
          supabase.from('bank_accounts').delete().eq('user_id', user.id),
          supabase.from('installments').delete().eq('user_id', user.id),
          supabase.from('vault_movements').delete().eq('user_id', user.id),
          supabase.from('vaults').delete().eq('user_id', user.id),
          supabase.from('monthly_goals').delete().eq('user_id', user.id)
        ];

        const results = await Promise.all(promises);
        
        // Verificar se houve erros
        const errors = results.filter(result => result.error);
        if (errors.length > 0) {
          console.error('Erros ao limpar dados:', errors);
          throw new Error('Erro ao limpar alguns dados');
        }

        // Limpar localStorage também
        localStorage.clear();
        
        // Reset configurations
        setConfiguracoes({
          nome: "Admin Master",
          email: "admin@petshop.com",
          telefone: "(11) 99999-9999",
          cargo: "Administrador",
          emailNotificacoes: true,
          pushNotificacoes: true,
          alertasGastos: true,
          alertasMetas: true,
          idioma: "pt-BR",
          moeda: "BRL",
          formatoData: "DD/MM/YYYY",
          autenticacaoDoisFatores: false,
          loginAutomatico: true,
          tempoSessao: "30"
        });
        
        toast({
          title: "Sistema limpo com sucesso!",
          description: "Todos os dados foram removidos do banco de dados e cache local.",
        });
      } catch (error) {
        console.error('Erro ao limpar sistema:', error);
        toast({
          title: "Erro ao limpar sistema",
          description: "Não foi possível limpar todos os dados. Tente novamente.",
          variant: "destructive",
        });
      }
    }
  };

  const handleChangePassword = () => {
    setShowChangePasswordModal(true);
  };

  const handleTwoFactorToggle = () => {
    setShowTwoFactorModal(true);
  };

  const handleMFAStatusChange = (enabled: boolean) => {
    setMfaEnabled(enabled);
    setConfiguracoes(prev => ({
      ...prev,
      autenticacaoDoisFatores: enabled
    }));
  };

  const handleDownloadUserData = () => {
    try {
      const userData = {
        profile: configuracoes,
        exportDate: new Date().toISOString(),
        dataType: "user_profile"
      };
      
      const dataStr = JSON.stringify(userData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `meus_dados_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Dados baixados!",
        description: "Seus dados pessoais foram exportados com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao baixar dados",
        description: "Não foi possível exportar os dados. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-gradient truncate">Configurações</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Gerencie suas preferências e configurações do sistema
          </p>
        </div>
        <Button onClick={handleSave} className="gradient-primary text-white w-full sm:w-auto">
          <Settings className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Salvar Alterações</span>
          <span className="sm:hidden">Salvar</span>
        </Button>
      </div>

      <Tabs defaultValue="perfil" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 h-auto">
          <TabsTrigger value="perfil" className="text-xs sm:text-sm">Perfil</TabsTrigger>
          <TabsTrigger value="notificacoes" className="text-xs sm:text-sm">Notificações</TabsTrigger>
          <TabsTrigger value="aparencia" className="text-xs sm:text-sm">Aparência</TabsTrigger>
          <TabsTrigger value="seguranca" className="text-xs sm:text-sm">Segurança</TabsTrigger>
          <TabsTrigger value="sistema" className="text-xs sm:text-sm col-span-2 sm:col-span-1">Sistema</TabsTrigger>
        </TabsList>

        <TabsContent value="perfil" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="mr-2 h-5 w-5" />
                Informações Pessoais
              </CardTitle>
              <CardDescription>
                Atualize suas informações de perfil
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={avatarUrl || "/placeholder.svg"} />
                  <AvatarFallback>AM</AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUploadAvatar}
                    style={{ display: 'none' }}
                    id="avatar-upload"
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => document.getElementById('avatar-upload')?.click()}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Alterar Foto
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleRemoveAvatar}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remover
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="nome">Nome Completo</Label>
                  <Input
                    id="nome"
                    value={configuracoes.nome}
                    onChange={(e) => setConfiguracoes({...configuracoes, nome: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={configuracoes.email}
                    onChange={(e) => setConfiguracoes({...configuracoes, email: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={configuracoes.telefone}
                    onChange={(e) => setConfiguracoes({...configuracoes, telefone: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cargo">Cargo</Label>
                  <Select value={configuracoes.cargo}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Administrador">Administrador</SelectItem>
                      <SelectItem value="Funcionário">Funcionário</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Badge variant="default">Administrador Master</Badge>
                <Badge variant="secondary">Acesso Total</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notificacoes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="mr-2 h-5 w-5" />
                Preferências de Notificação
              </CardTitle>
              <CardDescription>
                Configure como e quando deseja receber notificações
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notificações por E-mail</Label>
                    <p className="text-sm text-muted-foreground">
                      Receba notificações importantes por e-mail
                    </p>
                  </div>
                  <Switch
                    checked={configuracoes.emailNotificacoes}
                    onCheckedChange={(checked) => setConfiguracoes({...configuracoes, emailNotificacoes: checked})}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notificações Push</Label>
                    <p className="text-sm text-muted-foreground">
                      Receba notificações em tempo real
                    </p>
                  </div>
                  <Switch
                    checked={configuracoes.pushNotificacoes}
                    onCheckedChange={(checked) => setConfiguracoes({...configuracoes, pushNotificacoes: checked})}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Alertas de Gastos</Label>
                    <p className="text-sm text-muted-foreground">
                      Seja alertado quando ultrapassar limites de gastos
                    </p>
                  </div>
                  <Switch
                    checked={configuracoes.alertasGastos}
                    onCheckedChange={(checked) => setConfiguracoes({...configuracoes, alertasGastos: checked})}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Alertas de Metas</Label>
                    <p className="text-sm text-muted-foreground">
                      Receba notificações sobre o progresso das suas metas
                    </p>
                  </div>
                  <Switch
                    checked={configuracoes.alertasMetas}
                    onCheckedChange={(checked) => setConfiguracoes({...configuracoes, alertasMetas: checked})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="aparencia" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Palette className="mr-2 h-5 w-5" />
                Aparência e Idioma
              </CardTitle>
              <CardDescription>
                Personalize a aparência e o idioma do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Tema</Label>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant={theme === "light" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTheme("light")}
                    >
                      <Sun className="mr-2 h-4 w-4" />
                      Claro
                    </Button>
                    <Button
                      variant={theme === "dark" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTheme("dark")}
                    >
                      <Moon className="mr-2 h-4 w-4" />
                      Escuro
                    </Button>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>Idioma</Label>
                  <Select value={configuracoes.idioma}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt-BR">
                        <div className="flex items-center">
                          <Globe className="mr-2 h-4 w-4" />
                          Português (Brasil)
                        </div>
                      </SelectItem>
                      <SelectItem value="en-US">
                        <div className="flex items-center">
                          <Globe className="mr-2 h-4 w-4" />
                          English (US)
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>Moeda</Label>
                  <Select value={configuracoes.moeda}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BRL">Real Brasileiro (R$)</SelectItem>
                      <SelectItem value="USD">Dólar Americano ($)</SelectItem>
                      <SelectItem value="EUR">Euro (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>Formato de Data</Label>
                  <Select value={configuracoes.formatoData}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seguranca" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="mr-2 h-5 w-5" />
                Segurança da Conta
              </CardTitle>
              <CardDescription>
                Configure as opções de segurança da sua conta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Autenticação de Dois Fatores</Label>
                    <p className="text-sm text-muted-foreground">
                      Adicione uma camada extra de segurança com Google Authenticator
                    </p>
                    {mfaEnabled && (
                      <Badge variant="secondary" className="text-xs">
                        <Shield className="mr-1 h-3 w-3" />
                        Ativo
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant={mfaEnabled ? "secondary" : "outline"}
                    size="sm"
                    onClick={handleTwoFactorToggle}
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    {mfaEnabled ? "Gerenciar" : "Configurar"}
                  </Button>
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Login Automático</Label>
                    <p className="text-sm text-muted-foreground">
                      Manter sessão ativa automaticamente
                    </p>
                  </div>
                  <Switch
                    checked={configuracoes.loginAutomatico}
                    onCheckedChange={(checked) => setConfiguracoes({...configuracoes, loginAutomatico: checked})}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Tempo de Sessão (minutos)</Label>
                <Select value={configuracoes.tempoSessao}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutos</SelectItem>
                    <SelectItem value="30">30 minutos</SelectItem>
                    <SelectItem value="60">1 hora</SelectItem>
                    <SelectItem value="120">2 horas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex space-x-2">
                <Button variant="outline" onClick={handleChangePassword}>
                  <Key className="mr-2 h-4 w-4" />
                  Alterar Senha
                </Button>
                <Button variant="outline" onClick={handleDownloadUserData}>
                  <Download className="mr-2 h-4 w-4" />
                  Baixar Dados
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sistema" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="mr-2 h-5 w-5" />
                Configurações do Sistema
              </CardTitle>
              <CardDescription>
                Configurações avançadas e manutenção do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                <div className="space-y-2">
                  <h3 className="font-medium">Backup e Restauração</h3>
                  <p className="text-sm text-muted-foreground">
                    Faça backup dos seus dados regularmente
                  </p>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={handleBackup}>
                      <Download className="mr-2 h-3 w-3" />
                      Fazer Backup
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleRestore}>
                      <Upload className="mr-2 h-3 w-3" />
                      Restaurar
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium">Limpeza de Dados</h3>
                  <p className="text-sm text-muted-foreground">
                    Remova dados desnecessários do sistema
                  </p>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={limparCache}>
                      <Trash2 className="mr-2 h-3 w-3" />
                      Limpar Cache
                    </Button>
                    <Button variant="destructive" size="sm" onClick={handleClearAll}>
                      <Trash2 className="mr-2 h-3 w-3" />
                      Limpar Tudo
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h3 className="font-medium">Informações do Sistema</h3>
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Versão:</span>
                    <span>1.0.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Última Atualização:</span>
                    <span>21/08/2025</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Usuários Ativos:</span>
                    <span>1</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Espaço Usado:</span>
                    <span>245 MB</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        </Tabs>

        <ChangePasswordModal 
          isOpen={showChangePasswordModal} 
          onClose={() => setShowChangePasswordModal(false)} 
        />

        <TwoFactorModal
          isOpen={showTwoFactorModal}
          onClose={() => setShowTwoFactorModal(false)}
          currentStatus={mfaEnabled}
          onStatusChange={handleMFAStatusChange}
        />

        <Toaster />
      </div>
    );
};

export default Configuracoes;