import express from "express";

import { ProdutoController } from "./controllers/produtocontroller";
import { EstoqueController } from "./controllers/estoquecontroller";
import { MovimentoEstoqueController } from "./controllers/movimentoestoquecontroller";
import { RelatorioController } from "./controllers/relatoriocontroller";
import { AdicionarProdutoController } from "./controllers/adicionarprodutocontroller";

const app = express();

app.use(express.json());

// Servir os arquivos do front-end (index.html, CSS, scripts JS) da pasta 'public'
app.use(express.static("public"));

// Instâncias dos controllers
const produtoController = new ProdutoController();
const estoqueController = new EstoqueController();
const movimentoEstoqueController = new MovimentoEstoqueController();
const relatorioController = new RelatorioController();
const adicionarProdutoController = new AdicionarProdutoController();

// --- DEFINIÇÃO DAS ROTAS DA API ---
app.get("/produtos", produtoController.listarOuBuscar);
app.post("/produtos", adicionarProdutoController.handle);

app.get("/estoque", estoqueController.listar);
app.get("/estoque/:id", estoqueController.buscarPorId);

app.post("/movimentos", movimentoEstoqueController.criar);

app.get("/relatorios", relatorioController.gerar);

// Inicialização do servidor
app.listen(3000, () => {
    console.log("Servidor rodando em: http://localhost:3000");
});