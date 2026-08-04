Recriar o repositório https://github.com/Huaiana/gest-o (EstoqueSync) como aplicação web funcional no Lovable, usando o TanStack Start já configurado no projeto.

O que vamos construir

- Landing page com hero, recursos e navegação.
- Login simulado (admin/admin) que redireciona para o dashboard.
- Dashboard com KPIs, gráfico de movimentação e lista de produtos com estoque baixo.
- Cadastro de produtos: listar, adicionar, editar, excluir e filtrar por categoria/nome.
- Movimentações de estoque: registrar entradas e saídas, atualizando a quantidade do produto automaticamente.
- Relatórios: filtrar por data/categoria e gerar visual para impressão A4.
- Tema dark seguindo a paleta original do HTML (#0F172A, #1E293B, #2563EB, #F8FAFC, #94A3B8).

Stack e abordagem

- Frontend: React + TanStack Router + TanStack Query + Tailwind CSS v4 + shadcn/ui já presentes.
- Backend: Lovable Cloud (Supabase) para banco de dados PostgreSQL, com server functions do TanStack Start para CRUD, movimentações e relatórios.
- Banco de dados: tabelas `products`, `movements` e `reports` mapeando o schema do SQLite original.
- Autenticação: por simplicidade, login simulado via client-side state (como no original), sem obrigar autenticação real em todas as rotas. Se quiser, posso adicionar autenticação real depois.

Estrutura de rotas

```text
src/routes/
  __root.tsx          -> layout global com navbar, footer e tema dark
  index.tsx           -> landing page
  login.tsx           -> tela de login
  dashboard.tsx       -> dashboard
  produtos.tsx       -> cadastro de produtos
  produtos.novo.tsx  -> formulário de novo produto
  produtos.$id.tsx   -> edição de produto
  relatorios.tsx     -> relatórios e impressão
```

Server functions (em src/lib/stock/)

```text
getProducts, addProduct, updateProduct, deleteProduct
getMovements, addMovement
getReports, generateReport
getDashboardStats
```

Schema do banco (migração Supabase)

```text
products:
  id uuid primary key
  nome text not null
  categoria text not null
  quantidade integer default 0
  unidade text not null
  estoque boolean default false
  data_entrada timestamptz

movements:
  id uuid primary key
  product_id uuid -> products(id)
  categoria text
  tipo text (entrada/saida)
  quantidade integer
  unidade text
  data_movimento timestamptz

reports:
  id uuid primary key
  tipo text
  datahora timestamptz
  total_movimentos integer
  total_entrada integer
  total_saida integer
  estoque_atual integer
```

Próximos passos

1. Habilitar Lovable Cloud no projeto.
2. Criar a migração de banco de dados.
3. Implementar as server functions.
4. Criar as rotas e componentes de UI.
5. Ajustar o tema dark e estilos para refletir o original.
6. Verificar build e preview.
