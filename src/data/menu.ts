import burger from "@/assets/burger.jpg";
import fries from "@/assets/fries.jpg";
import drink from "@/assets/drink.jpg";
import dessert from "@/assets/dessert.jpg";

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
};

export const categories = [
  { id: "lanches", name: "Lanches" },
  { id: "porcoes", name: "Porções" },
  { id: "bebidas", name: "Bebidas" },
  { id: "sobremesas", name: "Sobremesas" },
];

export const products: Product[] = [
  {
    id: "1",
    name: "Smash Burger Clássico",
    description:
      "Dois smash de blend bovino 90g, queijo cheddar derretido, alface, tomate e molho da casa no pão brioche.",
    price: 28.9,
    image: burger,
    category: "lanches",
  },
  {
    id: "2",
    name: "Cheese Bacon Duplo",
    description:
      "Blend 180g, cheddar duplo, bacon crocante e maionese defumada artesanal no pão australiano.",
    price: 36.5,
    image: burger,
    category: "lanches",
  },
  {
    id: "3",
    name: "Chicken Crispy",
    description:
      "Filé de frango empanado crocante, coleslaw fresco e molho honey mustard no pão de batata.",
    price: 32.0,
    image: burger,
    category: "lanches",
  },
  {
    id: "4",
    name: "Batata Frita Rústica",
    description: "Porção generosa de batatas rústicas com alecrim e sal marinho.",
    price: 19.9,
    image: fries,
    category: "porcoes",
  },
  {
    id: "5",
    name: "Batata Cheddar & Bacon",
    description: "Batatas crocantes cobertas com cheddar cremoso e cubos de bacon.",
    price: 26.9,
    image: fries,
    category: "porcoes",
  },
  {
    id: "6",
    name: "Refrigerante Lata",
    description: "Lata 350ml gelada. Escolha entre Cola, Guaraná ou Laranja.",
    price: 7.5,
    image: drink,
    category: "bebidas",
  },
  {
    id: "7",
    name: "Chá Gelado de Limão",
    description: "Chá preto gelado com limão siciliano e hortelã, 500ml.",
    price: 12.0,
    image: drink,
    category: "bebidas",
  },
  {
    id: "8",
    name: "Brownie com Sorvete",
    description: "Brownie de chocolate meio amargo servido morno com sorvete de creme.",
    price: 22.0,
    image: dessert,
    category: "sobremesas",
  },
  {
    id: "9",
    name: "Petit Gâteau",
    description: "Bolinho quente com recheio cremoso de chocolate belga e calda de frutas.",
    price: 24.5,
    image: dessert,
    category: "sobremesas",
  },
];

export const restaurant = {
  name: "Brasa & Bun",
  hours: "Ter a Dom · 18h00 às 23h30",
  open: true,
  // Número do WhatsApp do restaurante (formato internacional, só dígitos)
  whatsapp: "5585999999999",
};


export const formatBRL = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
