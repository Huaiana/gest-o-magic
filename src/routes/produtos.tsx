import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/produtos")({
  component: ProductsLayout,
});

function ProductsLayout() {
  return <Outlet />;
}
