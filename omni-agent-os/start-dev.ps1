# Omni-Agent-OS Quick Start Script (Windows PowerShell)
# Usage: Right-click -> Run with PowerShell, or: .\start-dev.ps1

$ErrorActionPreference = "Continue"
$PROJECT_ROOT = $PSScriptRoot

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Omni-Agent-OS Quick Start Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Check environment
Write-Host ""
Write-Host "[1/7] Checking environment..." -ForegroundColor Yellow

$tools = @{
    "java" = "JDK"
    "mvn" = "Maven"
    "node" = "Node.js"
    "python" = "Python"
}

$missing = @()
foreach ($tool in $tools.Keys) {
    $result = Get-Command $tool -ErrorAction SilentlyContinue
    if (-not $result) {
        $missing += $tools[$tool]
    } else {
        Write-Host "  [OK] $($tools[$tool])" -ForegroundColor Green
    }
}

if ($missing.Count -gt 0) {
    Write-Host ""
    Write-Host "[ERROR] Missing tools: $($missing -join ', ')" -ForegroundColor Red
    Write-Host "Please install missing tools first" -ForegroundColor Red
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

# 2. Start infrastructure (Docker Compose)
Write-Host ""
Write-Host "[2/7] Starting infrastructure with Docker Compose..." -ForegroundColor Yellow

$docker = Get-Command docker -ErrorAction SilentlyContinue
if ($docker) {
    $deployDir = Join-Path $PROJECT_ROOT "deploy"
    $composeFile = Join-Path $deployDir "docker-compose.yml"

    # Check if docker-compose or docker compose is available
    $dockerCompose = Get-Command docker-compose -ErrorAction SilentlyContinue
    $dockerComposeV2 = $null
    if (-not $dockerCompose) {
        # Try docker compose (v2)
        $result = docker compose version 2>$null
        if ($LASTEXITCODE -eq 0) {
            $dockerComposeV2 = $true
        }
    }

    if ($dockerCompose -or $dockerComposeV2) {
        if ($dockerCompose) {
            # Use docker-compose (v1)
            Write-Host "  [Start] Starting all services via docker-compose..." -ForegroundColor Cyan
            Set-Location $deployDir
            docker-compose up -d
        } else {
            # Use docker compose (v2)
            Write-Host "  [Start] Starting all services via docker compose..." -ForegroundColor Cyan
            Set-Location $deployDir
            docker compose up -d
        }

        Write-Host "  [OK] Infrastructure started" -ForegroundColor Green
        Write-Host "  [INFO] Services: Nacos(8848), MySQL(3307), Redis(6379), RabbitMQ(5672/15672)" -ForegroundColor Cyan

        # Wait for services to be ready
        Write-Host "  [Wait] Waiting for services to be ready..." -ForegroundColor Yellow
        Start-Sleep -Seconds 5
    } else {
        Write-Host "  [WARN] Docker Compose not found. Please install Docker Compose or use 'docker compose' plugin." -ForegroundColor Yellow
        Write-Host "  [WARN] Skipping infrastructure startup. Please start services manually." -ForegroundColor Yellow
    }
} else {
    Write-Host "  [WARN] Docker not found, please start infrastructure services manually" -ForegroundColor Yellow
}

# 3. Build Java project
Write-Host ""
Write-Host "[3/7] Building Java project..." -ForegroundColor Yellow

Set-Location $PROJECT_ROOT
# Build omni-common first, then all modules
$compile = mvn clean install -DskipTests -q 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "  [ERROR] Maven build failed. Trying to build omni-common first..." -ForegroundColor Red
    mvn clean install -DskipTests -pl omni-common -am -q
    $compile = mvn clean install -DskipTests 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host $compile -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}
Write-Host "  [OK] Build succeeded" -ForegroundColor Green

# 4. Start Java backend services
Write-Host ""
Write-Host "[4/7] Starting Java backend services..." -ForegroundColor Yellow

$authDir = Join-Path $PROJECT_ROOT "omni-auth"
$knowledgeDir = Join-Path $PROJECT_ROOT "omni-knowledge"
$gatewayDir = Join-Path $PROJECT_ROOT "omni-gateway"

Write-Host "  [Start] omni-auth (:8081)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$authDir'; mvn spring-boot:run"

Start-Sleep -Seconds 3

Write-Host "  [Start] omni-knowledge (:8082)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$knowledgeDir'; mvn spring-boot:run"

Start-Sleep -Seconds 3

Write-Host "  [Start] omni-gateway (:8080)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$gatewayDir'; mvn spring-boot:run"

# 5. Start AI service (Python)
Write-Host ""
Write-Host "[5/7] Starting AI service (Python)..." -ForegroundColor Yellow

$aiDir = Join-Path $PROJECT_ROOT "omni-ai-service"
Write-Host "  [Start] omni-ai-service (:8003)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$aiDir'; python main.py"

# 6. Start frontend
Write-Host ""
Write-Host "[6/7] Starting frontend..." -ForegroundColor Yellow

$frontendDir = Join-Path $PROJECT_ROOT "frontend"
Write-Host "  [Start] Frontend (:3000)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$frontendDir'; npm run dev"

# 7. Done
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "   All services started!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Service URLs:" -ForegroundColor White
Write-Host "  - Frontend:        http://localhost:3000" -ForegroundColor Cyan
Write-Host "  - Gateway:         http://localhost:8080" -ForegroundColor Cyan
Write-Host "  - Auth:            http://localhost:8081" -ForegroundColor Cyan
Write-Host "  - Knowledge:       http://localhost:8082" -ForegroundColor Cyan
Write-Host "  - AI Service:      http://localhost:8003" -ForegroundColor Cyan
Write-Host "  - Nacos:           http://localhost:8848/nacos" -ForegroundColor Cyan
Write-Host "  - RabbitMQ Admin:  http://localhost:15672" -ForegroundColor Cyan
Write-Host ""
Write-Host "Check each terminal window for service status" -ForegroundColor Yellow
Write-Host ""
Write-Host "[TIP] First start may take a few minutes to download dependencies..." -ForegroundColor Yellow
Write-Host ""
