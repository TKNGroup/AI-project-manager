import {
  type AnyColumn,
  type Column,
  type MapColumnName,
  type Table,
} from "drizzle-orm";
import { type ColumnType, type Simplify } from "kysely";

type ExtractColumnData<T extends AnyColumn> =
  T extends Column<infer Data> ? Data : never;

type HasDefault<T extends Table, C extends keyof T["_"]["columns"]> =
  ExtractColumnData<T["_"]["columns"][C]> extends { hasDefault: true }
    ? true
    : false;

type IsNullable<T extends Table, C extends keyof T["_"]["columns"]> =
  ExtractColumnData<T["_"]["columns"][C]> extends { notNull: true }
    ? false
    : true;

type GetBaseType<T extends Table, C extends keyof T["_"]["columns"]> =
  ExtractColumnData<T["_"]["columns"][C]> extends { data: infer Data }
    ? Data
    : never;

type KyselifyColumn<
  T extends Table,
  C extends keyof T["_"]["columns"] & string,
> = ColumnType<
  // select
  HasDefault<T, C> extends true
    ? GetBaseType<T, C>
    : IsNullable<T, C> extends true
      ? GetBaseType<T, C> | null
      : GetBaseType<T, C>,
  // insert
  HasDefault<T, C> extends true
    ? GetBaseType<T, C> | undefined
    : IsNullable<T, C> extends true
      ? GetBaseType<T, C> | undefined | null
      : GetBaseType<T, C>,
  // update
  GetBaseType<T, C> | undefined | null
>;

export type KyselifyTable<T extends Table> = Simplify<{
  [C in keyof T["_"]["columns"] & string as MapColumnName<
    C,
    T["_"]["columns"][C],
    false
  >]: KyselifyColumn<T, C>;
}>;

export type KyselifyDatabase<D extends Record<string, Table>> = Simplify<{
  [TableName in keyof D as D[TableName]["_"]["name"]]: KyselifyTable<
    D[TableName]
  >;
}>;
