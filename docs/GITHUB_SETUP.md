já fiz,# Guia Rápido - Configuração de Branch Protection

## 🔒 Protegendo a Branch `main`

Após fazer push deste código para o GitHub, configure a proteção da branch:

### Passos no GitHub

1. **Acessar configurações:**
   - No repositório: `https://github.com/DemianF-dev/7pet-mvp`
   - Ir em: **Settings** → **Branches**

2. **Adicionar regra de proteção:**
   - Clicar em: **Add rule** ou **Add branch protection rule**
   - Em "Branch name pattern": digitar `main`

3. **Configurar:**

   ✅ **Require a pull request before merging**
   - ☑️ Require approvals: `1`
   - ☑️ Dismiss stale pull request approvals when new commits are pushed

   ✅ **Require status checks to pass before merging** (opcional)
   - Pode adicionar depois se tiver testes automatizados

   ✅ **Restrict who can push to matching branches**
   - Clicar em "Restrict pushes that create matching branches"
   - Adicionar usuários permitidos:
     - `oidemianf` (você)
     - Outros admins (se houver)

   ✅ **Allow force pushes** → **Desmarcar** (para segurança)

   ✅ **Allow deletions** → **Desmarcar** (para segurança)

4. **Salvar:**
   - Clicar em **Create** no final da página

---

## ⚙️ Configurar Permissões do Workflow

1. **Acessar:**
   - Settings → Actions → General

2. **Em "Workflow permissions":**
   - Selecionar: ☑️ **Read and write permissions**
   - ☑️ **Allow GitHub Actions to create and approve pull requests**

3. **Salvar**

---

## ✅ Pronto

Agora:

- ✅ Apenas admins podem fazer merge em `main`
- ✅ Todo merge gera versão automaticamente
- ✅ Sistema totalmente seguro e controlado

### Testar

1. Criar uma branch teste:

   ```bash
   git checkout -b test/versioning
   ```

2. Fazer uma mudança pequena:

   ```bash
   echo "# Test" >> README.md
   git add README.md
   git commit -m "test: testing auto versioning"
   git push origin test/versioning
   ```

3. Criar PR no GitHub

4. Fazer merge → Versão será gerada automaticamente! 🎉
