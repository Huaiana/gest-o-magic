import Database from "better-sqlite3";
import path from "path";

const dbPath = path.resolve(__dirname, "../../banco.db");
const db = new Database(dbPath);

db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS categorias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,           
    unidade TEXT NOT NULL,        
    descricao TEXT NOT NULL       
  );

  CREATE TABLE IF NOT EXISTS produtos (
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

  CREATE TABLE IF NOT EXISTS movimentos (
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

  CREATE TABLE IF NOT EXISTS relatorios (
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

// Função para inserir produto ajustada ao schema real
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

// Função para buscar produtos com o JOIN correto na tabela categorias
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

// Função para buscar relatórios apontando para a tabela correta 'relatorios'
export const buscarRelatorio = () => {
  return db.prepare(`SELECT * FROM relatorios`).all(); 
};

export default db;