# Fase C — Segurança, RLS e isolamento multi-tenant

## Escopo

Aplicar somente o isolamento no banco e os ajustes mínimos nos acessos existentes. Não alterar layout, autenticação, cobrança, CRM/Kanban, Master Admin, criação de restaurantes ou `business_id` nullable.

## Implementação

1. Registrar as contagens atuais de `settings`, `categories`, `products`, `orders` e `order_items`.
2. Criar funções auxiliares seguras, com `SECURITY DEFINER`, `search_path` fixo e execução revogada de `PUBLIC`/`anon`:
   - verificar se o usuário autenticado é `platform_admin`;
   - verificar se o usuário autenticado pertence ao `business_id` informado, incluindo acesso controlado de plataforma.
3. Substituir as políticas amplas e as políticas provisórias da Fase A:
   - `businesses`: membros veem o próprio restaurante; platform admins têm acesso administrativo controlado;
   - `business_members`: usuário vê o próprio vínculo; platform admins administram vínculos;
   - `platform_admins`: usuário reconhece o próprio vínculo; platform admins administram a lista;
   - `settings` e `categories`: leitura pública preservada; escrita autenticada limitada ao próprio business ou platform admin;
   - `products`: leitura pública somente dos disponíveis; administração limitada ao próprio business ou platform admin;
   - `orders`: nenhuma leitura pública; acesso autenticado apenas ao business do usuário ou platform admin;
   - `order_items`: nenhuma leitura pública; acesso autenticado derivado do business do pedido ou platform admin.
4. Revogar de `anon` os privilégios de leitura e criação em `orders` e `order_items`. O checkout continuará usando a função server-side já validada, que resolve o restaurante pelo slug, valida produtos/preços e grava com acesso interno.
5. Restringir uploads no bucket `branding` ao prefixo do `business_id` pertencente ao usuário autenticado; manter somente a leitura pública controlada pelo endpoint atual.
6. Trocar as operações administrativas comuns de `settings`, `categories` e `products` para o cliente autenticado, fazendo o banco aplicar RLS além dos filtros já existentes. A resolução do tenant continuará vindo da associação autenticada no servidor, nunca do cliente.

## Validação

- Comparar contagens antes/depois e confirmar zero exclusões.
- Confirmar RLS habilitado e revisar a matriz final de policies e grants.
- Confirmar que `anon` não lê nem cria diretamente `orders`/`order_items`.
- Testar `/` e `/cardapio/nome-do-restaurante`.
- Criar um pedido pelo fluxo público e confirmar `business_id`, itens e redirecionamento `wa.me`.
- Testar login e painel do restaurante atual.
- Testar isolamento com uma transação temporária mínima, revertida integralmente, sem criar um segundo restaurante persistente.
- Confirmar acesso de `platform_admin`.
- Rodar linter de segurança, compilação e verificar erros de runtime.
- Informar policies/funções, arquivos, contagens, limitações e custo registrado; encerrar sem iniciar outra fase.
