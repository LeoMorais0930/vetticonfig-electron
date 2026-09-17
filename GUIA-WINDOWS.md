# Guia de instalação no Windows — VettiConfig

Este guia é para quem **nunca usou Node.js, Git ou linha de comando**. Você vai instalar três programas no seu computador (todos gratuitos), baixar o código do VettiConfig do GitHub e rodá-lo.

No final, você terá:

- O **VettiConfig** rodando no seu Windows (para testar).
- Um **simulador de central de alarme** rodando em paralelo (para testar sem precisar de um alarme físico).
- (Opcional) Um instalador `.exe` para distribuir aos clientes.

Tempo total: cerca de **30 a 45 minutos** (a maior parte é download).

---

## Sumário

1. [Antes de começar — o que você vai instalar](#antes-de-começar)
2. [Passo 1 — Instalar o Node.js](#passo-1--instalar-o-nodejs)
3. [Passo 2 — Instalar o Git](#passo-2--instalar-o-git)
4. [Passo 3 — Abrir o PowerShell](#passo-3--abrir-o-powershell)
5. [Passo 4 — Baixar o código do VettiConfig](#passo-4--baixar-o-código-do-vetticonfig)
6. [Passo 5 — Instalar as dependências do projeto](#passo-5--instalar-as-dependências-do-projeto)
7. [Passo 6 — Rodar o VettiConfig](#passo-6--rodar-o-vetticonfig)
8. [Passo 7 — Rodar o simulador de central em paralelo](#passo-7--rodar-o-simulador-de-central-em-paralelo)
9. [Passo 8 — Conectar o VettiConfig no simulador](#passo-8--conectar-o-vetticonfig-no-simulador)
10. [Passo 9 (opcional) — Gerar o instalador `.exe`](#passo-9-opcional--gerar-o-instalador-exe)
11. [Como atualizar o código mais tarde](#como-atualizar-o-código-mais-tarde)
12. [Problemas comuns](#problemas-comuns)

---

## Antes de começar

Você precisa instalar pelo menos **um programa** no Windows (o Node.js).

| Programa | Para que serve | Obrigatório? | Site oficial |
|---|---|---|---|
| **Node.js** | É o "motor" que roda o app. | ✅ Sim | https://nodejs.org |
| **Git** | Serve para baixar o código do GitHub. | ❌ Só se for usar GitHub | https://git-scm.com |
| **PowerShell** | É o "terminal" do Windows (já vem instalado). | ✅ Já instalado | — |

Existem **duas formas** de receber o código do VettiConfig:

- **Opção A — ZIP via Telegram** (mais simples): o desenvolvedor te manda um arquivo `.zip` pelo Telegram. Você não precisa do Git.
- **Opção B — GitHub** (somente se você tem acesso ao repositório privado): você baixa direto do GitHub. Precisa do Git.

Combine antes com o desenvolvedor qual das duas você vai usar e siga apenas o passo correspondente.

> 💡 Você **não precisa** ser programador. Só vamos copiar e colar alguns comandos.

---

## Passo 1 — Instalar o Node.js

1. Abra o navegador e vá em **https://nodejs.org**.
2. Clique no botão grande que diz **"LTS"** (Long Term Support). Vai baixar um arquivo `.msi`.
3. Quando terminar o download, **dê dois cliques** no arquivo baixado.
4. Vai abrir o instalador. Clique em **"Next"** em todas as telas (deixe tudo no padrão).
5. Em uma das telas, vai aparecer **"Tools for Native Modules"** — deixe essa caixa **marcada** (vai instalar coisas extras necessárias).
6. Clique em **"Install"** no final. Pode pedir a senha de administrador do Windows.
7. Quando terminar, clique em **"Finish"**.

> ⚠️ Se aparecer uma janela preta extra ("PowerShell instalando ferramentas adicionais"), **deixe ela terminar sozinha** — pode levar 5 a 10 minutos. Não feche.

### Como saber se deu certo

- Aperte a tecla **Windows** do teclado, digite `PowerShell` e abra.
- Digite o comando abaixo e aperte **Enter**:

  ```
  node --version
  ```

- Se aparecer algo como `v20.10.0` (ou similar), **está instalado!**
- Se aparecer "comando não reconhecido", reinicie o computador e tente de novo.

---

## Passo 2 — Instalar o Git

> ⚠️ **Só faça este passo se você vai usar a Opção B (GitHub).**
> Se você vai receber o **ZIP via Telegram (Opção A)**, **pule** para o [Passo 3](#passo-3--abrir-o-powershell).

1. Vá em **https://git-scm.com/download/win**.
2. O download começa automaticamente. Quando terminar, **dê dois cliques** no arquivo.
3. Vai abrir um instalador com **muitas telas**. **Em todas elas, clique em "Next"** — não precisa mudar nada.
4. Na última, clique em **"Install"**. Pode pedir senha de administrador.
5. No final, clique em **"Finish"** (pode deixar marcada a opção de abrir o "Git Bash" se quiser).

### Como saber se deu certo

- Volte ao **PowerShell** (Windows → digitar `PowerShell` → abrir).
- Digite:

  ```
  git --version
  ```

- Se aparecer algo como `git version 2.43.0`, **está instalado!**

---

## Passo 3 — Abrir o PowerShell

Daqui pra frente você vai usar o **PowerShell** o tempo todo. Para abrir:

1. Aperte a tecla **Windows** do teclado.
2. Digite `PowerShell`.
3. Clique em **"Windows PowerShell"** (ou simplesmente **"PowerShell"**).

Vai abrir uma janela escura ou azul com um cursor piscando, parecida com isto:

```
PS C:\Users\seu-usuario>
```

É aqui que você vai **copiar e colar** os comandos dos próximos passos.

> 💡 **Como colar no PowerShell**: clique com o **botão direito** dentro da janela. Ele cola automaticamente o que está na área de transferência. Depois aperte **Enter** para executar.

---

## Passo 4 — Baixar o código do VettiConfig

Aqui você escolhe **uma das duas opções**:

- **Opção A**: receber o ZIP via Telegram (mais simples — não precisa de Git).
- **Opção B**: baixar do GitHub (somente se você tem acesso ao repositório privado).

---

### Opção A — Você recebeu o ZIP pelo Telegram

1. Abra o **Telegram** e baixe o arquivo `.zip` que o desenvolvedor te enviou. Geralmente o nome é algo como `vetticonfig-main.zip` ou `vetticonfig.zip`.
2. Abra o **Explorador de Arquivos** do Windows.
3. Vá até a pasta **Downloads**.
4. Localize o `.zip` que você acabou de baixar. **Clique com o botão direito** sobre ele → **"Extrair tudo..."**.
5. Vai aparecer uma janelinha perguntando onde extrair. Apague o conteúdo do campo e digite:

   ```
   C:\Users\SEU-USUARIO\
   ```

   > Substitua `SEU-USUARIO` pelo nome da sua conta do Windows. Para descobrir: aperte **Windows + R**, digite `cmd`, aperte Enter e veja o que está depois de `C:\Users\`.

6. Clique em **"Extrair"** e espere terminar.
7. Abra o **Explorador de Arquivos** e vá até `C:\Users\SEU-USUARIO\`. Deve ter aparecido uma pasta nova. Pode ter um nome esquisito como `vetticonfig-main` ou `vetticonfig-master`.
8. **Renomeie** essa pasta para apenas **`vetticonfig`** (clique com botão direito → Renomear).

   Resultado esperado: você tem agora `C:\Users\SEU-USUARIO\vetticonfig\` (e dentro dela um arquivo chamado `package.json`, entre outros).

9. Volte ao **PowerShell** e cole:

   ```
   cd $env:USERPROFILE\vetticonfig
   ```

   Para confirmar que está na pasta certa, digite `pwd` e aperte Enter. Deve aparecer `C:\Users\seu-nome\vetticonfig`. Vá para o [Passo 5](#passo-5--instalar-as-dependências-do-projeto).

---

### Opção B — Você vai usar Git (GitHub)

1. No PowerShell, **cole** os comandos abaixo, **um de cada vez**, apertando **Enter** depois de cada um:

   ```
   cd $env:USERPROFILE
   ```

   Esse comando te leva para a sua pasta de usuário (algo como `C:\Users\seu-nome`).

2. Agora cole:

   ```
   git clone https://github.com/fcsegalla/vetticonfig.git
   ```

   O Git vai baixar o código. Vai pedir suas credenciais do GitHub na primeira vez. Vai aparecer várias linhas — espere terminar.

3. Entre na pasta que foi criada:

   ```
   cd vetticonfig
   ```

---

A partir daqui (qualquer opção), **todos os comandos** deste guia precisam ser rodados dentro dessa pasta `vetticonfig`.

> 💡 Para confirmar que está na pasta certa, digite `pwd` e aperte Enter. Deve aparecer `C:\Users\seu-nome\vetticonfig`.

---

## Passo 5 — Instalar as dependências do projeto

O VettiConfig usa várias bibliotecas. Vamos instalar todas com um único comando.

No PowerShell (já dentro da pasta `vetticonfig`), cole:

```
npm install
```

⏳ **Este passo demora!** Pode levar de 3 a 10 minutos dependendo da sua internet. Ele vai baixar uns 200 MB de arquivos.

- Você vai ver várias linhas passando.
- Pode aparecer alguns avisos amarelos ("warnings") — **ignore**, não são erros.
- Se aparecer **vermelho**, leia a seção [Problemas comuns](#problemas-comuns).

Quando terminar, o cursor volta a ficar disponível (`PS C:\Users\...\vetticonfig>`).

---

## Passo 6 — Rodar o VettiConfig

Agora a parte boa! Cole no PowerShell:

```
npm start
```

Em alguns segundos vai abrir uma **janela** com o VettiConfig (logo "VETTI" pulsando no centro).

- **Para fechar o app**: feche a janela normalmente, OU volte ao PowerShell e aperte **Ctrl + C**.

> 💡 Enquanto o app estiver aberto, o PowerShell fica **travado** mostrando os logs do app. Isso é normal. Para usar o PowerShell para outras coisas (como rodar o simulador), abra **uma segunda janela** do PowerShell.

---

## Passo 7 — Rodar o simulador de central em paralelo

O simulador é um programa que se passa por uma central de alarme real, escutando na rede. O VettiConfig vai achá-lo automaticamente.

### 7.1 Abrir uma segunda janela do PowerShell

1. **Não feche** a primeira janela (onde o VettiConfig está rodando).
2. Aperte **Windows** + digite `PowerShell` + abra. (Vai abrir uma nova janela.)
3. Cole, **um por vez**:

   ```
   cd $env:USERPROFILE\vetticonfig
   ```

   ```
   node sim/server.js
   ```

4. Vai aparecer algo como:

   ```
   [Simulador VettiConfig] escutando UDP 0.0.0.0:5000
   [Simulador VettiConfig] MAC AA-BB-CC-DD-EE-01  Nome "Sim Demo"  Senha 1234
   ```

   O simulador agora está rodando e respondendo na sua rede local.

### 7.2 Liberar o firewall do Windows (se pedir)

- Na primeira vez, o Windows vai abrir um aviso azul perguntando se quer liberar o **Node.js** na rede.
- **Marque** "Redes privadas" e clique em **"Permitir acesso"**.
- Se você clicar "Cancelar" sem querer: vai em **Painel de Controle → Sistema e Segurança → Firewall do Windows Defender → Permitir um app ou recurso pelo Firewall** → procure "Node.js" e marque "Redes privadas".

---

## Passo 8 — Conectar o VettiConfig no simulador

Volte à janela do **VettiConfig** (a primeira janela do PowerShell ainda está com ele rodando).

1. Na tela inicial, clique em **"Nova Conexão"**.
2. Vai abrir um modal com duas abas: **"Conexão Local"** e **"Conexão Remota"**.
3. Deixe na **Conexão Local** (já é o padrão).
4. Em poucos segundos, deve aparecer na lista uma central chamada **"Sim Demo"**. Se não aparecer, clique em **"Procurar novamente"**.
5. **Clique** na linha "Sim Demo" para selecioná-la (fica destacada em azul).
6. No campo **Senha**, digite `1234`.
7. Clique em **"Conectar"**.

✅ Se tudo deu certo, você é redirecionado para a tela **Status** mostrando as 6 partições, dispositivos, e um logger embaixo com a comunicação entre o app e o simulador.

---

## Passo 9 (opcional) — Gerar o instalador `.exe`

Quando quiser gerar um arquivo `.exe` para instalar o VettiConfig em outros computadores Windows:

1. No PowerShell, **dentro da pasta `vetticonfig`**, cole:

   ```
   npm run dist:win
   ```

2. Vai demorar alguns minutos. Vai baixar o Electron para Windows e gerar o instalador.
3. Quando terminar, o instalador estará em:

   ```
   C:\Users\seu-nome\vetticonfig\dist\VettiConfig Setup 0.1.0.exe
   ```

Você pode copiar esse arquivo para qualquer outro Windows e dar dois cliques para instalar.

> ⚠️ Como o instalador não está **assinado digitalmente**, na primeira vez que rodar em outro PC vai aparecer um aviso **"O Windows protegeu seu PC"**. Para liberar:
> 1. Clique em **"Mais informações"** no aviso.
> 2. Aparece um botão **"Executar assim mesmo"** — clique nele.
>
> Esse aviso some quando comprarmos um certificado de assinatura de código (em planejamento).

---

## Como atualizar o código mais tarde

Quando o desenvolvedor avisar que tem código novo, use **uma das duas formas** abaixo:

### Forma A — Recebeu um ZIP novo pelo Telegram

1. **Feche o VettiConfig e o simulador** se estiverem abertos (Ctrl + C no PowerShell, ou feche as janelas).
2. Abra o **Explorador de Arquivos** e vá até `C:\Users\SEU-USUARIO\`.
3. Localize a pasta `vetticonfig` antiga. **Renomeie** para `vetticonfig-OLD` (botão direito → Renomear). Vamos guardar como backup por segurança.
4. Baixe o novo `.zip` do Telegram → **Extrair tudo...** → extraia em `C:\Users\SEU-USUARIO\` exatamente como você fez no [Passo 4 - Opção A](#opção-a--você-recebeu-o-zip-pelo-telegram).
5. Renomeie a pasta nova para `vetticonfig` (sem o `-main`/`-master`).
6. Volte ao **PowerShell** e cole:

   ```
   cd $env:USERPROFILE\vetticonfig
   ```

   ```
   npm install
   ```

   ⏳ Demora alguns minutos. (Sempre rode `npm install` ao receber um ZIP novo — pode haver dependências novas.)

7. Confirme que o app abre com `npm start`.
8. **Se tudo funcionou**, você pode deletar a pasta `vetticonfig-OLD` para liberar espaço.

### Forma B — Você usa Git

1. Abra o **PowerShell**.
2. Cole:

   ```
   cd $env:USERPROFILE\vetticonfig
   ```

   ```
   git pull
   ```

3. Se o `git pull` mostrar que arquivos do `package.json` ou `package-lock.json` mudaram, rode novamente:

   ```
   npm install
   ```

4. Depois é só rodar `npm start` normalmente.

---

## Problemas comuns

### "node não é reconhecido como comando interno..."

- Significa que o Node.js não está instalado ou o Windows não achou.
- **Solução**: reinicie o computador (o Windows precisa "ver" o Node novo). Se persistir, desinstale e reinstale o Node.js do passo 1.

### "git não é reconhecido como comando interno..."

- Mesma coisa do anterior, mas com Git.
- **Solução**: reinicie e tente de novo.

### `npm install` mostra erros vermelhos

- Anote os erros e mande print pro desenvolvedor.
- Tente rodar de novo: às vezes é só falha temporária da internet.
- Verifique se você está realmente dentro da pasta `vetticonfig` (use `pwd` para confirmar).

### O app abre mas a tela fica em branco

- Pode ser um problema da placa de vídeo. Tente rodar com:

  ```
  npm run dev
  ```

  Esse comando abre o DevTools (ferramentas de desenvolvedor) junto. Tire um print da aba **Console** e mande pro desenvolvedor.

### O simulador não aparece na lista de centrais

- Verifique se o simulador está rodando na segunda janela do PowerShell (sem erros).
- Verifique se o **firewall** liberou o Node.js (volte ao passo 7.2).
- Verifique se os dois (VettiConfig e simulador) estão rodando **na mesma máquina** — se forem em PCs diferentes, ambos precisam estar na mesma rede Wi-Fi/Ethernet, e o firewall do PC do simulador precisa liberar a porta UDP 5000.

### "Acesso negado" ao rodar `npm install`

- Feche o PowerShell.
- Aperte Windows → digite `PowerShell` → clique com **botão direito** → **"Executar como administrador"**.
- Tente o `npm install` novamente.

### Como parar tudo rapidamente

- Em cada janela do PowerShell onde houver algo rodando (`npm start`, `node sim/server.js`), aperte **Ctrl + C**.
- Se travar, feche a janela na bolinha de fechar do canto.

---

## Resumindo (cola)

Tudo que você precisa, em ordem:

```powershell
# ─── Só na primeira vez ──────────────────────────────────────
# Se recebeu o ZIP via Telegram: extraia em C:\Users\SEU-USUARIO\
#   e renomeie a pasta para "vetticonfig", depois:
cd $env:USERPROFILE\vetticonfig
npm install

# OU, se usa GitHub:
cd $env:USERPROFILE
git clone https://github.com/fcsegalla/vetticonfig.git
cd vetticonfig
npm install

# ─── Rodar o app ─────────────────────────────────────────────
npm start

# Em OUTRA janela, rodar o simulador:
cd $env:USERPROFILE\vetticonfig
node sim/server.js

# ─── Atualizar quando tiver código novo ──────────────────────
# Recebeu ZIP novo: renomeie a pasta antiga para vetticonfig-OLD,
# extraia o ZIP novo no lugar e rode:
cd $env:USERPROFILE\vetticonfig
npm install

# OU, com Git:
cd $env:USERPROFILE\vetticonfig
git pull
npm install        # se package.json mudou

# ─── Gerar instalador .exe (só quando precisar) ──────────────
cd $env:USERPROFILE\vetticonfig
npm run dist:win
```

---

Qualquer dúvida ou erro, mande print pro desenvolvedor com:
- O comando que você rodou.
- A mensagem de erro **completa** (não só a primeira linha).
- A versão do Windows (Win 10 ou Win 11).
