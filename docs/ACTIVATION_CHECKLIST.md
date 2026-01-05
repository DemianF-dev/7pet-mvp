# ✅ Checklist - Ativação do Sistema de Versionamento Automático

## 🎯 Objetivo

Ativar a automação de versionamento que acabamos de implementar.

---

## 📋 Tarefas (Execute Nesta Ordem)

### **Etapa 1: Configurar Permissões do GitHub Actions** ⚡ CRÍTICO

> **Sem isso, o workflow NÃO vai funcionar!**

#### Passos

1. [ ] Abrir: <https://github.com/DemianF-dev/7pet-mvp/settings/actions>
2. [ ] Rolar até **"Workflow permissions"**
3. [ ] Selecionar: **"Read and write permissions"** (importante!)
4. [ ] Marcar: **"Allow GitHub Actions to create and approve pull requests"**
5. [ ] Clicar em **"Save"**

**Status:** ⏳ Aguardando configuração

---

### **Etapa 2: Verificar se o Workflow Rodou**

Após a Etapa 1, verificar se o workflow já executou:

1. [ ] Abrir: <https://github.com/DemianF-dev/7pet-mvp/actions>
2. [ ] Procurar por: **"Auto Version Bump"**
3. [ ] Ver se há uma execução recente (deve estar rodando ou completa)

**Possíveis cenários:**

- ✅ **Verde (Success)**: Funcionou! Pule para Etapa 4
- ⏱️ **Amarelo (In Progress)**: Aguarde completar
- ❌ **Vermelho (Failed)**: Vá para Etapa 3 (Troubleshooting)
- 🔍 **Não apareceu**: O workflow só roda após o próximo push

**Status:** ⏳ Aguardando verificação

---

### **Etapa 3: Troubleshooting (Se Falhou)**

Se o workflow falhou (vermelho):

1. [ ] Clicar no workflow com erro
2. [ ] Expandir o step que falhou
3. [ ] Copiar a mensagem de erro

**Erros comuns:**

| Erro | Solução |
|------|---------|
| "Permission denied" | Voltar para Etapa 1, verificar permissões |
| "Resource not accessible" | Settings → Actions → "Allow all actions" |
| "ref HEAD not found" | Normal na primeira execução, ignore |

**Status:** ⏳ Apenas se necessário

---

### **Etapa 4: Testar a Automação** 🧪

Vamos forçar uma nova execução para garantir que está funcionando:

1. [ ] No terminal local, rodar:

   ```bash
   cd c:\Users\oidem\.gemini\antigravity\scratch\7pet-mvp
   
   # Fazer uma pequena mudança
   echo "# Test versioning" >> README.md
   
   # Commitar e enviar
   git add README.md
   git commit -m "test: validating auto versioning"
   git push origin main
   ```

2. [ ] Abrir: <https://github.com/DemianF-dev/7pet-mvp/actions>
3. [ ] Aguardar ~30-60 segundos
4. [ ] Verificar se:
   - [ ] Workflow "Auto Version Bump" rodou
   - [ ] Status: ✅ Success
   - [ ] Um novo commit apareceu: `"chore: auto version bump [skip ci]"`

**Status:** ⏳ Aguardando teste

---

### **Etapa 5: Verificar VERSION.json Atualizado**

Se o teste passou:

1. [ ] No GitHub, abrir: <https://github.com/DemianF-dev/7pet-mvp/blob/main/VERSION.json>
2. [ ] Verificar se:
   - [ ] Versão tem formato: `BETA<DATA>-<HORA>`
   - [ ] Build number aumentou
   - [ ] Release notes mencionam seu commit de teste

**Exemplo do que você deve ver:**

```json
{
  "version": "BETA20260105-0056",
  "stage": "BETA",
  "timestamp": "2026-01-05T03:56:00Z",
  "commit": "a5aa87e",
  "buildNumber": 3,
  "releaseNotes": "Auto-generated from commit: test: validating auto versioning"
}
```

**Status:** ⏳ Aguardando verificação

---

### **Etapa 6: Configurar Branch Protection** 🔒 (OPCIONAL mas RECOMENDADO)

Para garantir que apenas admins mudam versões:

1. [ ] Abrir: <https://github.com/DemianF-dev/7pet-mvp/settings/branches>
2. [ ] Clicar em: **"Add rule"** ou **"Add branch protection rule"**
3. [ ] Em "Branch name pattern": digitar `main`
4. [ ] Marcar:
   - [ ] ☑️ Require a pull request before merging
   - [ ] ☑️ Require approvals: `1`
   - [ ] ☑️ Restrict who can push to matching branches
     - Adicionar: `oidemianf`
5. [ ] Clicar em: **"Create"** ou **"Save changes"**

**Status:** ⏳ Opcional (mas recomendado para produção)

---

## 🎉 Sistema Ativado com Sucesso

Quando todas as etapas acima estiverem ✅, você terá:

- ✅ Versionamento 100% automático
- ✅ Cada push = nova versão
- ✅ Histórico completo no Git
- ✅ Zero trabalho manual

---

## 🆘 Precisa de Ajuda?

Se algo der errado:

1. **Copie a mensagem de erro** do workflow
2. **Me mostre** o erro
3. **Eu ajudo** a resolver!

---

## 📊 Como Acompanhar

Depois de ativado, para cada push em `main`:

1. **GitHub Actions** roda automaticamente
2. **Version Bot** gera nova versão
3. **Commit automático** atualiza VERSION.json
4. **Deploy** (se configurado) usa a nova versão

**Versão sempre estará visível em:**

- 🌐 API: `GET /health`
- 💻 UI: Footer dos sidebars
- 📁 Arquivo: `VERSION.json`

---

**Data de criação deste checklist:** 2026-01-05 00:56
