export function switchSafe(value: never): never {
  throw new Error(`Unexpected value ${value}`);
}
