import { createFileRoute, Link } from "@tanstack/react-router";
import { BarChart3, Boxes, FileText, AlertTriangle, ArrowRight, CheckCircle } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EstoqueSync - Gestão de Estoque Inteligente" },
      { name: "description", content: "Controle produtos, acompanhe movimentações e gere relatórios em uma plataforma simples, rápida e eficiente." },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="flex flex-col gap-16 py-8">
      {/* Hero Section */}
      <section className="text-center max-w-3xl mx-auto">
        <Link to="/login" className="inline-block mb-10 group">
          <img
            src="/logoESync.png"
            alt="EstoqueSync Logo"
            style={{ animation: "float 3s ease-in-out infinite" }}
            className="w-40 h-40 mx-auto rounded-2xl shadow-2xl shadow-primary/20 cursor-pointer transition-transform duration-300 group-hover:scale-105"
          />
        </Link>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground tracking-tight mb-6">
          Estoque<span className="text-primary">Sync</span>
        </h1>
        <p className="text-lg sm:text-xl text-muted-foreground mb-8 leading-relaxed">
          Toque no ícone para acessar o sistema.
        </p>
      </section>

      {/* Features Grid */}
      <section id="recursos" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 scroll-mt-24">
        <FeatureCard
          icon={<BarChart3 className="w-7 h-7 text-primary" />}
          title="Dashboard Intuitivo"
          description="Acompanhe estatísticas em tempo real com gráficos e indicadores de estoque."
        />
        <FeatureCard
          icon={<Boxes className="w-7 h-7 text-status-success" />}
          title="Cadastro de Produtos"
          description="Adicione, edite e organize produtos com filtros e busca inteligente."
        />
        <FeatureCard
          icon={<FileText className="w-7 h-7 text-status-warning" />}
          title="Relatórios Detalhados"
          description="Gere relatórios de movimentação e exporte ou imprima com facilidade."
        />
        <FeatureCard
          icon={<AlertTriangle className="w-7 h-7 text-status-danger" />}
          title="Alertas de Estoque"
          description="Receba notificações visuais de itens com estoque baixo ou esgotado."
        />
      </section>

      {/* Benefits */}
      <section className="bg-card rounded-2xl border border-border p-8 sm:p-12">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Por que escolher o EstoqueSync?
            </h2>
            <p className="text-muted-foreground mb-6">
              Uma solução leve, sem complicação, ideal para pequenos negócios e
              operações que precisam de controle sem burocracia.
            </p>
            <ul className="space-y-3">
              <BenefitItem text="Controle total de produtos e unidades" />
              <BenefitItem text="Histórico de entradas e saídas" />
              <BenefitItem text="Alertas visuais de estoque crítico" />
              <BenefitItem text="Relatórios prontos para impressão" />
            </ul>
          </div>
          <div className="bg-secondary/30 rounded-xl border border-border p-6">
            <div className="space-y-4">
              <div className="h-2 bg-primary/20 rounded-full overflow-hidden">
                <div className="h-full bg-primary w-3/4 rounded-full"></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-card p-4 rounded-lg border border-border">
                  <div className="text-2xl font-bold text-foreground">+120</div>
                  <div className="text-sm text-muted-foreground">Produtos gerenciados</div>
                </div>
                <div className="bg-card p-4 rounded-lg border border-border">
                  <div className="text-2xl font-bold text-foreground">98%</div>
                  <div className="text-sm text-muted-foreground">Estoque atualizado</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-6 hover:border-primary/30 transition group">
      <div className="mb-4 bg-secondary/40 w-14 h-14 rounded-lg flex items-center justify-center group-hover:bg-primary/10 transition">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

function BenefitItem({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-3 text-sm text-foreground">
      <CheckCircle className="w-5 h-5 text-status-success flex-shrink-0" />
      {text}
    </li>
  );
}
