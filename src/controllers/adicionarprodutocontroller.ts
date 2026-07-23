import { Request, Response } from "express";
import { AdicionarProdutoRepository } from "../repository/AdicioanarProdutoRepository";

export class AdicionarProdutoController {
    private adicionarProdutoRepository: AdicionarProdutoRepository;

    constructor() {
        this.adicionarProdutoRepository = new AdicionarProdutoRepository();
    }

    // Buscar por nome (ex: /adicionarproduto?nome=Teclado) ou listar se não passar nome
    public buscarOuListar = async (req: Request, res: Response): Promise<Response> => {
        try {
            const { nome } = req.query;

            if (nome && typeof nome === "string") {
                const produto = await this.adicionarProdutoRepository.buscarProdutoPorNome(nome);
                if (!produto) {
                    return res.status(404).json({ message: "Produto não encontrado" });
                }
                return res.json(produto);
            }

            // Caso queira listar todos (opcional, dependendo da sua regra de negócio)
            const produtos = await this.adicionarProdutoRepository.listarTodos();
            return res.json(produtos);

        } catch (error) {
            return res.status(500).json({ message: "Erro ao buscar produto", error });
        }
    };

    // Buscar por ID (ex: /adicionarproduto/1)
    public buscarPorId = async (req: Request, res: Response): Promise<Response> => {
        try {
            const rawId = req.params.id;
            const id = Number.parseInt(Array.isArray(rawId) ? rawId[0] : rawId, 10);

            if (isNaN(id)) {
                return res.status(400).json({ message: "ID inválido" });
            }

            const produto = await this.adicionarProdutoRepository.buscarProdutoPorId(id);
            if (!produto) {
                return res.status(404).json({ message: "Produto não encontrado" });
            }
            
            return res.json(produto);
        } catch (error) {
            return res.status(500).json({ message: "Erro ao buscar produto por ID", error });
        }
    };

    // Adicionar novo produto (POST /adicionarproduto)
    public adicionar = async (req: Request, res: Response): Promise<Response> => {
        try {
            const { nome, categoria, quantidade, estoque, dataEntrada } = req.body;

            // Validações corrigidas (verificando se algum campo obrigatório está faltando/inválido)
            if (!nome || nome.trim().length === 0) {
                return res.status(400).json({ message: "O campo 'nome' é obrigatório." });
            }
            if (!categoria || categoria.trim().length === 0) {
                return res.status(400).json({ message: "O campo 'categoria' é obrigatório." });
            }
            if (quantidade === undefined || quantidade <= 0) {
                return res.status(400).json({ message: "A 'quantidade' deve ser maior que zero." });
            }
            if (estoque === undefined) {
                return res.status(400).json({ message: "O campo 'estoque' é obrigatório." });
            }
            if (!dataEntrada || isNaN(Date.parse(dataEntrada))) {
                return res.status(400).json({ message: "A 'dataEntrada' é inválida." });
            }

            const novoProduto = await this.adicionarProdutoRepository.adicionarProduto({
                nome,
                categoria,
                quantidade,
                estoque,
                dataEntrada
            });

            return res.status(201).json(novoProduto);

        } catch (error) {
            return res.status(500).json({ message: "Erro ao adicionar produto", error });
        }
    };
}