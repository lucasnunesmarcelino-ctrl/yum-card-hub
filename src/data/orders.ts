export type OrderStatus = "novos" | "preparo" | "entrega" | "concluido";

export type OrderItem = {
  name: string;
  quantity: number;
  notes?: string;
};

export type Order = {
  id: string;
  number: number;
  customer: string;
  createdAt: number;
  type: "entrega" | "retirada";
  payment: "Pix" | "Cartão" | "Dinheiro";
  changeFor?: number;
  address?: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
};

export const columns: { id: OrderStatus; name: string; dot: string; nextLabel?: string }[] = [
  { id: "novos", name: "Novos Pedidos", dot: "bg-yellow-500", nextLabel: "Iniciar Preparo" },
  { id: "preparo", name: "Em Preparo", dot: "bg-blue-500", nextLabel: "Enviar para Entrega" },
  { id: "entrega", name: "Saiu para Entrega", dot: "bg-purple-500", nextLabel: "Concluir Pedido" },
  { id: "concluido", name: "Concluído", dot: "bg-primary" },
];

const minutesAgo = (m: number) => Date.now() - m * 60_000;

export const mockOrders: Order[] = [
  {
    id: "o1",
    number: 101,
    customer: "Marina Alves",
    createdAt: minutesAgo(5),
    type: "entrega",
    payment: "Dinheiro",
    changeFor: 100,
    address: "Rua das Flores, 120 — Aldeota",
    items: [
      { name: "Smash Burger Clássico", quantity: 2, notes: "Sem cebola" },
      { name: "Batata Frita Rústica", quantity: 1 },
    ],
    total: 77.7,
    status: "novos",
  },
  {
    id: "o2",
    number: 102,
    customer: "Rafael Souza",
    createdAt: minutesAgo(12),
    type: "retirada",
    payment: "Pix",
    items: [
      { name: "Cheese Bacon Duplo", quantity: 1, notes: "Bacon bem crocante" },
      { name: "Refrigerante Lata", quantity: 2 },
    ],
    total: 51.5,
    status: "preparo",
  },
  {
    id: "o3",
    number: 103,
    customer: "Juliana Prado",
    createdAt: minutesAgo(24),
    type: "entrega",
    payment: "Cartão",
    address: "Av. Beira Mar, 900 — Meireles",
    items: [
      { name: "Chicken Crispy", quantity: 1 },
      { name: "Brownie com Sorvete", quantity: 1, notes: "Calda extra" },
    ],
    total: 54.0,
    status: "entrega",
  },
  {
    id: "o4",
    number: 104,
    customer: "Diego Martins",
    createdAt: minutesAgo(48),
    type: "retirada",
    payment: "Pix",
    items: [{ name: "Batata Cheddar & Bacon", quantity: 2 }],
    total: 53.8,
    status: "concluido",
  },
];

export const timeAgo = (timestamp: number) => {
  const diff = Math.max(0, Math.floor((Date.now() - timestamp) / 60_000));
  if (diff < 1) return "agora";
  if (diff < 60) return `há ${diff} min`;
  const hours = Math.floor(diff / 60);
  return `há ${hours}h`;
};
