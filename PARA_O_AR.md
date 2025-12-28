
# 🚀 Guia de Colocação no Ar (Deploy) - 7Pet

Parabéns! O sistema está pronto para ser usado no "mundo real". Como você pediu algo para leigos, vamos usar a forma mais moderna e simples de todas: o **Railway.app**.

## 1. O que você vai precisar (Preparação)

1. **Conta no GitHub**: É onde seu código ficará guardado com segurança. (Crie em github.com se não tiver).
2. **Conta no Railway**: Acesse railway.app e entre com sua conta do GitHub.

## 2. Passo a Passo

### Fase A: Subir o código para o GitHub
Eu já preparei os arquivos dentro do seu computador. Agora você só precisa criar um "repositório" (uma pasta online) no seu GitHub:
1. Vá ao seu GitHub e clique em **New Repository**.
2. Dê o nome de `7pet-mvp`. Deixe como **Private** (Privado) para ninguém ver seus dados.
3. Não marque nenhuma opção de README ou licença. Clique em **Create repository**.
4. Siga as instruções que aparecerão na tela do GitHub para "push an existing repository from the command line". 
   * (Eu já fiz o `git init` e `git add` para você aqui no terminal).

### Fase B: Configurar o Servidor (Railway)
1. No Railway, clique em **+ New Project**.
2. Escolha **Deploy from GitHub repo**.
3. Selecione o seu projeto `7pet-mvp`.
4. O Railway vai detectar que tem um backend e um frontend.

### Fase C: Configurar o Banco de Dados (Os seus dados atuais)
Como você quer os dados que já estão aqui, o Railway vai usar o arquivo `dev.db` que eu incluí no projeto. 
* **Importante**: Para que os dados fiquem salvos e não sumam quando o servidor reiniciar, você precisará adicionar um "Volume" nas configurações do Railway apontando para a pasta do banco de dados.

## 3. Conectando seu Site (Domínio)
Se você já tem um site (ex: `sistema.7pet.com.br` ou `7pet.com.br`):
1. No Railway, vá na aba **Settings** do seu serviço.
2. Procure por **Domains**.
3. Clique em **Custom Domain** e digite o seu endereço.
4. Eles vão te dar um código (CNAME) para você colocar na sua hospedagem atual (onde você comprou seu domínio).

---

## 🛠️ O que eu já deixei pronto para você:
1. **Configuração de URL**: O sistema agora sabe que deve procurar o endereço da internet em vez de procurar no seu computador local.
2. **Segurança**: Já preparei o sistema para esconder senhas e chaves importantes nas configurações do servidor.
3. **Persistência**: O banco de dados SQLite está configurado para ser levado junto com o código nesta primeira subida.

**Dúvidas?** Pode me perguntar qualquer parte desse processo que eu te ajudo a executar!
