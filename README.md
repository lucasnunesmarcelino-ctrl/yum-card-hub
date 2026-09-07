# Digital Menu Delight

Prompt 1: Estrutura Base e Interface do Cliente (Copiar e colar no Lovable)

Crie a página pública do Cardápio Digital (/) com foco total em Mobile-First e UX fluida:

1. Header & Identidade:

Cabeçalho do restaurante com banner, logo circular, nome do estabelecimento, horário de funcionamento e um badge de status ("Aberto Agora" verde ou "Fechado" vermelho).

Campo de busca por nome do produto.

2. Categorias & Listagem de Produtos:

Barra horizontal de navegação rápida por categorias (ex: Lanches, Bebidas, Sobremesas) que fixa no topo ao rolar a página.

Grid de produtos exibindo: Foto do produto, Título, Descrição curta (máximo 2 linhas), Preço formatado (R$) e um botão estilo + ou "Adicionar".

3. Carrinho & Modal de Produto:

Ao clicar no produto, abrir um Modal (Shadcn UI) com foto ampla, descrição completa, campo para observações do item e seletor de quantidade (- 1 +).

Barra de carrinho flutuante na parte inferior (Bottom Sheet) que aparece assim que o primeiro item é adicionado, mostrando a quantidade de itens e o valor Total.

4. Design:

Use Tailwind CSS com visual moderno e limpo. Cores principais: Verde (#16a34a) para ações/botões e Cinza Escuro (#0f172a) para textos. Use dados mockados (fictícios) no momento para testar a interface sem precisar do banco ainda.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://yum-card-hub.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/1c61260e-2daa-4700-b3ca-128030191551).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
