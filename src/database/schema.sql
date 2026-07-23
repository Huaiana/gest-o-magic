  CREATE TABLE IF NOT EXISTS categoria (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,           
    unidade TEXT NOT NULL,        
    descricao TEXT NOT NULL       
  );

  CREATE TABLE IF NOT EXISTS produto (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    categoria_id INTEGER NOT NULL,
    quantidade INTEGER NOT NULL,
    unidade TEXT NOT NULL,
    tipo TEXT NOT NULL,
    estoque BOOLEAN NOT NULL DEFAULT 1,
    data_entrada TEXT NOT NULL,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE RESTRICT
  );

  CREATE TABLE IF NOT EXISTS adicionar_produto (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    categoria_id INTEGER NOT NULL,
    quantidade INTEGER NOT NULL,
    unidade TEXT NOT NULL,
    tipo TEXT NOT NULL,
    data_entrada TEXT NOT NULL,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE RESTRICT
  );

  CREATE TABLE IF NOT EXISTS estoque (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    categoria_id INTEGER NOT NULL,
    quantidade INTEGER NOT NULL,
    unidade TEXT NOT NULL,
    tipo TEXT NOT NULL,
    data_entrada TEXT NOT NULL,
    data_saida TEXT,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE RESTRICT
  );

  CREATE TABLE IF NOT EXISTS movimento (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    produto_id INTEGER NOT NULL,
    categoria_id INTEGER NOT NULL,
    tipo_movimento TEXT NOT NULL,
    quantidade INTEGER NOT NULL,
    unidade TEXT NOT NULL,
    tipo TEXT NOT NULL,
    data_movimento TEXT NOT NULL,
    FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE RESTRICT
  );

  CREATE TABLE IF NOT EXISTS relatorio (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo_relatorio TEXT NOT NULL,
    datahora TEXT NOT NULL,
    nome TEXT NOT NULL,
    categoria_id INTEGER NOT NULL,
    quantidade_estoque INTEGER NOT NULL,
    unidade TEXT NOT NULL,
    tipo TEXT NOT NULL,
    total_movimentos INTEGER NOT NULL,
    total_entrada INTEGER NOT NULL,
    total_saida INTEGER NOT NULL,
    estoque_atual INTEGER NOT NULL,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE RESTRICT
  );
`);

// ==========================================
// 1. OPERAÇÕES PARA CATEGORIAS
// ==========================================
export const inserirCategoria = (nome: string, unidade: string, descricao: string) => {
  const stmt = db.prepare(`INSERT INTO categorias (nome, unidade, descricao) VALUES (?, ?, ?)`);
  return stmt.run(nome, unidade, descricao);
};

export const buscarCategorias = () => {
  return db.prepare(`SELECT * FROM categorias`).all();
};


// ==========================================
// 2. OPERAÇÕES PARA PRODUTOS
// ==========================================
export const inserirProduto = (
  nome: string,
  categoria_id: number,
  quantidade: number,
  unidade: string,
  tipo: string,
  estoque: boolean,
  data_entrada: string
) => {
  if (!nome || quantidade < 0) {
    throw new Error("Dados inválidos");
  }

  const stmt = db.prepare(`
    INSERT INTO produtos (nome, categoria_id, quantidade, unidade, tipo, estoque, data_entrada)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  return stmt.run(nome, categoria_id, quantidade, unidade, tipo, estoque ? 1 : 0, data_entrada);
};

export const buscarProdutos = () => {
  return db.prepare(`
    SELECT 
      p.id,
      p.nome,
      p.quantidade,
      p.unidade,
      p.tipo,
      p.estoque,
      p.data_entrada,
      c.nome AS categoria_nome,
      c.descricao AS categoria_descricao
    FROM produtos p
    JOIN categorias c ON p.categoria_id = c.id
  `).all();
};

export const atualizarProduto = (id: number, quantidade: number, tipo: string) => {
  const stmt = db.prepare(`UPDATE produtos SET quantidade = ?, tipo = ? WHERE id = ?`);
  return stmt.run(quantidade, tipo, id);
};

export const removerProduto = (id: number) => {
  const stmt = db.prepare(`DELETE FROM produtos WHERE id = ?`);
  return stmt.run(id);
};


// ==========================================
// 3. OPERAÇÕES PARA MOVIMENTOS DE ESTOQUE
// ==========================================
export const inserirMovimento = (
  produto_id: number,
  categoria_id: number,
  tipo_movimento: string,
  quantidade: number,
  unidade: string,
  tipo: string,
  data_movimento: string
) => {
  const stmt = db.prepare(`
    INSERT INTO movimentos (produto_id, categoria_id, tipo_movimento, quantidade, unidade, tipo, data_movimento)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  return stmt.run(produto_id, categoria_id, tipo_movimento, quantidade, unidade, tipo, data_movimento);
};

export const buscarMovimentos = () => {
  return db.prepare(`
    SELECT 
      m.*, 
      p.nome AS produto_nome, 
      c.nome AS categoria_nome 
    FROM movimentos m
    JOIN produtos p ON m.produto_id = p.id
    JOIN categorias c ON m.categoria_id = c.id
  `).all();
};


// ==========================================
// 4. OPERAÇÕES PARA RELATÓRIOS
// ==========================================
export const inserirRelatorio = (
  tipo_relatorio: string,
  datahora: string,
  nome: string,
  categoria_id: number,
  quantidade_estoque: number,
  unidade: string,
  tipo: string,
  total_movimentos: number,
  total_entrada: number,
  total_saida: number,
  estoque_atual: number
) => {
  const stmt = db.prepare(`
    INSERT INTO relatorios (
      tipo_relatorio, datahora, nome, categoria_id, quantidade_estoque, 
      unidade, tipo, total_movimentos, total_entrada, total_saida, estoque_atual
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  return stmt.run(
    tipo_relatorio, datahora, nome, categoria_id, quantidade_estoque, 
    unidade, tipo, total_movimentos, total_entrada, total_saida, estoque_atual
  );
};

export const buscarRelatorio = () => {
  return db.prepare(`
    SELECT 
      r.*, 
      c.nome AS categoria_nome 
    FROM relatorios r
    JOIN categorias c ON r.categoria_id = c.id
  `).all(); 
};

export default db;