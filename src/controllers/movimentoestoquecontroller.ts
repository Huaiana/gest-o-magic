import { app } from "../server";
import { Request, Response } from "express";
import { MovimentoEstoque } from "../repository/movimentoEstoqueRepository";
import { Produto } from "../repository/produtoRepository";

export function MovimentoEstoqueController() {
    const movimentoEstoqueRepository = new MovimentoEstoque();
    const produtoRepository = new Produto();

    // Rota GET: Listar movimentos de estoque
    app.get("/movimento-estoque", async (req: Request, res: Response) => {
        try {
            const movimentos = await movimentoEstoqueRepository.listar();
            return res.json(movimentos);
        } catch (error) {
            return res.status(500).json({ message: "Erro ao listar movimentos de estoque", error });
        }
    });

    // Rota POST: Registrar um novo movimento de estoque
    app.post("/movimento-estoque", async (req: Request, res: Response) => {
        try {
            const { produtoId, quantidade, tipo } = req.body;

            const produto = await produtoRepository.buscarPorId(produtoId);
            if (!produto) {
                return res.status(404).json({ message: "Produto não encontrado" });
            }

            const novoMovimento = await movimentoEstoqueRepository.criar({
                produto,
                quantidade,
                unidade: produto.unidade, // Adicionado para capturar a unidade do produto
                tipo,
            });

            return res.status(201).json(novoMovimento);
        } catch (error) {
            return res.status(500).json({ message: "Erro ao registrar movimento de estoque", error });
        }
    }); // <-- Chave de fechamento do POST corrigida aqui

    // Rota PUT: Atualizar um movimento de estoque existente
    app.put("/movimento-estoque/:id", async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { quantidade, tipo } = req.body;      

            const movimentoExistente = await movimentoEstoqueRepository.buscarPorId(id);
            if (!movimentoExistente) {
                return res.status(404).json({ message: "Movimento de estoque não encontrado" });
            }   

            const movimentoAtualizado = await movimentoEstoqueRepository.atualizar(id, {
                quantidade,
                tipo,
            });

            return res.json(movimentoAtualizado);
        } catch (error) {
            return res.status(500).json({ message: "Erro ao atualizar movimento de estoque", error });
        }   
    });

    // Rota DELETE: Remover um movimento de estoque (Adicionada para completar o CRUD)
    app.delete("/movimento-estoque/:id", async (req: Request, res: Response) => {
        try {
            const { id } = req.params;

            const movimentoExistente = await movimentoEstoqueRepository.buscarPorId(id);
            if (!movimentoExistente) {
                return res.status(404).json({ message: "Movimento de estoque não encontrado" });
            }

            await movimentoEstoqueRepository.remover(id);
            return res.json({ message: "Movimento de estoque removido com sucesso" });
        } catch (error) {
            return res.status(500).json({ message: "Erro ao remover movimento de estoque", error });
        }
    });
}