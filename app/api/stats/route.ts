// GET /api/stats?restaurant=<id>&year=<yyyy>
// Runs every aggregate in SQL against the live database and returns JSON.

import type { NextRequest } from "next/server";
import { describeDbError, query } from "@/lib/db";
import type {
  LabelRow,
  MonthRow,
  Option,
  RestaurantRow,
  Stats,
  Summary,
  YearRow,
} from "@/lib/types";

export async function GET(request: NextRequest) {
  const restaurant = Number(request.nextUrl.searchParams.get("restaurant"));
  const year = Number(request.nextUrl.searchParams.get("year"));

  // build the WHERE clause from the filters; values are passed as ? parameters
  const conditions: string[] = [];
  const values: number[] = [];
  if (Number.isInteger(restaurant) && restaurant > 0) {
    conditions.push("v.restaurant_id = ?");
    values.push(restaurant);
  }
  if (Number.isInteger(year) && year > 0) {
    conditions.push("YEAR(v.visit_date) = ?");
    values.push(year);
  }
  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  try {
    const [summary, monthly, yearly, restaurants, mealTypes, paymentMethods, restaurantOptions, years] =
      await Promise.all([
        query<Summary>(
          `SELECT COUNT(*) AS visits,
                  COALESCE(SUM(v.food_bill), 0) AS food,
                  COALESCE(SUM(v.alcohol_bill), 0) AS alcohol,
                  COALESCE(SUM(v.tip_amount), 0) AS tips,
                  COUNT(DISTINCT v.customer_id) AS customers,
                  COALESCE(SUM(v.alcohol_bill > 0), 0) AS alcoholVisits,
                  COALESCE(AVG(v.food_bill + v.alcohol_bill), 0) AS avgBill,
                  AVG(v.party_size) AS avgParty,
                  AVG(v.wait_time) AS avgWait
           FROM visits v ${where}`,
          values,
        ),
        query<MonthRow>(
          `SELECT DATE_FORMAT(v.visit_date, '%Y-%m') AS month,
                  COUNT(*) AS visits,
                  SUM(v.food_bill) AS food,
                  SUM(v.alcohol_bill) AS alcohol
           FROM visits v ${where}
           GROUP BY month
           ORDER BY month`,
          values,
        ),
        query<YearRow>(
          `SELECT YEAR(v.visit_date) AS year,
                  COUNT(*) AS visits,
                  SUM(v.food_bill + v.alcohol_bill) AS revenue
           FROM visits v ${where}
           GROUP BY year
           ORDER BY year`,
          values,
        ),
        query<RestaurantRow>(
          `SELECT r.restaurant_id AS id,
                  r.restaurant_name AS name,
                  r.city,
                  r.state,
                  r.has_table_service AS tableService,
                  COUNT(*) AS visits,
                  SUM(v.food_bill) AS food,
                  SUM(v.alcohol_bill) AS alcohol,
                  SUM(v.tip_amount) AS tips,
                  COUNT(DISTINCT v.customer_id) AS customers
           FROM visits v
           JOIN restaurants r ON r.restaurant_id = v.restaurant_id
           ${where}
           GROUP BY r.restaurant_id
           ORDER BY visits DESC`,
          values,
        ),
        query<LabelRow>(
          `SELECT m.meal_type AS label,
                  COUNT(*) AS visits,
                  SUM(v.food_bill + v.alcohol_bill) AS revenue
           FROM visits v
           JOIN meal_types m ON m.meal_type_id = v.meal_type_id
           ${where}
           GROUP BY m.meal_type
           ORDER BY visits DESC`,
          values,
        ),
        query<LabelRow>(
          `SELECT p.payment_method AS label,
                  COUNT(*) AS visits,
                  SUM(v.food_bill + v.alcohol_bill) AS revenue
           FROM visits v
           JOIN payment_methods p ON p.payment_method_id = v.payment_method_id
           ${where}
           GROUP BY p.payment_method
           ORDER BY visits DESC`,
          values,
        ),
        query<Option>(
          `SELECT restaurant_id AS id, restaurant_name AS name
           FROM restaurants
           ORDER BY restaurant_name`,
        ),
        query<{ year: number }>(
          `SELECT DISTINCT YEAR(visit_date) AS year FROM visits ORDER BY year`,
        ),
      ]);

    const stats: Stats = {
      summary: summary[0],
      monthly,
      yearly,
      restaurants,
      mealTypes,
      paymentMethods,
      options: { restaurants: restaurantOptions, years: years.map((row) => row.year) },
      generatedAt: new Date().toISOString(),
    };
    return Response.json(stats);
  } catch (error) {
    const problem = describeDbError(error);
    console.error(`Database error (${problem.code}):`, error);
    return Response.json({ error: problem.message, code: problem.code }, { status: 503 });
  }
}
