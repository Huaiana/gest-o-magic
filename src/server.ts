import express from "express";

import { ProdutoController } from "./controllers/produtocontroller";
import { EstoqueController } from "./controllers/estoquecontroller";
import { MovimentoEstoqueController } from "./controllers/movimentoestoquecontroller";
import { RelatorioController } from "./controllers/relatoriocontroller";
import { AdicionarProdutoController } from "./controllers/adicionarprodutocontroller";

const app = express();
app.use(express.json());

// Instâncias dos controllers
const produtoController = new ProdutoController();
const estoqueController = new EstoqueController();
const movimentoEstoqueController = new MovimentoEstoqueController();
const relatorioController = new RelatorioController();
const adicionarProdutoController = new AdicionarProdutoController();

// --- DEFINIÇÃO DAS ROTAS ---

// Produtos (ex: listagem e busca por nome)
app.get("/produtos", produtoController.listarOuBuscar);

// Adicionar produto (geralmente uma rota POST)
app.post("/produtos", adicionarProdutoController.handle);

// Estoque
app.get("/estoque", estoqueController.listar);
app.get("/estoque/:id", estoqueController.buscarPorId);

// Movimentações de estoque (entradas/saídas)
app.post("/movimentos", movimentoEstoqueController.criar);

// Relatórios
app.get("/relatorios", relatorioController.gerar);

// Inicialização do servidor
app.listen(8080, () => {
    console.log("Servidor rodando na porta http://localhost:8080");
});