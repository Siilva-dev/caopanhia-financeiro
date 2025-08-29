# 🚀 DEPLOY MANUAL - PET SHOP CAPÃOMPANHIA VPS

## ⚠️ ANTES DE COMEÇAR:
1. Substitua `SEU_USUARIO/SEU_REPOSITORIO` pela URL real do seu GitHub
2. Certifique-se que o domínio `petshopcaopanhia.com` já está apontando para o IP da sua VPS
3. Tenha acesso SSH à sua VPS da Contabo

---

## 🔧 COMANDO RÁPIDO (Execute tudo de uma vez):

```bash
# 1. Fazer download do script
wget https://raw.githubusercontent.com/SEU_USUARIO/SEU_REPOSITORIO/main/deploy-vps-script.sh

# 2. Dar permissão de execução
chmod +x deploy-vps-script.sh

# 3. Editar o script para colocar a URL correta do GitHub
nano deploy-vps-script.sh
# (Altere a linha: GITHUB_REPO="https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git")

# 4. Executar o script completo
./deploy-vps-script.sh
```

---

## 📋 COMANDOS PASSO A PASSO (Caso prefira executar manualmente):

### 1️⃣ Atualizar Sistema
```bash
sudo apt update && sudo apt upgrade -y
```

### 2️⃣ Instalar Dependências
```bash
# Instalar pacotes essenciais
sudo apt install -y curl wget git nginx certbot python3-certbot-nginx

# Instalar Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar PM2
sudo npm install -g pm2
```

### 3️⃣ Preparar Projeto
```bash
# Criar diretório
sudo mkdir -p /var/www/petshop
sudo chown -R $USER:$USER /var/www/petshop

# Clonar repositório
cd /var/www/petshop
git clone https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git .
```

### 4️⃣ Configurar Ambiente
```bash
# Criar arquivo .env
cat > .env << 'EOL'
VITE_SUPABASE_PROJECT_ID="vsktxgniftqjlchemvsl"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZza3R4Z25pZnRxamxjaGVtdnNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyODQ4NzQsImV4cCI6MjA3MDg2MDg3NH0.mngIvBUMtit0mOvtkuG0G48WdDTmUIBcCDi8-b-tPLg"
VITE_SUPABASE_URL="https://vsktxgniftqjlchemvsl.supabase.co"
EOL
```

### 5️⃣ Build da Aplicação
```bash
# Instalar dependências
npm install

# Build de produção
npm run build
```

### 6️⃣ Configurar PM2
```bash
# Criar configuração do PM2
cat > ecosystem.config.js << 'EOL'
module.exports = {
  apps: [{
    name: 'petshop-caopanhia',
    script: 'npm',
    args: 'run preview',
    cwd: '/var/www/petshop',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
EOL

# Iniciar aplicação
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 7️⃣ Configurar Nginx
```bash
# Criar configuração do Nginx
sudo tee /etc/nginx/sites-available/petshop << 'EOL'
server {
    listen 80;
    server_name petshopcaopanhia.com www.petshopcaopanhia.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name petshopcaopanhia.com www.petshopcaopanhia.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOL

# Ativar site
sudo ln -sf /etc/nginx/sites-available/petshop /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

### 8️⃣ Configurar SSL
```bash
# Obter certificado SSL gratuito
sudo certbot --nginx -d petshopcaopanhia.com -d www.petshopcaopanhia.com

# Configurar renovação automática
sudo systemctl enable certbot.timer
```

### 9️⃣ Configurar Firewall
```bash
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
```

---

## ✅ VERIFICAÇÕES FINAIS:

```bash
# Verificar status da aplicação
pm2 status

# Verificar Nginx
sudo systemctl status nginx

# Testar aplicação
curl -I http://localhost:3000

# Verificar SSL
sudo certbot certificates
```

---

## 🔄 COMANDOS ÚTEIS PARA MANUTENÇÃO:

```bash
# Ver logs em tempo real
pm2 logs

# Reiniciar aplicação
pm2 restart petshop-caopanhia

# Atualizar código do GitHub
cd /var/www/petshop
git pull origin main
npm install
npm run build
pm2 restart petshop-caopanhia

# Recarregar Nginx
sudo systemctl reload nginx

# Ver logs do Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

---

## 🎯 RESULTADO FINAL:
- ✅ Site disponível em: **https://petshopcaopanhia.com**
- ✅ SSL/HTTPS configurado automaticamente
- ✅ Auto-restart em caso de falhas
- ✅ Firewall configurado
- ✅ Logs organizados
- ✅ Fácil atualização via Git

**🚀 Sistema 100% funcional em produção!**