import { app } from "../server";
import { Request, Response } from "express";
import { Estoque } from "../repository/estoqueRepository";
import { produto } from "../repository/produtoRepository";

esport function EstoqueController() {
    const estoqueRepository = new Estoque();
    const produtoRepository = new produto();

    app.get("/estoque", async (req: Request, res: Response) => {
        res.json(estoqueRepository.listar()