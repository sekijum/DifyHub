import { SquareClient, SquareEnvironment } from "square";

/**
 * Square APIクライアントインスタンス
 * 直接このオブジェクトにアクセスしてSquare APIを呼び出せます
 */
const SQUARE_ACCESS_TOKEN = process.env.SQUARE_ACCESS_TOKEN;
const environment =
  process.env.NODE_ENV === "development"
    ? SquareEnvironment.Sandbox
    : SquareEnvironment.Production;

const square = new SquareClient({
  token: SQUARE_ACCESS_TOKEN,
  environment,
});

export { square };
