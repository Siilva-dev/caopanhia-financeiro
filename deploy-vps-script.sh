#!/bin/bash

# =============================================================================
<<<<<<< HEAD
# SCRIPT DE DEPLOY COMPLETO PARA VPS CONTABO - VERSÃO CORRIGIDA
# Sistema: Pet Shop Cãompanhia
# Domínio: https://app.petshopcaopanhia.com/
# =============================================================================

set -e  # Parar execução se algum comando falhar

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log colorido
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERRO] $1${NC}" >&2
}

warning() {
    echo -e "${YELLOW}[AVISO] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

# Função para verificar se comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Função para verificar se serviço está rodando
is_service_running() {
    systemctl is-active --quiet "$1"
}

# Variáveis de configuração
DOMAIN="app.petshopcaopanhia.com"
PROJECT_DIR="/var/www/petshop"
GITHUB_REPO="https://github.com/Siilva-dev/petfolio-financeiro-v22-0.git"
NODE_VERSION="20"
EMAIL="contato@petshopcaopanhia.com"

log "🚀 Iniciando deploy do Pet Shop Capãompanhia na VPS..."

# =============================================================================
# VERIFICAÇÕES INICIAIS
# =============================================================================
log "🔍 Executando verificações iniciais..."

# Verificar se está rodando como usuário normal (não root)
if [[ $EUID -eq 0 ]]; then
   error "Este script não deve ser executado como root. Execute como usuário normal."
   exit 1
fi

# Verificar se tem sudo
if ! sudo -n true 2>/dev/null; then
    error "Usuário precisa ter privilégios sudo sem senha ou digite a senha quando solicitado."
fi

# Verificar conectividade
if ! ping -c 1 google.com &> /dev/null; then
    error "Sem conexão com internet. Verifique sua conectividade."
    exit 1
fi

log "✅ Verificações iniciais concluídas"
=======
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
>>>>>>> 2e3d8f856c22fcbd92b2a3c6f864ceb801fd3f36

# =============================================================================
# ETAPA 1: ATUALIZAR O SISTEMA
# =============================================================================
<<<<<<< HEAD
log "📦 Atualizando o sistema..."
sudo apt update
sudo apt upgrade -y

# =============================================================================
# ETAPA 2: INSTALAR DEPENDÊNCIAS ESSENCIAIS
# =============================================================================
log "🔧 Instalando dependências essenciais..."

# Instalar pacotes básicos
sudo apt install -y curl wget git nginx certbot python3-certbot-nginx build-essential software-properties-common

# Verificar se nginx foi instalado corretamente
if ! command_exists nginx; then
    error "Falha ao instalar nginx"
    exit 1
fi

# =============================================================================
# ETAPA 3: INSTALAR NODE.JS
# =============================================================================
log "📦 Instalando Node.js ${NODE_VERSION}..."

# Remover versões antigas do Node.js se existirem
sudo apt remove -y nodejs npm || true

# Instalar Node.js usando NodeSource
curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar instalação
if ! command_exists node || ! command_exists npm; then
    error "Falha ao instalar Node.js"
    exit 1
fi

NODE_VER=$(node --version)
NPM_VER=$(npm --version)
log "✅ Node.js ${NODE_VER} e npm ${NPM_VER} instalados com sucesso"

# =============================================================================
# ETAPA 4: INSTALAR PM2
# =============================================================================
log "🔄 Instalando PM2..."
sudo npm install -g pm2@latest

if ! command_exists pm2; then
    error "Falha ao instalar PM2"
    exit 1
fi

log "✅ PM2 instalado com sucesso"

# =============================================================================
# ETAPA 5: CONFIGURAR DIRETÓRIO DO PROJETO
# =============================================================================
log "📁 Configurando diretório do projeto..."

# Remover diretório existente se houver
if [ -d "$PROJECT_DIR" ]; then
    warning "Diretório $PROJECT_DIR já existe. Removendo..."
    sudo rm -rf "$PROJECT_DIR"
fi

# Criar diretório e definir permissões
sudo mkdir -p "$PROJECT_DIR"
sudo chown -R $USER:$USER "$PROJECT_DIR"

# =============================================================================
# ETAPA 6: CLONAR REPOSITÓRIO
# =============================================================================
log "📥 Clonando repositório do GitHub..."
cd "$PROJECT_DIR"

# Clonar com retry em caso de falha
for i in {1..3}; do
    if git clone "$GITHUB_REPO" .; then
        log "✅ Repositório clonado com sucesso"
        break
    else
        warning "Tentativa $i falhou. Tentando novamente..."
        sleep 5
        if [ $i -eq 3 ]; then
            error "Falha ao clonar repositório após 3 tentativas"
            exit 1
        fi
    fi
done

# =============================================================================
# ETAPA 7: CONFIGURAR VARIÁVEIS DE AMBIENTE
# =============================================================================
log "🔑 Configurando variáveis de ambiente..."
cat > .env << 'EOL'
=======
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
>>>>>>> 2e3d8f856c22fcbd92b2a3c6f864ceb801fd3f36
VITE_SUPABASE_PROJECT_ID="vsktxgniftqjlchemvsl"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZza3R4Z25pZnRxamxjaGVtdnNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyODQ4NzQsImV4cCI6MjA3MDg2MDg3NH0.mngIvBUMtit0mOvtkuG0G48WdDTmUIBcCDi8-b-tPLg"
VITE_SUPABASE_URL="https://vsktxgniftqjlchemvsl.supabase.co"
EOL

<<<<<<< HEAD
log "✅ Arquivo .env criado"

# =============================================================================
# ETAPA 8: INSTALAR DEPENDÊNCIAS E BUILD
# =============================================================================
log "📦 Instalando dependências do projeto..."

# Limpar cache do npm
npm cache clean --force

# Instalar dependências com retry
for i in {1..3}; do
    if npm install --production=false; then
        log "✅ Dependências instaladas com sucesso"
        break
    else
        warning "Tentativa $i falhou. Limpando node_modules e tentando novamente..."
        rm -rf node_modules package-lock.json
        sleep 5
        if [ $i -eq 3 ]; then
            error "Falha ao instalar dependências após 3 tentativas"
            exit 1
        fi
    fi
done

log "🏗️ Executando build de produção..."
if npm run build; then
    log "✅ Build concluído com sucesso"
else
    error "Falha no build do projeto"
    exit 1
fi

# Verificar se dist foi criado
if [ ! -d "dist" ]; then
    error "Diretório dist não foi criado. Build falhou."
    exit 1
fi
# =============================================================================
# ETAPA 8.5: CONFIGURAR VITE PARA ACEITAR QUALQUER DOMÍNIO
# =============================================================================
log "⚙️ Configurando Vite para aceitar qualquer host..."

# Verificar se vite.config.ts existe
if [ -f "$PROJECT_DIR/vite.config.ts" ]; then
    log "Arquivo vite.config.ts encontrado. Modificando..."

    # Script Node.js para adicionar allowedHosts no vite.config.ts
    node -e "
const fs = require('fs');
const path = require('path');

// Definindo o caminho do vite.config.ts com a variável PROJECT_DIR
const viteConfigPath = path.join('$PROJECT_DIR', 'vite.config.ts');

// Verificar se o arquivo existe
if (fs.existsSync(viteConfigPath)) {
    let content = fs.readFileSync(viteConfigPath, 'utf8');
    
    // Adicionar allowedHosts na configuração do server do Vite
    const regex = /server:\\s*{([^}]*)}/;
    const newConfig = \`server: { \$1 allowedHosts: true, }\`;

    content = content.replace(regex, newConfig);

    // Escrever de volta a configuração modificada
    fs.writeFileSync(viteConfigPath, content);
    console.log('✅ Vite.config.ts atualizado para aceitar qualquer domínio');
} else {
    console.error('❌ Arquivo vite.config.ts não encontrado no diretório');
}
    "
else
    warning "vite.config.ts não encontrado. Continuando instalação..."
fi

# =============================================================================
# ETAPA 9: CONFIGURAR PM2
# =============================================================================
log "🔄 Configurando PM2..."

# Parar processos PM2 existentes
pm2 delete all 2>/dev/null || true

# Criar diretório de logs
sudo mkdir -p /var/log/pm2
sudo chown -R $USER:$USER /var/log/pm2

# Criar configuração do PM2 (formato CommonJS)
cat > ecosystem.config.cjs << EOL
module.exports = {
  apps: [{
    name: 'petshop-caopanhia',
    script: 'npx',
    args: 'vite preview --host 0.0.0.0 --port 3000',
    cwd: '${PROJECT_DIR}',
=======
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
>>>>>>> 2e3d8f856c22fcbd92b2a3c6f864ceb801fd3f36
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/pm2/petshop-error.log',
    out_file: '/var/log/pm2/petshop-out.log',
    log_file: '/var/log/pm2/petshop-combined.log',
<<<<<<< HEAD
    time: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
=======
    time: true
>>>>>>> 2e3d8f856c22fcbd92b2a3c6f864ceb801fd3f36
  }]
}
EOL

<<<<<<< HEAD
# Iniciar aplicação com PM2
if pm2 start ecosystem.config.cjs; then
    log "✅ Aplicação iniciada com PM2"
else
    error "Falha ao iniciar aplicação com PM2"
    exit 1
fi

# Configurar auto-start
pm2 save
pm2 startup | tail -1 | sudo bash

# Aguardar aplicação inicializar
sleep 10

# Verificar se aplicação está rodando
if ! pm2 describe petshop-caopanhia | grep -q "online"; then
    error "Aplicação não está online"
    pm2 logs petshop-caopanhia --lines 20
    exit 1
fi

log "✅ PM2 configurado e aplicação online"

# =============================================================================
# ETAPA 10: CONFIGURAR NGINX
# =============================================================================
log "🌐 Configurando Nginx..."

# Backup da configuração existente
sudo cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup 2>/dev/null || true

# Remover configuração padrão
sudo rm -f /etc/nginx/sites-enabled/default

# Criar configuração inicial do site (apenas HTTP)
sudo tee /etc/nginx/sites-available/petshop > /dev/null << EOL
# Configuração HTTP inicial (SSL será adicionado pelo Certbot)
server {
    listen 80;
    server_name ${DOMAIN};

=======
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
    
>>>>>>> 2e3d8f856c22fcbd92b2a3c6f864ceb801fd3f36
    # Cabeçalhos de segurança
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
<<<<<<< HEAD
    add_header Content-Security-Policy "default-src 'self' https: data: blob: 'unsafe-inline' 'unsafe-eval'" always;

    # Configuração de proxy
    location / {
        proxy_pass http://127.0.0.1:3000;
=======
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Proxy para aplicação Node.js
    location / {
        proxy_pass http://localhost:3000;
>>>>>>> 2e3d8f856c22fcbd92b2a3c6f864ceb801fd3f36
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
<<<<<<< HEAD
        proxy_send_timeout 300s;
    }

    # Configurações para arquivos estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://127.0.0.1:3000;
=======
    }

    # Configurações para arquivos estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        proxy_pass http://localhost:3000;
>>>>>>> 2e3d8f856c22fcbd92b2a3c6f864ceb801fd3f36
        proxy_set_header Host \$host;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

<<<<<<< HEAD
    # Logs específicos
=======
    # Logs
>>>>>>> 2e3d8f856c22fcbd92b2a3c6f864ceb801fd3f36
    access_log /var/log/nginx/petshop_access.log;
    error_log /var/log/nginx/petshop_error.log;
}
EOL

# Ativar site
sudo ln -sf /etc/nginx/sites-available/petshop /etc/nginx/sites-enabled/
<<<<<<< HEAD

# Testar configuração
if sudo nginx -t; then
    log "✅ Configuração do Nginx válida"
else
    error "Configuração do Nginx inválida"
    exit 1
fi

# =============================================================================
# ETAPA 11: CONFIGURAR FIREWALL
# =============================================================================
log "🔥 Configurando firewall..."
sudo ufw --force reset
sudo ufw default deny incoming
sudo ufw default allow outgoing
=======
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
>>>>>>> 2e3d8f856c22fcbd92b2a3c6f864ceb801fd3f36
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

<<<<<<< HEAD
log "✅ Firewall configurado"

# =============================================================================
# ETAPA 12: INICIAR NGINX
# =============================================================================
log "🚀 Iniciando Nginx..."
sudo systemctl enable nginx
sudo systemctl restart nginx

# Aguardar nginx inicializar
sleep 5

if is_service_running nginx; then
    log "✅ Nginx iniciado com sucesso"
else
    error "Falha ao iniciar Nginx"
    sudo journalctl -u nginx --no-pager -l
    exit 1
fi

# =============================================================================
# ETAPA 13: CONFIGURAR SSL
# =============================================================================
log "🔒 Configurando SSL com Let's Encrypt..."

# Obter certificado SSL com verificações
for i in {1..3}; do
    if sudo certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --email "$EMAIL" --redirect; then
        log "✅ Certificado SSL obtido com sucesso"
        break
    else
        warning "Tentativa $i falhou. Aguardando e tentando novamente..."
        sleep 30
        if [ $i -eq 3 ]; then
            warning "Falha ao obter certificado SSL. Continuando sem HTTPS..."
            # Não falhar o script por causa do SSL
        fi
    fi
done

# Configurar renovação automática
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# =============================================================================
# ETAPA 14: VERIFICAÇÕES FINAIS
# =============================================================================
log "✅ Executando verificações finais..."

# Verificar PM2
info "Status do PM2:"
pm2 status

# Verificar Nginx
info "Status do Nginx:"
sudo systemctl status nginx --no-pager -l

# Testar aplicação local
info "Testando aplicação local:"
for i in {1..5}; do
    if curl -f -s http://localhost:3000 > /dev/null; then
        log "✅ Aplicação respondendo localmente"
        break
    else
        warning "Tentativa $i - aplicação não responde. Aguardando..."
        sleep 10
        if [ $i -eq 5 ]; then
            error "Aplicação não está respondendo após múltiplas tentativas"
            pm2 logs petshop-caopanhia --lines 50
        fi
    fi
done

# Verificar certificado SSL
info "Verificando certificados SSL:"
sudo certbot certificates || warning "Nenhum certificado SSL encontrado"

# =============================================================================
# CRIAR SCRIPT DE ATUALIZAÇÃO
# =============================================================================
log "📝 Criando script de atualização..."
cat > /home/$USER/update-petshop.sh << 'EOL'
#!/bin/bash
set -e

echo "🔄 Atualizando Pet Shop Capãompanhia..."

cd /var/www/petshop

# Backup
cp -r dist dist.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || true

# Atualizar código
git pull origin main

# Instalar dependências
npm install

# Build
npm run build

# Reiniciar PM2
pm2 restart petshop-caopanhia

# Verificar se está online
sleep 10
if pm2 describe petshop-caopanhia | grep -q "online"; then
    echo "✅ Atualização concluída com sucesso!"
    # Remover backups antigos (manter apenas 3)
    ls -dt dist.backup.* 2>/dev/null | tail -n +4 | xargs rm -rf 2>/dev/null || true
else
    echo "❌ Erro na atualização. Restaurando backup..."
    LATEST_BACKUP=$(ls -dt dist.backup.* 2>/dev/null | head -1)
    if [ -n "$LATEST_BACKUP" ]; then
        rm -rf dist
        mv "$LATEST_BACKUP" dist
        pm2 restart petshop-caopanhia
    fi
    exit 1
fi
=======
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
>>>>>>> 2e3d8f856c22fcbd92b2a3c6f864ceb801fd3f36
EOL

chmod +x /home/$USER/update-petshop.sh

# =============================================================================
# FINALIZAÇÃO
# =============================================================================
echo ""
<<<<<<< HEAD
echo -e "${GREEN}🎉 ============================================${NC}"
echo -e "${GREEN}🎉 DEPLOY CONCLUÍDO COM SUCESSO!${NC}"
echo -e "${GREEN}🎉 ============================================${NC}"
echo ""
echo -e "${BLUE}🌐 Seu site está disponível em:${NC}"
echo -e "   ${YELLOW}https://${DOMAIN}${NC}"
echo ""
echo -e "${BLUE}📊 Comandos úteis:${NC}"
echo -e "   ${GREEN}pm2 status${NC}              - Ver status da aplicação"
echo -e "   ${GREEN}pm2 logs${NC}                - Ver logs em tempo real"
echo -e "   ${GREEN}pm2 restart petshop-caopanhia${NC} - Reiniciar aplicação"
echo -e "   ${GREEN}sudo systemctl reload nginx${NC} - Recarregar Nginx"
echo -e "   ${GREEN}~/update-petshop.sh${NC}     - Atualizar aplicação"
echo ""
echo -e "${BLUE}📁 Diretórios importantes:${NC}"
echo -e "   ${GREEN}Projeto:${NC} $PROJECT_DIR"
echo -e "   ${GREEN}Logs PM2:${NC} /var/log/pm2/"
echo -e "   ${GREEN}Logs Nginx:${NC} /var/log/nginx/"
echo ""
echo -e "${GREEN}✅ Sistema 100% funcional em produção!${NC}"
echo -e "${GREEN}✅ Auto-restart configurado!${NC}"
echo -e "${GREEN}✅ Firewall configurado!${NC}"
echo -e "${GREEN}✅ SSL configurado (se disponível)!${NC}"
echo ""





=======
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
>>>>>>> 2e3d8f856c22fcbd92b2a3c6f864ceb801fd3f36
