import os
import sqlite3


def migrar_dados():
    db_path = "estoque.db"
    migrations_dir = os.path.join("supabase", "migrations")

    if not os.path.exists(db_path):
        print(
            f"Erro: O arquivo {db_path} não foi encontrado no diretório atual.")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    if not os.path.exists(migrations_dir):
        print("Pasta supabase/migrations não encontrada.")
        return

    arquivos_sql = sorted([f for f in os.listdir(
        migrations_dir) if f.endswith(".sql")])

    if not arquivos_sql:
        print("Nenhum arquivo .sql encontrado em supabase/migrations.")
        return

    print(f"Encontrados {len(arquivos_sql)} arquivos de migração.")

    inserts_executados = 0
    for sql_file in arquivos_sql:
        file_path = os.path.join(migrations_dir, sql_file)
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()

        statements = content.split(";")
        for stmt in statements:
            stmt_clean = stmt.strip()
            if stmt_clean.upper().startswith("INSERT INTO"):
                try:
                    cursor.execute(stmt_clean)
                    inserts_executados += 1
                except Exception as e:
                    print(f"Aviso ao executar SQL de {sql_file}: {e}")

    conn.commit()
    conn.close()
    print(
        f"Migração concluída! Total de comandos de inserção processados: {inserts_executados}")


if __name__ == "__main__":
    migrar_dados()
