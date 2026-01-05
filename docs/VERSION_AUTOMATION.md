# Documentação - Automação de Versionamento

## 🤖 Automação com GitHub Actions

### Como Funciona

O sistema agora **gera versões automaticamente** sempre que há um push para a branch `main`.

#### Workflow Implementado

- **Arquivo:** `.github/workflows/version-bump.yml`
- **Trigger:** Push para `main`
- **Ação:**
  1. Checkout do repositório
  2. Execução do script `generate-version.js`
  3. Commit automático do `VERSION.json` atualizado
  4. Push de volta para `main`

---

### 🔒 Segurança e Controle de Acesso

#### Quem Pode Gerar Versões Oficiais?

**Diretamente:**

- ✅ **Master Admin** (configurado no GitHub)
- ✅ **<oidemianf@gmail.com>** (proprietário do repositório)

**Indiretamente (via aprovação de PR):**

- ✅ Qualquer desenvolvedor pode criar um PR
- ✅ Mas **apenas admins podem fazer merge**
- ✅ Ao fazer merge → versão é gerada automaticamente

#### Recomendações de Configuração no GitHub

1. **Proteção de Branch:**
   - Ir em: `Settings → Branches → Add rule`
   - Branch name pattern: `main`
   - Configurar:
     - ☑️ Require a pull request before merging
     - ☑️ Require approvals (1)
     - ☑️ Dismiss stale pull request approvals when new commits are pushed
     - ☑️ Restrict who can push to matching branches
       - Adicionar: `oidemianf@gmail.com` e usuários admin

2. **Permissões do Workflow:**
   - O workflow já usa `GITHUB_TOKEN` (automático)
   - Tem permissões para commit e push
   - Não precisa de configuração extra

---

### 📝 Fluxo de Trabalho

#### Para Desenvolvedores

1. **Criar branch de feature:**

   ```bash
   git checkout -b feature/nova-funcionalidade
   ```

2. **Desenvolver e commitar:**

   ```bash
   git add .
   git commit -m "feat: adiciona nova funcionalidade"
   git push origin feature/nova-funcionalidade
   ```

3. **Criar Pull Request:**
   - No GitHub, criar PR de `feature/nova-funcionalidade` → `main`
   - Aguardar aprovação de admin

4. **Após aprovação:**
   - Admin faz merge
   - **GitHub Action roda automaticamente**
   - Versão é gerada e commitada
   - Deploy automático (se configurado)

#### Para Admins

1. **Revisar PR:**
   - Verificar código
   - Testar funcionalidades
   - Aprovar ou solicitar mudanças

2. **Fazer Merge:**
   - Clicar em "Merge pull request"
   - **Versão é gerada automaticamente** 🎉
   - Conferir que o workflow rodou com sucesso

3. **Criar Release (Opcional):**
   - Se quiser criar uma tag de release
   - Adicionar `[release]` na mensagem do commit:

     ```
     git commit -m "feat: major update [release]"
     ```

   - O workflow criará automaticamente uma tag Git

---

### 🛠️ Uso Local (Desenvolvimento)

O script continua disponível para **testes locais**:

```bash
# Gerar versão de desenvolvimento (não commitada)
node scripts/generate-version.js BETA "Teste local"

# Isso apenas atualiza VERSION.json localmente
# NÃO faça commit manual deste arquivo!
```

**Importante:**

- ⚠️ `VERSION.json` gerado localmente **não deve** ser commitado manualmente
- ⚠️ Apenas a GitHub Action commita versões oficiais
- ✅ Use script local apenas para testes de integração

---

### 🎯 Recursos Avançados

#### Criar Release com Tag

Para criar uma release oficial com tag Git:

1. Na mensagem do commit (ao fazer merge), adicione `[release]`:

   ```
   Merge pull request #123 from feature/xyz [release]
   ```

2. A GitHub Action automaticamente:
   - Gera a versão
   - Cria uma tag Git (ex: `v BETA20260105-0052`)
   - Faz push da tag

3. No GitHub:
   - Ir em "Releases"
   - A tag estará disponível
   - Você pode adicionar release notes

#### Pular CI (Skip CI)

Se por algum motivo você precisar fazer um commit sem gerar versão:

```bash
git commit -m "docs: atualiza README [skip ci]"
```

O workflow não rodará para commits com `[skip ci]`.

---

### 🔍 Monitoramento

#### Ver Execuções do Workflow

1. Ir em **Actions** no GitHub
2. Clicar em "Auto Version Bump"
3. Ver histórico de execuções
4. Logs completos de cada geração de versão

#### Verificar Versão Atual

**Via API:**

```bash
curl https://7pet-mvp-api.vercel.app/health
```

**Via Arquivo:**

```bash
cat VERSION.json
```

**Na UI:**

- Olhar no footer dos sidebars (cliente e staff)

---

### ❌ Troubleshooting

#### Workflow não está rodando?

1. **Verificar permissões:**
   - Settings → Actions → General
   - Workflow permissions: "Read and write permissions"

2. **Verificar branch protection:**
   - O bot precisa ter permissão para push em `main`

3. **Verificar logs:**
   - Actions → Última execução → Ver logs

#### Versão não foi commitada?

- Verificar se há mudanças no `VERSION.json`
- Verificar se o workflow completou com sucesso
- Ver logs step "Commit Version Changes"

#### Loop infinito de commits?

- Não deve acontecer graças ao `[skip ci]`
- Se acontecer, adicione condição extra no workflow

---

### ✅ Conclusão

Com este sistema:

- ✅ **Zero trabalho manual** para versionamento
- ✅ **Controle total** via branch protection
- ✅ **Rastreabilidade** completa no Git
- ✅ **Automação** end-to-end
- ✅ **Segurança** com permissões adequadas

O versionamento agora é **100% automático e seguro**! 🎉
