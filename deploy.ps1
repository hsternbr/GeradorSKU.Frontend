# Script para deploy da API .NET 7 via SCP direto + Docker no Windows
# Copia direta Windows → Linux via SSH/SCP

# Parar execução se houver erro
$ErrorActionPreference = "Stop"

# =========================
# CONFIGURAÇÕES - ALTERE AQUI PARA REUTILIZAR
# =========================

# CONFIGURAÇÕES DO SERVIDOR
$HOST_USER = "webuser"                     # Usuário SSH do servidor #$tern25
$HOST_IP = "10.1.0.49"                    # IP do servidor
$HOST_PATH = "/home/webuser/projetos/GeradorSKU.Frontend"  # Caminho no servidor (corrigido)
$LOCAL_PATH = ".\"                         # Caminho local (geralmente .\ para pasta atual)

# CONFIGURAÇÕES DO DOCKER
$DOCKER_NETWORK_CREATE = "FALSE"
$DOCKER_NETWORK_SUBNET = "192.168.30.0/24"    # Subnet da rede
$DOCKER_NETWORK_GATEWAY = "192.168.30.1"      # Gateway da rede
$DOCKER_COMPOSE_FILE = "docker-compose.yml"   # Nome do arquivo docker-compose
$API_CONTAINER_NAME = "GeradorSKU.Frontend"               # Nome do container da API

# CONFIGURAÇÕES DA APLICAÇÃO
$APP_PORT = 4120                           # Porta da aplicação
$HEALTH_CHECK_PORT = 80                       # Porta para health check
$STARTUP_WAIT_TIME = 15                       # Tempo de espera após subir containers (segundos)
$LOG_TAIL_LINES = 150                          # Número de linhas de log para mostrar

# ARQUIVOS/PASTAS A EXCLUIR NA SINCRONIZAÇÃO
$EXCLUDE_PATTERNS = @(
    'bin', 'obj', '*.out', '.vs', '.vscode', '*.bat',
    '*.user', '*.suo', '*.cache', '.git','*.tgz',
    'logs', '*.log', 'TestResults', 'coverage',
    'node_modules', '*.tmp', '*.temp', '*.rest'
)

# Funções para log colorido
function Write-LogInfo {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Green
}

function Write-LogWarn {
    param([string]$Message)
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function Write-LogError {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Write-LogStep {
    param([string]$Message)
    Write-Host "[STEP] $Message" -ForegroundColor Blue
}

# Função para verificar se um comando existe
function Test-Command {
    param([string]$Command)
    return [bool](Get-Command $Command -ErrorAction SilentlyContinue)
}

# =========================
# VERIFICAÇÕES INICIAIS
# =========================
Write-LogInfo "=== Deploy da Integração SAP - Windows → Linux via SCP Direto ==="

# Verifica se ssh/scp estão disponíveis
if (-not (Test-Command "ssh")) {
    Write-LogError "SSH não encontrado! Instale OpenSSH ou Git for Windows"
    exit 1
}

if (-not (Test-Command "scp")) {
    Write-LogError "SCP não encontrado! Instale OpenSSH ou Git for Windows"
    exit 1
}

Write-LogInfo "SSH e SCP encontrados OK"

# =========================
# PREPARAÇÃO DOS ARQUIVOS
# =========================
Write-LogStep "Preparando arquivos para cópia direta..."

# Cria pasta temporária limpa
$tempDir = Join-Path ([System.IO.Path]::GetTempPath()) ("deploy-" + (Get-Date -Format "yyyyMMddHHmmss"))
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
Write-LogInfo "Pasta temporária: $tempDir"

try {
    # Função para verificar se deve excluir
    function Should-Exclude {
        param([string]$RelativePath)
       
        foreach ($pattern in $EXCLUDE_PATTERNS) {
            if ($RelativePath -like "*$pattern*" -or $RelativePath -eq $pattern) {
                return $true
            }
        }
        return $false
    }
   
    # Copia arquivos filtrados
    Write-LogInfo "Copiando arquivos (excluindo padrões indesejados)..."

    $sourceItems = Get-ChildItem -Path $LOCAL_PATH -Recurse -Force
    $copiedCount = 0
   
    foreach ($item in $sourceItems) {
        $relativePath = $item.FullName.Substring((Resolve-Path $LOCAL_PATH).Path.Length).TrimStart('\')
       
        if (-not (Should-Exclude -RelativePath $relativePath)) {
            $destPath = Join-Path $tempDir $relativePath
           
            if ($item.PSIsContainer) {
                # É uma pasta
                if (-not (Test-Path $destPath)) {
                    New-Item -ItemType Directory -Path $destPath -Force | Out-Null
                }
            } else {
                # É um arquivo
                $destDir = Split-Path $destPath -Parent
                if (-not (Test-Path $destDir)) {
                    New-Item -ItemType Directory -Path $destDir -Force | Out-Null
                }
                Copy-Item -Path $item.FullName -Destination $destPath -Force
                $copiedCount++

                # Log especial para arquivos .env*
                if ($item.Name -like ".env*") {
                    Write-LogInfo "  -> Copiando arquivo de configuracao: $($item.Name)"
                }
            }
        }
    }
   
    Write-LogInfo "Arquivos preparados: $copiedCount arquivos"
   
    # =========================
    # CÓPIA DIRETA VIA SCP
    # =========================
    Write-LogStep "Preparando diretório no servidor..."
   
    # Cria diretório remoto e limpa conteúdo anterior
    ssh "${HOST_USER}@${HOST_IP}" "mkdir -p $HOST_PATH && rm -rf $HOST_PATH/* 2>/dev/null || true"
   
    if ($LASTEXITCODE -ne 0) {
        throw "Erro ao preparar diretório remoto"
    }
   
    Write-LogStep "Copiando arquivos via SCP..."
    Write-LogInfo "Enviando para $HOST_IP $HOST_PATH"
    Write-LogInfo "Pode solicitar senha SSH..."

    # Copia todos os arquivos recursivamente (incluindo arquivos ocultos)
    # Usando PSCP do Windows ou SCP nativo com barra normal
    $tempDirUnix = $tempDir -replace '\\', '/'
    scp -r "${tempDirUnix}/." "${HOST_USER}@${HOST_IP}:${HOST_PATH}/"
   
    if ($LASTEXITCODE -ne 0) {
        throw "Erro na cópia via SCP"
    }
   
    Write-LogInfo "Arquivos copiados com sucesso!"
   
    # Verifica se os arquivos foram copiados
    Write-LogStep "Verificando arquivos copiados..."
    ssh "${HOST_USER}@${HOST_IP}" "ls -la $HOST_PATH | head -10"
   
}
catch {
    Write-LogError "Erro na cópia: $($_.Exception.Message)"
    exit 1
}
finally {
    # Limpa pasta temporária
    if (Test-Path $tempDir) {
        Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue
    }
}

# =========================
# DEPLOY REMOTO
# =========================
Write-LogStep "Executando deploy Docker no servidor..."
Write-LogInfo "Pode solicitar senha SSH novamente..."

try {
    # Cria script remoto limpo (sem \r do Windows)
    $remoteCommands = @(
        "cd $HOST_PATH",
        "echo '=== Deploy Docker ==='",
        "echo '1. Verificando docker-compose...'",
        "if [ ! -f '$DOCKER_COMPOSE_FILE' ]; then",
        "    echo 'ERRO: $DOCKER_COMPOSE_FILE nao encontrado em $HOST_PATH'",
        "    ls -la $HOST_PATH",
        "    exit 1",
        "fi",
        "if [ '$DOCKER_NETWORK_CREATE' = 'TRUE' ]; then",
        "    echo '2. Criando rede Docker...'",
        "    docker network create $DOCKER_NETWORK_NAME --driver bridge --subnet=$DOCKER_NETWORK_SUBNET --gateway=$DOCKER_NETWORK_GATEWAY || echo 'Rede ja existe'",
        "fi",
        "echo '3. Parando containers...'",
        "docker-compose down || true",
        "echo '4. Build da imagem...'",
        "docker-compose build --no-cache",
        "echo '5. Subindo containers...'",
        "docker-compose up -d",
        "echo '6. Aguardando...'",
        "sleep $STARTUP_WAIT_TIME",
        "echo '7. Status:'",
        "docker-compose ps",
        "echo '8. Logs recentes:'",
        "docker-compose logs --tail=$LOG_TAIL_LINES $API_CONTAINER_NAME || docker-compose logs --tail=$LOG_TAIL_LINES",
        "echo '=== Deploy concluido ==='"
    )
   
    # Junta comandos com quebra de linha Unix
    $remoteScript = $remoteCommands -join "`n"
   
    # Executa via SSH
    Write-LogInfo "Executando comandos remotos..."
    $remoteScript | ssh "${HOST_USER}@${HOST_IP}" "bash -s"

    if ($LASTEXITCODE -ne 0) {
        throw "Erro no deploy Docker"
    }
   
    Write-LogInfo "Deploy executado com sucesso!"
}
catch {
    Write-LogError "Erro no deploy: $($_.Exception.Message)"
    Write-LogWarn "Verifique se Docker e docker-compose estão instalados no servidor"
    exit 1
}

# =========================
# INFORMAÇÕES FINAIS
# =========================
Write-LogInfo "=== Deploy Completo ==="
Write-LogInfo "Aplicacao deployada com sucesso!"
Write-LogInfo "URL provavel: http://${HOST_IP}:${APP_PORT}"
Write-LogInfo ""
Write-LogInfo "Para verificar:"
Write-LogInfo "  curl http://${HOST_IP}:${HEALTH_CHECK_PORT}"
Write-LogInfo ""
Write-LogInfo "Comandos úteis:"
Write-LogInfo "  Ver logs: ssh ${HOST_USER}@${HOST_IP} 'cd ${HOST_PATH} && docker-compose logs -f'"
Write-LogInfo "  Parar: ssh ${HOST_USER}@${HOST_IP} 'cd ${HOST_PATH} && docker-compose down'"
Write-LogInfo "  Restart: ssh ${HOST_USER}@${HOST_IP} 'cd ${HOST_PATH} && docker-compose restart'"
Write-LogInfo "  Status: ssh ${HOST_USER}@${HOST_IP} 'cd ${HOST_PATH} && docker-compose ps'"

Write-LogInfo ""
Write-LogInfo "Script concluido! OK"