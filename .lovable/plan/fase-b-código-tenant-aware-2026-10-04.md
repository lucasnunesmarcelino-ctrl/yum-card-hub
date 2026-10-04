# Fase B — Código tenant-aware

## Objetivo
Adaptar o cardápio, painel e criação de pedidos para sempre operar no restaurante correto, sem alterar telas, autenticação, dados existentes ou políticas RLS.

## Implementação
- Criar funções SQL mínimas e restritas para resolver:
  - o `business_id` do usuário autenticado a partir de `business_members`;
  - um restaurante ativo pelo `slug` no acesso público.
- Essas funções são necessárias porque as tabelas `businesses` e `business_members` permanecem fechadas pela Fase A. Elas não alteram nenhuma política RLS e só retornam os campos indispensáveis.
- Centralizar no servidor a resolução do restaurante autenticado e rejeitar usuários sem vínculo.
- Filtrar por esse `business_id` todas as leituras e alterações administrativas de configurações, categorias e produtos; incluir o vínculo em novos registros.
- Validar no servidor que categorias e produtos editados pertencem ao mesmo restaurante.
- Criar o cardápio público em `/cardapio/:slug`, resolvendo o restaurante deterministicamente pelo slug e carregando somente seus dados.
- Manter `/` funcionando para o restaurante atual, resolvendo explicitamente o slug legado sem usar a primeira linha de configurações.
- Passar o restaurante carregado ao checkout; buscar novamente suas configurações e criar o pedido com `business_id`.
- Validar produtos, nomes, preços e total no servidor antes de inserir pedido e itens, garantindo que todos pertencem ao mesmo restaurante.
- Preservar o redirecionamento atual ao WhatsApp após a tentativa de salvar o pedido.

## Validação
- Comparar contagens de `settings`, `categories`, `products`, `orders` e `order_items` antes e depois.
- Confirmar resolução do restaurante atual pelo usuário e pelo slug.
- Testar o cardápio em `/` e `/cardapio/nome-do-restaurante`.
- Testar login e painel atuais.
- Criar um pedido de teste pelo fluxo real, confirmar `business_id`, itens e redirecionamento `wa.me`.
- Confirmar compilação e ausência de erros no navegador.

## Fora do escopo
Nenhuma alteração de RLS, cobrança, CRM/Kanban, Master UI, novo layout, autenticação ou `NOT NULL`. Nenhuma fase posterior será iniciada.
