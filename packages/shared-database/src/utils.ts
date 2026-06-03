import {
  type Expression,
  type ExpressionBuilder,
  type ExtractTypeFromReferenceExpression,
  type Insertable,
  type RawBuilder,
  type Selectable,
  type Simplify,
  sql,
  type StringReference,
  type Updateable,
} from "kysely";
import { type Primitive } from "type-fest";

type PostgresTypes =
  | "bigint"
  | "int8"
  | "serial8"
  | "bit"
  | "varbit"
  | "boolean"
  | "box"
  | "bytea"
  | "character"
  | "char"
  | "character varying"
  | "varchar"
  | "cidr"
  | "circle"
  | "date"
  | "double precision"
  | "float8"
  | "inet"
  | "integer"
  | "int"
  | "int4"
  | "interval"
  | "json"
  | "jsonb"
  | "line"
  | "lseg"
  | "macaddr"
  | "macaddr8"
  | "money"
  | "numeric"
  | "decimal"
  | "path"
  | "pg_lsn"
  | "pg_snapshot"
  | "point"
  | "polygon"
  | "real"
  | "float4"
  | "smallint"
  | "int2"
  | "smallserial"
  | "serial2"
  | "serial"
  | "serial4"
  | "text"
  | "time"
  | "timetz"
  | "timestamp"
  | "timestamptz"
  | "tsquery"
  | "tsvector"
  | "txid_snapshot"
  | "uuid"
  | "xml";

export type InsertablePick<T, K extends keyof T> = Insertable<Pick<T, K>>;
export type UpdateablePick<T, K extends keyof T> = Updateable<Pick<T, K>>;
export type SelectablePick<T, K extends keyof T> = Selectable<Pick<T, K>>;

export function cast<O>(
  expr: Expression<O>,
  postgresType: PostgresTypes,
): RawBuilder<Simplify<O>> {
  return sql`(${expr})::${sql.raw(postgresType)}`;
}

export function jsonArrayFrom<O>(expr: Expression<O>): RawBuilder<
  Simplify<{
    [K in keyof O]: O[K] extends Date ? string : O[K];
  }>[]
> {
  return sql`(select coalesce(json_agg(agg), '[]') from ${expr} as agg)`;
}

export function jsonObjectFrom<O>(expr: Expression<O>): RawBuilder<Simplify<{
  [K in keyof O]: O[K] extends Date ? string : O[K];
}> | null> {
  return sql`(select to_json(obj) from ${expr} as obj)`;
}

export function jsonBuildObject<O extends Record<string, Expression<unknown>>>(
  obj: O,
): RawBuilder<
  Simplify<{
    [K in keyof O]: O[K] extends Expression<infer V> ? V : never;
  }>
> {
  return sql`json_build_object(${sql.join(Object.keys(obj).flatMap((k) => [sql.lit(k), obj[k]]))})`;
}

export function jsonb<T>(value: T): RawBuilder<T> {
  return cast(sql.val(JSON.stringify(value)), "jsonb") as RawBuilder<T>;
}

export function coalesceSum(
  expr: Expression<number | null>,
  defaultValue: Expression<number | null> | number,
): RawBuilder<string | number | bigint> {
  return sql<string | number | bigint>`coalesce(sum(${expr}), ${defaultValue})`;
}

export function mergeJsonb<O>(
  expr: Expression<O>,
  json: Partial<O>,
): RawBuilder<Simplify<O>> {
  return sql`COALESCE(${expr}, ${cast(sql.lit("{}"), "jsonb")}) || ${jsonb(json)}`;
}

export function jsonbArrayElements<T>(expr: Expression<T[]>): RawBuilder<T> {
  return sql<T>`jsonb_array_elements(${expr})`;
}

class JsonPathBuilder<T> {
  private constructor(private readonly rawBuilder: RawBuilder<T>) {}

  public static new<T>(
    rawBuilder: RawBuilder<T>,
  ): T extends Primitive
    ? Omit<JsonPathBuilder<T>, "object">
    : JsonPathBuilder<T> {
    return new JsonPathBuilder(rawBuilder) as T extends Primitive
      ? Omit<JsonPathBuilder<T>, "object">
      : JsonPathBuilder<T>;
  }

  public object<K extends keyof T>(key: K): JsonPathBuilder<T[K]> {
    return new JsonPathBuilder(sql`${this.rawBuilder}->${sql.lit(key)}`);
  }

  public value<K extends keyof T>(
    key: K,
  ): Omit<JsonPathBuilder<T[K]>, "object" | "value"> {
    return new JsonPathBuilder(sql`${this.rawBuilder}->>${sql.lit(key)}`);
  }

  public build(): RawBuilder<T> {
    return this.rawBuilder;
  }

  public $type<R>(): JsonPathBuilder<R> {
    return this as unknown as JsonPathBuilder<R>;
  }
}

export function jsonbPath<T>(
  objExpr: Expression<T>,
): T extends Primitive
  ? Omit<JsonPathBuilder<T>, "object">
  : JsonPathBuilder<T> {
  return JsonPathBuilder.new(sql`${objExpr}`);
}

type ElementType<DB, TB extends keyof DB, RE extends StringReference<DB, TB>> =
  ExtractTypeFromReferenceExpression<DB, TB, RE> extends Array<infer T>
    ? T
    : never;

export function arrayPushUnique<
  DB,
  TB extends keyof DB,
  RE extends StringReference<DB, TB>,
>(
  eb: ExpressionBuilder<DB, TB>,
  column: RE,
  value: ElementType<DB, TB, RE>,
): RawBuilder<ExtractTypeFromReferenceExpression<DB, TB, RE>> {
  return sql`(
    SELECT array_agg(DISTINCT x) 
    FROM unnest(array_append(${eb.ref(column)}, ${value})) AS x
  )`;
}

export function arrayRemove<
  DB,
  TB extends keyof DB,
  RE extends StringReference<DB, TB>,
>(
  eb: ExpressionBuilder<DB, TB>,
  column: RE,
  value: ElementType<DB, TB, RE>,
): RawBuilder<ExtractTypeFromReferenceExpression<DB, TB, RE>> {
  return sql`array_remove(${eb.ref(column)}, ${value})`;
}

export function arrayConcatUnique<
  DB,
  TB extends keyof DB,
  RE extends StringReference<DB, TB>,
>(
  eb: ExpressionBuilder<DB, TB>,
  column: RE,
  values: ExtractTypeFromReferenceExpression<DB, TB, RE>,
): RawBuilder<ExtractTypeFromReferenceExpression<DB, TB, RE>> {
  return sql`(
    SELECT array_agg(DISTINCT x) 
    FROM unnest(array_cat(${eb.ref(column)}, ${sql.val(values)})) AS x
  )`;
}

export function arrayRemoveMany<
  DB,
  TB extends keyof DB,
  RE extends StringReference<DB, TB>,
>(
  eb: ExpressionBuilder<DB, TB>,
  column: RE,
  values: ExtractTypeFromReferenceExpression<DB, TB, RE>,
): RawBuilder<ExtractTypeFromReferenceExpression<DB, TB, RE>> {
  return sql`(
    SELECT coalesce(array_agg(x), '[]') 
    FROM unnest(${eb.ref(column)}) AS x 
    WHERE x <> ALL(${sql.val(values)})
  )`;
}
