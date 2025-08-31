import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Shield, Smartphone, Key, CheckCircle, AlertTriangle, Copy, Eye, EyeOff } from 'lucide-react';

interface TwoFactorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStatus: boolean;
  onStatusChange: (enabled: boolean) => void;
}

export function TwoFactorModal({ isOpen, onClose, currentStatus, onStatusChange }: TwoFactorModalProps) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'setup' | 'verify' | 'disable'>('setup');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [factorId, setFactorId] = useState('');
  const [showSecret, setShowSecret] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (currentStatus) {
        setStep('disable');
      } else {
        setStep('setup');
        setupMFA();
      }
    }
  }, [isOpen, currentStatus]);

  const setupMFA = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Sistema Financeiro'
      });

      if (error) throw error;

      setQrCodeUrl(data.totp.qr_code);
      setSecret(data.totp.secret);
      setFactorId(data.id);
    } catch (error: any) {
      console.error('Erro ao configurar 2FA:', error);
      toast({
        title: "Erro ao configurar 2FA",
        description: error.message || "Não foi possível configurar a autenticação de dois fatores.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyAndEnable = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast({
        title: "Código inválido",
        description: "Digite um código de 6 dígitos.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: factorId,
        code: verificationCode
      });

      if (error) throw error;

      toast({
        title: "2FA ativado com sucesso!",
        description: "Sua conta agora está protegida com autenticação de dois fatores.",
      });

      onStatusChange(true);
      onClose();
    } catch (error: any) {
      console.error('Erro ao verificar código:', error);
      toast({
        title: "Código incorreto",
        description: "Verifique o código no seu aplicativo autenticador e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const disableMFA = async () => {
    try {
      setLoading(true);

      // Listar fatores ativos
      const { data: factors, error: listError } = await supabase.auth.mfa.listFactors();
      
      if (listError) throw listError;

      // Desabilitar todos os fatores TOTP
      for (const factor of factors.totp) {
        const { error } = await supabase.auth.mfa.unenroll({
          factorId: factor.id
        });
        if (error) throw error;
      }

      toast({
        title: "2FA desativado",
        description: "A autenticação de dois fatores foi removida da sua conta.",
      });

      onStatusChange(false);
      onClose();
    } catch (error: any) {
      console.error('Erro ao desativar 2FA:', error);
      toast({
        title: "Erro ao desativar 2FA",
        description: error.message || "Não foi possível desativar a autenticação de dois fatores.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    toast({
      title: "Código copiado!",
      description: "O código secreto foi copiado para a área de transferência.",
    });
  };

  const handleClose = () => {
    setStep('setup');
    setVerificationCode('');
    setQrCodeUrl('');
    setSecret('');
    setFactorId('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Autenticação de Dois Fatores
          </DialogTitle>
          <DialogDescription>
            {step === 'setup' && "Configure a autenticação de dois fatores para maior segurança"}
            {step === 'verify' && "Verifique o código do seu aplicativo autenticador"}
            {step === 'disable' && "Gerenciar autenticação de dois fatores"}
          </DialogDescription>
        </DialogHeader>

        {step === 'setup' && (
          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Smartphone className="h-4 w-4" />
                      1. Instale um aplicativo autenticador
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      Recomendamos: Google Authenticator, Microsoft Authenticator, Authy
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Key className="h-4 w-4" />
                      2. Escaneie o QR Code ou digite o código
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {qrCodeUrl && (
                      <div className="flex justify-center">
                        <img src={qrCodeUrl} alt="QR Code para 2FA" className="w-32 h-32" />
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <Label className="text-xs">Código manual (caso não consiga escanear):</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type={showSecret ? "text" : "password"}
                          value={secret}
                          readOnly
                          className="font-mono text-xs"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowSecret(!showSecret)}
                        >
                          {showSecret ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={copySecret}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Button
                  onClick={() => setStep('verify')}
                  className="w-full"
                  disabled={!qrCodeUrl}
                >
                  Continuar para Verificação
                </Button>
              </>
            )}
          </div>
        )}

        {step === 'verify' && (
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  3. Digite o código de verificação
                </CardTitle>
                <CardDescription>
                  Digite o código de 6 dígitos do seu aplicativo autenticador
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={verificationCode}
                    onChange={setVerificationCode}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setStep('setup')}
                className="flex-1"
              >
                Voltar
              </Button>
              <Button
                onClick={verifyAndEnable}
                disabled={loading || verificationCode.length !== 6}
                className="flex-1"
              >
                {loading ? "Verificando..." : "Ativar 2FA"}
              </Button>
            </div>
          </div>
        )}

        {step === 'disable' && (
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-medium">2FA Ativo</h3>
                    <p className="text-sm text-muted-foreground">Sua conta está protegida</p>
                  </div>
                </div>

                <Badge variant="secondary" className="mb-4">
                  Sistema Financeiro
                </Badge>

                <Separator className="my-4" />

                <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800">
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-800 dark:text-amber-200">Atenção</p>
                    <p className="text-amber-700 dark:text-amber-300">
                      Desativar o 2FA reduzirá a segurança da sua conta.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={disableMFA}
                disabled={loading}
                className="flex-1"
              >
                {loading ? "Desativando..." : "Desativar 2FA"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}