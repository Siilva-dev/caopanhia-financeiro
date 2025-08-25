import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTheme } from "@/hooks/useTheme";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useProfile, useUpdateProfile } from "@/hooks/useSupabaseData";
import { 
  Settings, 
  User, 
  Palette, 
  Upload,
  Trash2,
  Moon,
  Sun
} from "lucide-react";

const ConfiguracoesFuncionario = () => {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const updateProfileMutation = useUpdateProfile();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  
  // Carregar foto do perfil quando o componente monta ou perfil muda
  useEffect(() => {
    if (profile?.avatar_url) {
      setAvatarUrl(profile.avatar_url);
    }
  }, [profile]);
  
  const [configuracoes, setConfiguracoes] = useState({
    // Perfil
    nome: "Funcionário Sistema",
    email: "funcionario@financeiro.com",
    telefone: "(11) 88888-8888",
  });

  const handleSave = () => {
    try {
      // Salvar configurações no localStorage
      localStorage.setItem('funcionarioConfiguracoes', JSON.stringify(configuracoes));
      
      toast({
        title: "Configurações salvas com sucesso!",
        description: "Suas preferências foram atualizadas.",
      });
    } catch (error) {
      toast({
        title: "Erro ao salvar configurações",
        description: "Não foi possível salvar as alterações. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Funcionalidades de upload e remoção de foto
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-gradient truncate">Configurações</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Gerencie suas preferências pessoais
          </p>
        </div>
        <Button onClick={handleSave} className="gradient-primary text-white w-full sm:w-auto">
          <Settings className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Salvar Alterações</span>
          <span className="sm:hidden">Salvar</span>
        </Button>
      </div>

      <Tabs defaultValue="perfil" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="perfil" className="text-xs sm:text-sm">Perfil</TabsTrigger>
          <TabsTrigger value="aparencia" className="text-xs sm:text-sm">Aparência</TabsTrigger>
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
                  <AvatarFallback>FS</AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUploadAvatar}
                    style={{ display: 'none' }}
                    id="avatar-upload-funcionario"
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => document.getElementById('avatar-upload-funcionario')?.click()}
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
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="aparencia" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Palette className="mr-2 h-5 w-5" />
                Aparência
              </CardTitle>
              <CardDescription>
                Personalize a aparência do sistema
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
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ConfiguracoesFuncionario;