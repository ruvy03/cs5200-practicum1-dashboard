// Shapes of the data the /api/stats route sends to the page

export type Summary = {
  visits: number;
  food: number;
  alcohol: number;
  tips: number;
  customers: number;
  alcoholVisits: number;
  avgBill: number;
  avgParty: number | null;
  avgWait: number | null;
};

export type MonthRow = { month: string; visits: number; food: number; alcohol: number };

export type YearRow = { year: number; visits: number; revenue: number };

export type RestaurantRow = {
  id: number;
  name: string;
  city: string;
  state: string;
  tableService: number;
  visits: number;
  food: number;
  alcohol: number;
  tips: number;
  customers: number;
};

export type LabelRow = { label: string; visits: number; revenue: number };

export type Option = { id: number; name: string };

export type Stats = {
  summary: Summary;
  monthly: MonthRow[];
  yearly: YearRow[];
  restaurants: RestaurantRow[];
  mealTypes: LabelRow[];
  paymentMethods: LabelRow[];
  options: { restaurants: Option[]; years: number[] };
  generatedAt: string;
};
