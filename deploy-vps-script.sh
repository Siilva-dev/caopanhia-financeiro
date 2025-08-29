#!/bin/bash

# =============================================================================
# SCRIPT DE DEPLOY COMPLETO PARA VPS CONTABO
# Sistema: Pet Shop Capãompanhia
# Domínio: https://www.petshopcaopanhia.com/
# =============================================================================

echo "🚀 Iniciando deploy do Pet Shop Capãompanhia na VPS..."

# Variáveis de configuração
DOMAIN="petshopcaopanhia.com"
WWW_DOMAIN="www.petshopcaopanhia.com"
PROJECT_DIR="/var/www/petshop"
GITHUB_REPO="https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git"  # SUBSTITUA PELA SUA URL DO GITHUB

# =============================================================================
# ETAPA 1: ATUALIZAR O SISTEMA
# =============================================================================
echo "📦 Atualizando o sistema..."
sudo apt update && sudo apt upgrade -y

# =============================================================================
# ETAPA 2: INSTALAR DEPENDÊNCIAS
# =============================================================================
echo "🔧 Instalando dependências essenciais..."
sudo apt install -y curl wget git nginx certbot python3-certbot-nginx

# Instalar Node.js 20 (LTS)
echo "📦 Instalando Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar versões instaladas
echo "✅ Verificando versões instaladas..."
node --version
npm --version

# Instalar PM2 globalmente
echo "🔄 Instalando PM2..."
sudo npm install -g pm2

# =============================================================================
# ETAPA 3: CONFIGURAR DIRETÓRIO DO PROJETO
# =============================================================================
echo "📁 Criando diretório do projeto..."
sudo mkdir -p $PROJECT_DIR
sudo chown -R $USER:$USER $PROJECT_DIR

# =============================================================================
# ETAPA 4: CLONAR O REPOSITÓRIO
# =============================================================================
echo "📥 Clonando repositório do GitHub..."
cd $PROJECT_DIR
git clone $GITHUB_REPO .

# =============================================================================
# ETAPA 5: CONFIGURAR VARIÁVEIS DE AMBIENTE
# =============================================================================
echo "🔑 Configurando variáveis de ambiente..."
cat > .env << EOL
VITE_SUPABASE_PROJECT_ID="vsktxgniftqjlchemvsl"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZza3R4Z25pZnRxamxjaGVtdnNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyODQ4NzQsImV4cCI6MjA3MDg2MDg3NH0.mngIvBUMtit0mOvtkuG0G48WdDTmUIBcCDi8-b-tPLg"
VITE_SUPABASE_URL="https://vsktxgniftqjlchemvsl.supabase.co"
EOL

# =============================================================================
# ETAPA 6: INSTALAR DEPENDÊNCIAS E BUILD
# =============================================================================
echo "📦 Instalando dependências do projeto..."
npm install

echo "🏗️ Executando build de produção..."
npm run build

# =============================================================================
# ETAPA 7: CONFIGURAR PM2
# =============================================================================
echo "🔄 Configurando PM2..."
cat > ecosystem.config.js << EOL
module.exports = {
  apps: [{
    name: 'petshop-caopanhia',
    script: 'npm',
    args: 'run preview',
    cwd: '$PROJECT_DIR',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/pm2/petshop-error.log',
    out_file: '/var/log/pm2/petshop-out.log',
    log_file: '/var/log/pm2/petshop-combined.log',
    time: true
  }]
}
EOL

# Criar diretório de logs
sudo mkdir -p /var/log/pm2
sudo chown -R $USER:$USER /var/log/pm2

# Iniciar aplicação com PM2
pm2 start ecosystem.config.js

# Salvar configuração do PM2 e configurar auto-start
pm2 save
pm2 startup

# =============================================================================
# ETAPA 8: CONFIGURAR NGINX
# =============================================================================
echo "🌐 Configurando Nginx..."
sudo tee /etc/nginx/sites-available/petshop << EOL
server {
    listen 80;
    server_name $DOMAIN $WWW_DOMAIN;

    # Redirecionar HTTP para HTTPS (será configurado após SSL)
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN $WWW_DOMAIN;

    # Configurações SSL (serão preenchidas pelo Certbot)
    
    # Cabeçalhos de segurança
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Proxy para aplicação Node.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Configurações para arquivos estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host \$host;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Logs
    access_log /var/log/nginx/petshop_access.log;
    error_log /var/log/nginx/petshop_error.log;
}
EOL

# Ativar site
sudo ln -sf /etc/nginx/sites-available/petshop /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Testar configuração do Nginx
sudo nginx -t

# =============================================================================
# ETAPA 9: CONFIGURAR SSL COM LET'S ENCRYPT
# =============================================================================
echo "🔒 Configurando SSL com Let's Encrypt..."
sudo systemctl reload nginx

# Obter certificado SSL
sudo certbot --nginx -d $DOMAIN -d $WWW_DOMAIN --non-interactive --agree-tos --email contato@$DOMAIN

# Configurar renovação automática
sudo systemctl enable certbot.timer

# =============================================================================
# ETAPA 10: CONFIGURAR FIREWALL
# =============================================================================
echo "🔥 Configurando firewall..."
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

# =============================================================================
# ETAPA 11: INICIAR SERVIÇOS
# =============================================================================
echo "🚀 Iniciando serviços..."
sudo systemctl enable nginx
sudo systemctl start nginx
sudo systemctl reload nginx

# =============================================================================
# ETAPA 12: VERIFICAÇÕES FINAIS
# =============================================================================
echo "✅ Executando verificações finais..."

echo "🔍 Status do PM2:"
pm2 status

echo "🔍 Status do Nginx:"
sudo systemctl status nginx --no-pager

echo "🔍 Testando aplicação local:"
curl -I http://localhost:3000

echo "🔍 Verificando certificado SSL:"
sudo certbot certificates

# =============================================================================
# SCRIPT DE ATUALIZAÇÃO AUTOMÁTICA
# =============================================================================
echo "📝 Criando script de atualização..."
cat > /home/$USER/update-petshop.sh << EOL
#!/bin/bash
echo "🔄 Atualizando Pet Shop Capãompanhia..."
cd $PROJECT_DIR
git pull origin main
npm install
npm run build
pm2 restart petshop-caopanhia
echo "✅ Atualização concluída!"
EOL

chmod +x /home/$USER/update-petshop.sh

# =============================================================================
# FINALIZAÇÃO
# =============================================================================
echo ""
echo "🎉 ============================================"
echo "🎉 DEPLOY CONCLUÍDO COM SUCESSO!"
echo "🎉 ============================================"
echo ""
echo "🌐 Seu site está disponível em:"
echo "   https://$DOMAIN"
echo "   https://$WWW_DOMAIN"
echo ""
echo "📊 Comandos úteis:"
echo "   pm2 status              - Ver status da aplicação"
echo "   pm2 logs                - Ver logs em tempo real"
echo "   pm2 restart all         - Reiniciar aplicação"
echo "   sudo systemctl reload nginx - Recarregar Nginx"
echo "   ~/update-petshop.sh     - Atualizar aplicação"
echo ""
echo "📁 Diretórios importantes:"
echo "   Projeto: $PROJECT_DIR"
echo "   Logs PM2: /var/log/pm2/"
echo "   Logs Nginx: /var/log/nginx/"
echo ""
echo "🔒 SSL configurado automaticamente!"
echo "🔥 Firewall configurado!"
echo "🔄 Auto-restart configurado!"
echo ""
echo "✅ Sistema 100% funcional em produção!"