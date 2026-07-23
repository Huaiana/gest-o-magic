export interface produto {
    id: number;
    nome: string; //produto
    categoria: string; //sobremesa, carne, pimenta, filé de mignom, etc 
    quantidade: number;
    estoque: boolean;
    dataEntrada: Date;
}