import { Request, Response } from "express";
import { ProdutoRepository } from "../repositories/produtorepository";

export class ProdutoController {
    private produtoRepository: ProdutoRepository;

    constructor() {
        this.produtoRepository = new ProdutoRepository();
    }

    // Transformado em um método da classe
    public listarOuBuscar = async (req: Request, res: Response): Promise<Response> => {
        try {
            // Acessando a propriedade correta do query params
            const { nome } = req.query;

            if (nome && typeof nome === "string") {
                // Caso seu repositório seja assíncrono, adicione 'await'
                const produto = await this.produtoRepository.buscarProdutoPorNome(nome);
                
                if (!produto) {
                    return res.status(404).json({ message: "Produto não encontrado" });
                }
                
                return res.json(produto);
            }

            const produtos = await this.produtoRepository.listar();
            return res.json(produtos);
            
        } catch (error) {
            return res.status(500).json({ message: "Erro interno do servidor", error });
        }
    };
}