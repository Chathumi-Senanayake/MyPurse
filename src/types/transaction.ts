
export type Transaction = {
  id: string;
  title: string;
  amount: number;
  date: string;
  type: "income" | "expense";
  category: string;
};
