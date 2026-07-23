
import json
import os
from dataclasses import dataclass, asdict
from datetime import datetime


# --- ESTRUTURAS DE DADOS (DATACLASSES) ---

@dataclass
class Adicionar_Produto:
    id: int
    nome: str
    categoria: str #sobremesa, carne, pimenta, filé de mignom, etc
    quantidade: int
    unidade: str #kg, litro, unidade, etc
    data_entrada: datetime


@dataclass
class Produto:
    id: int
    nome: str
    categoria: str #sobremesa, carne, pimenta, filé de mignom, etc
    quantidade: int
    unidade: str #kg, litro, unidade, etc
    estoque: bool
    data_entrada: datetime


@dataclass
class Estoque:
    id: int
    nome: str
    categoria: str #sobremesa, carne, pimenta, filé de mignom, etc
    quantidade: int
    unidade: str #kg, litro, unidade, etc
    data_entrada: datetime
    data_saida: datetime


@dataclass
class MovimentoEstoque:
    id: int
    produto_id: int
    categoria: str  #sobremesa, carne, pimenta, filé de mignom, etc
    tipo_movimento: str  # 'entrada' ou 'saida'
    quantidade: int
    unidade: str  # kg, litro, unidade, etc
    data_movimento: datetime


@dataclass
class Relatorio:
    id: int
    tipo: str  # 'Diário', 'Semanal', 'Mensal'
    datahora: datetime
    nome: str #produto 
    categoria: str  #sobremesa, carne, pimenta, filé de mignom, etc
    quantidade_estoque: int
    unidade: str  # kg, litro, unidade, etc
    produtos: list[Produto]
    total_movimentos: int
    total_entrada: int
    total_saida: int
    estoque_atual: int


# --- MAPEAMENTO DE ARQUIVOS ---

DATA_FILE = {
    Adicionar_Produto: "adicionar_produto.json",
    Produto: "produtos.json",
    Estoque: "estoque.json",
    MovimentoEstoque: "movimentos.json",
    Relatorio: "relatorios.json"
}

# --- LISTAS GLOBAIS ---

lista_adicionar_produto: list[Adicionar_Produto] = []
lista_produtos: list[Produto] = []
lista_estoque: list[Estoque] = []
lista_movimentos: list[MovimentoEstoque] = []
lista_relatorios: list[Relatorio] = []


# --- FUNÇÕES DE PERSISTÊNCIA ---

def salvar_dados():
    """Salva os dados de todas as listas em seus respectivos arquivos JSON."""
    mapeamento_dados = {
        Adicionar_Produto: lista_adicionar_produto,
        Produto: lista_produtos,
        Estoque: lista_estoque,
        MovimentoEstoque: lista_movimentos,
        Relatorio: lista_relatorios
    }

    for classe, lista_objetos in mapeamento_dados.items():
        arquivo = DATA_FILE[classe]
        lista_dicts = []

        for item in lista_objetos:
            d = asdict(item)

            # Converte qualquer objeto datetime para string no formato ISO
            for k, v in d.items():
                if isinstance(v, datetime):
                    d[k] = v.isoformat()
                # Se for a lista de produtos dentro do Relatorio
                elif k == "produtos" and isinstance(v, list):
                    for prod in v:
                        if isinstance(prod.get("data_entrada"), datetime):
                            prod["data_entrada"] = prod["data_entrada"].isoformat()

            lista_dicts.append(d)

        with open(arquivo, "w", encoding="utf-8") as f:
            json.dump(lista_dicts, f, ensure_ascii=False, indent=4)


def carregar_dados():
    """Carrega os dados de todos os arquivos JSON para suas respectivas listas."""
    mapeamento_dados = {
        Adicionar_Produto: lista_adicionar_produto,
        Produto: lista_produtos,
        Estoque: lista_estoque,
        MovimentoEstoque: lista_movimentos,
        Relatorio: lista_relatorios
    }

    for classe, lista_objetos in mapeamento_dados.items():
        arquivo = DATA_FILE[classe]
        lista_objetos.clear()  # Limpa a lista antes de carregar para evitar duplicatas

        if os.path.exists(arquivo):
            try:
                with open(arquivo, "r", encoding="utf-8") as f:
                    dados = json.load(f)

                for d in dados:
                    # Converte strings de data de volta para datetime
                    for k, v in d.items():
                        if isinstance(v, str):
                            try:
                                d[k] = datetime.fromisoformat(v)
                            except ValueError:
                                pass

                    # Tratamento específico para a lista interna de Produtos dentro do Relatorio
                    if classe == Relatorio and "produtos" in d:
                        produtos_reconstruidos = []
                        for prod_dict in d["produtos"]:
                            if isinstance(prod_dict.get("data_entrada"), str):
                                try:
                                    prod_dict["data_entrada"] = datetime.fromisoformat(
                                        prod_dict["data_entrada"])
                                except ValueError:
                                    pass
                            produtos_reconstruidos.append(Produto(**prod_dict))
                        d["produtos"] = produtos_reconstruidos

                    obj = classe(**d)
                    lista_objetos.append(obj)

            except Exception as e:
                print(f"Erro ao carregar o arquivo {arquivo}: {e}")


def inicializar():
    """Inicializa o sistema carregando os dados existentes."""
    carregar_dados()


def salvar_e_sair():
    """Função para salvar os dados e sair do programa."""
    salvar_dados()
    print("Dados salvos com sucesso. Saindo do programa.")
    exit(0)


def main():
    """Função principal do programa."""
    inicializar()


def menu():
    """Exibe o menu principal e lida com a entrada do usuário."""
    while True:
        print("\n--- MENU PRINCIPAL ---")
        print("1. Adicionar Produto")
        print("2. Visualizar Produtos")
        print("3. Atualizar Produto")
        print("4. Remover Produto")
        print("5. Relatório de Produtos")
        print("6. Estoque")
        print("7. Sair")

        opcao = input("Escolha uma opção: ")

        if opcao == "1":
            adicionar_produto()
        elif opcao == "2":
            visualizar_produtos()
        elif opcao == "3":
            atualizar_produto()
        elif opcao == "4":
            remover_produto()
        elif opcao == "5":
            relatorio_produtos()
        elif opcao == "6":
            estoque()
        elif opcao == "7":
            salvar_e_sair()
        else:
            print("Opção inválida. Tente novamente.")


if __name__ == "__main__":
    main()
    menu()
