import type { UnionToIntersection } from "type-fest";

type UnionToOvlds<U> = UnionToIntersection<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  U extends any ? (f: U) => void : never
>;

type PopUnion<U> = UnionToOvlds<U> extends (a: infer A) => void ? A : never;

type IsUnion<T> = [T] extends [UnionToIntersection<T>] ? false : true;

type UnionToArray<T, A extends unknown[] = []> =
  IsUnion<T> extends true
    ? UnionToArray<Exclude<T, PopUnion<T>>, [PopUnion<T>, ...A]>
    : [T, ...A];

export type EnumValues<T extends string> = `${T}`;

export function enumValues<T extends Record<string, string>>(
  obj: T,
): UnionToArray<EnumValues<T[keyof T]>> {
  return Object.values(obj) as UnionToArray<EnumValues<T[keyof T]>>;
}
