# Fase A — Fundação multi-tenant aditiva

## Objetivo
Criar a base multi-tenant no Lovable Cloud sem remover ou renomear dados e sem alterar as telas ou o fluxo atual.

## Alterações no banco
- Criar `businesses`, `business_members` e `platform_admins` com chaves, restrição de papéis e controle de acesso habilitado, sem mudar as políticas das tabelas atuais.
- Adicionar `business_id` opcional a `settings`, `categories`, `products` e `orders`, com referências a `businesses` e índices solicitados.
- Garantir uma configuração principal por restaurante com unicidade em `settings.business_id`.
- Reutilizar o atualizador de `updated_at` existente em `businesses`.
- Criar o primeiro restaurante a partir da configuração atual, gerar slug seguro e único, vincular o único usuário como `owner` e administrador da plataforma, e associar todos os registros atuais.

## Segurança e preservação
- Executar somente operações aditivas; nenhuma tabela, coluna, usuário ou registro será removido.
- Manter `business_id` aceitando vazio para preservar o funcionamento do código atual.
- Não alterar as políticas atuais nesta fase. As novas tabelas ficarão com controle de acesso habilitado e fechadas até a fase específica de isolamento.
- A migração validará as pré-condições e interromperá integralmente se não houver exatamente uma configuração ou um usuário.

## Validação
- Comparar contagens antes e depois de configurações, categorias, produtos, pedidos e itens.
- Confirmar 1 restaurante, 1 vínculo de membro e 1 administrador da plataforma.
- Confirmar o preenchimento de `business_id` em todos os registros atuais das quatro tabelas.
- Verificar nome e slug criados, chaves, índices e restrições.
- Confirmar que o aplicativo continua compilando, sem modificar suas telas.

## Fora desta fase
Não serão criadas novas telas, cobrança, CRM/Kanban, Master UI, novos layouts, nem isolamento definitivo por restaurante. A revisão das políticas atuais ficará explicitamente para a próxima fase.
