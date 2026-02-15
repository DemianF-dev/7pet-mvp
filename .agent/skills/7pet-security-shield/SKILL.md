---
name: 7pet-security-shield
description: Agente de segurança proativo que utiliza o OpenAI Codex CLI para realizar auditorias de código em tempo real, identificando vulnerabilidades, vazamentos de segredos e falhas de lógica.
---

# 7Pet Security Shield Skill

O **7Pet Security Shield** é o seu oficial de segurança digital. Ele não apenas revisa o código, mas atua como um "hacker ético" interno, tentando encontrar falhas antes que elas cheguem à produção.

## 1. Pilares de Atuação

- **Static Analysis (SAST)**: Varredura contínua de arquivos à procura de padrões inseguros (SQL Injection, XSS, etc.).
- **Secret Detection**: Impede o commit de arquivos contendo `.env` (não ignore), chaves de API, segredos do Google Maps ou Webhooks.
- **Dependency Guard**: Monitora vulnerabilidades em pacotes `npm` no `backend` e `frontend`.

## 2. Integração com Codex CLI

Esta skill utiliza comandos avançados do Codex para:

- `codex scan [file]`: Analisar um arquivo específico sob a ótica de segurança.
- `codex explain-vuln`: Explicar detalhadamente por que um trecho de código é perigoso.

## 3. Protocolo de Incidente

Se uma vulnerabilidade crítica for detectada:

1. **Bloqueio de Deploy**: O workflow `/perfect-deploy` será interrompido.
2. **Auto-Fix Sugestion**: O assistente proporá imediatamente uma correção (patch).
3. **Escalação**: O usuário será notificado com um alerta visual (Markdown Bold/Red) sobre o risco.

## 4. Auditorias Recorrentes

Sempre verifique:

- **Auth Middleware**: Proteção de rotas `/admin` e `/staff`.
- **Zod Schemas**: Validação rigorosa de inputs.
- **CORS & Headers**: Configuração do `helmet` para prevenir ataques comuns de navegador.
