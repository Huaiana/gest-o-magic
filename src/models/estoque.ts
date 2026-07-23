export interface Estoque {
  id: number;
  produtoId: number;
  nome: string; //produto 
  categoria: string; //sobremesa, carne, pimenta, filé de mignom, etc
  quantidade: number;
  unidade: string; //kg, litro, unidade, etc
  dataEntrada: Date;
  dataSaida: Date | null;
}
