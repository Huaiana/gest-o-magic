import { app } from "../server";
import { Request, Response } from "express";
import { Estoque } from "../repository/estoqueRepository";
import { Produto } from "../repository/produtoRepository"; // Boa prática: nomes de classes em PascalCase

export function EstoqueController() {
    const estoqueRepository = new Estoque();
    const produtoRepository = new Produto();

    // Rota GET: Listar estoque
    app.get("/estoque", async (req: Request, res: Response) => {
        try {
            const estoque = await estoqueRepository.listar(); // Adicionado await caso seja assíncrono
            return res.json(estoque);
        } catch (error) {
            return res.status(500).json({ message: "Erro ao listar estoque", error });
        }
    });

    // Rota POST: Adicionar ao estoque
    app.post("/estoque", async (req: Request, res: Response) => {
        try {
            const { produtoId, quantidade } = req.body;
            
            const produto = await produtoRepository.buscarPorId(produtoId);
            if (!produto) {
                return res.status(404).json({ message: "Produto não encontrado" });
            }

            const estoque = await estoqueRepository.adicionar(produto, quantidade);
            return res.json(estoque);
        } catch (error) {
            return res.status(500).json({ message: "Erro ao adicionar estoque", error });

           const quantidade = req.body.quantidade;  
           const unidade = req.body.unidade; // Adicionado essa linha para capturar a unidade do estoque    
           
        }
    });

    // Rota PUT: Atualizar estoque
    app.put("/estoque/:produtoId", async (req: Request, res: Response) => {
        try {
            const { produtoId } = req.params;
            const { quantidade } = req.body;

            const produto = await produtoRepository.buscarPorId(produtoId);
            if (!produto) {
                return res.status(404).json({ message: "Produto não encontrado" });
            }

            const estoqueAtualizado = await estoqueRepository.atualizar(produto, quantidade);
            return res.json(estoqueAtualizado);
        } catch (error) {
            return res.status(500).json({ message: "Erro ao atualizar estoque", error });
        }
    });

    // Rota DELETE: Remover do estoque
    app.delete("/estoque/:produtoId", async (req: Request, res: Response) => {
        try {
            const { produtoId } = req.params;

            const produto = await produtoRepository.buscarPorId(produtoId);
            if (!produto) {
                return res.status(404).json({ message: "Produto não encontrado" });
            }

            await estoqueRepository.remover(produto);
            return res.json({ message: "Produto removido do estoque" });
        } catch (error) {
            return res.status(500).json({ message: "Erro ao remover produto do estoque", error });
        }
    });
}