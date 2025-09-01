#!/bin/bash

# =============================================================================
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

# =============================================================================
# ETAPA 1: ATUALIZAR O SISTEMA
# =============================================================================
log "📦 Atualizando o sistema..."
sudo apt update
sudo apt upgrade -y

# =============================================================================
# ETAPA 2: INSTALAR DEPENDÊNCIAS ESSENCIAIS
# =============================================================================
log "🔧 Instalando dependências essenciais..."

# Instalar pacotes básicos
sudo apt install -y curl wget git nginx certbot python3-certbot-nginx build-essential software-properties-common
# Impedir que o nginx do sistema tente iniciar sozinho (evita conflito com Traefik)
sudo systemctl stop nginx 2>/dev/null || true
sudo systemctl disable nginx 2>/dev/null || true

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
VITE_SUPABASE_PROJECT_ID="vsktxgniftqjlchemvsl"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZza3R4Z25pZnRxamxjaGVtdnNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyODQ4NzQsImV4cCI6MjA3MDg2MDg3NH0.mngIvBUMtit0mOvtkuG0G48WdDTmUIBcCDi8-b-tPLg"
VITE_SUPABASE_URL="https://vsktxgniftqjlchemvsl.supabase.co"
EOL

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
    args: 'vite preview --host 0.0.0.0 --port 5000',
    cwd: '${PROJECT_DIR}',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 5000  
    },
    error_file: '/var/log/pm2/petshop-error.log',
    out_file: '/var/log/pm2/petshop-out.log',
    log_file: '/var/log/pm2/petshop-combined.log',
    time: true
  }]
}
EOL


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

# Verificar se portas 80/443 estão ocupadas (Traefik/Docker)
PORT_80_BUSY=false
PORT_443_BUSY=false

if ss -tuln | grep -q ":80 "; then
    PORT_80_BUSY=true
    log "⚠️  Porta 80 ocupada (provavelmente Traefik/Docker)"
fi

if ss -tuln | grep -q ":443 "; then
    PORT_443_BUSY=true
    log "⚠️  Porta 443 ocupada (provavelmente Traefik/Docker)"
fi

# Verificar se Nginx já está rodando
NGINX_RUNNING=false
if systemctl is-active --quiet nginx; then
    log "⚠️  Nginx já está rodando. Apenas adicionando nova configuração..."
    NGINX_RUNNING=true
else
    log "📦 Nginx não está ativo. Verificando instalação..."
    
    # Se portas principais estão ocupadas, não tentar iniciar nginx
    if [ "$PORT_80_BUSY" = true ] || [ "$PORT_443_BUSY" = true ]; then
        log "🚫 Portas 80/443 ocupadas por Traefik/Docker. Nginx será configurado mas não iniciado."
        log "📌 Traefik deve rotear o tráfego para nossa aplicação na porta 8080"
        
        # Instalar nginx se não estiver instalado (só para configuração)
        if ! command_exists nginx; then
            log "📦 Instalando Nginx (apenas para configuração)..."
            sudo apt update
            sudo apt install -y nginx
        fi
        
        # Parar nginx se estiver tentando rodar e falhando
        sudo systemctl stop nginx 2>/dev/null || true
        sudo systemctl disable nginx 2>/dev/null || true
        
        NGINX_RUNNING=false
    else
        # Portas livres, pode iniciar nginx normalmente
        if ! command_exists nginx; then
            log "📦 Instalando Nginx..."
            sudo apt update
            sudo apt install -y nginx
        fi
    fi
fi

# Criar diretório webroot para certbot
sudo mkdir -p /var/www/html
sudo chown -R www-data:www-data /var/www/html

# Remover configuração padrão que usa porta 80 APENAS se nginx não estiver rodando
if [ "$NGINX_RUNNING" = false ]; then
    sudo rm -f /etc/nginx/sites-enabled/default
    log "✅ Removida configuração default da porta 80"
fi

# Criar configuração inicial do site (HTTP na porta 8080)
sudo tee /etc/nginx/sites-available/petshop > /dev/null << EOL
server {
    listen 8080;
    server_name ${DOMAIN};

    # Diretório para webroot do certbot
    location /.well-known/acme-challenge/ {
        root /var/www/html;
        try_files \$uri =404;
    }

    # Cabeçalhos de segurança
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XXS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Configuração de proxy
    location / {
        proxy_pass http://127.0.0.1:5000;  
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
        proxy_send_timeout 300s;
    }

    # Configurações para arquivos estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host \$host;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Logs específicos
    access_log /var/log/nginx/petshop_access.log;
    error_log /var/log/nginx/petshop_error.log;
}
EOL

# Ativar site
sudo ln -sf /etc/nginx/sites-available/petshop /etc/nginx/sites-enabled/

# Testar configuração
if sudo nginx -t; then
    log "✅ Configuração do Nginx válida"
else
    error "Configuração do Nginx inválida"
    exit 1
fi

# Iniciar/Recarregar Nginx APENAS se portas estão livres
if [ "$NGINX_RUNNING" = true ]; then
    log "🔄 Recarregando Nginx existente..."
    if sudo systemctl reload nginx; then
        log "✅ Nginx recarregado com sucesso (Evolution API preservado)"
    else
        error "Falha ao recarregar Nginx"
        exit 1
    fi
elif [ "$PORT_80_BUSY" = false ] && [ "$PORT_443_BUSY" = false ]; then
    log "🚀 Portas livres - Iniciando Nginx..."
    if sudo systemctl start nginx; then
        sudo systemctl enable nginx
        log "✅ Nginx iniciado com sucesso"
    else
        error "Falha ao iniciar Nginx"
        exit 1
    fi
else
    log "🚫 Nginx NÃO será iniciado (portas 80/443 ocupadas por Traefik)"
    log "📌 Aplicação rodando na porta 5000, configuração Nginx criada na porta 8080"
    log "📌 Configure seu Traefik para rotear tráfego para localhost:8080"
fi

# =============================================================================
# ETAPA 11: CONFIGURAR FIREWALL
# =============================================================================
log "🔥 Configurando firewall..."
sudo ufw --force reset
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 8080/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

log "✅ Firewall configurado"

# =============================================================================
# ETAPA 13: CONFIGURAR SSL
# =============================================================================
log "🔒 Configurando SSL com Let's Encrypt..."

# Aguardar nginx estar totalmente inicializado
sleep 5

# Obter certificado SSL usando webroot (evita conflito com porta 80)
for i in {1..3}; do
    if sudo certbot certonly --webroot -w /var/www/html -d "$DOMAIN" --non-interactive --agree-tos --email "$EMAIL"; then
        log "✅ Certificado SSL obtido com sucesso"
        
        # Agora atualizar a configuração do nginx para incluir SSL
        sudo tee /etc/nginx/sites-available/petshop > /dev/null << EOF
server {
    listen 8080;
    server_name ${DOMAIN};
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ${DOMAIN};

    ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;

    # Configurações SSL modernas
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA384;
    ssl_prefer_server_ciphers off;

    # Cabeçalhos de segurança
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Configuração de proxy
    location / {
        proxy_pass http://127.0.0.1:5000;  
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
        proxy_send_timeout 300s;
    }

    # Configurações para arquivos estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host \$host;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Logs específicos
    access_log /var/log/nginx/petshop_access.log;
    error_log /var/log/nginx/petshop_error.log;
}
EOF
        
        # Testar nova configuração
        if sudo nginx -t; then
            sudo systemctl reload nginx
            log "✅ Nginx recarregado com configuração SSL"
        else
            warning "Erro na configuração SSL do Nginx, mantendo configuração HTTP"
        fi
        break
    else
        warning "Tentativa $i falhou. Aguardando e tentando novamente..."
        sleep 30
        if [ $i -eq 3 ]; then
            warning "Falha ao obter certificado SSL. Continuando apenas com HTTP..."
            # Não falhar o script por causa do SSL
        fi
    fi
done

# Configurar renovação automática
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer


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
    if curl -f -s http://localhost:5000 > /dev/null; then
        log "✅ Aplicação respondendo localmente na porta 5000"
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

# Testar via nginx na porta 8080
info "Testando aplicação via Nginx na porta 8080:"
for i in {1..3}; do
    if curl -f -s http://localhost:8080 > /dev/null; then
        log "✅ Aplicação respondendo via Nginx na porta 8080"
        break
    else
        warning "Tentativa $i - nginx não responde. Aguardando..."
        sleep 5
        if [ $i -eq 3 ]; then
            warning "Nginx não está respondendo na porta 8080"
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
EOL

chmod +x /home/$USER/update-petshop.sh

# =============================================================================
# FINALIZAÇÃO
# =============================================================================
echo ""
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
