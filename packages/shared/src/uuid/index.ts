import { uuidv7 } from "uuidv7";
import { z } from "zod";

export const uuidV7Schema = z.uuid().brand<"uuidv7">();

export type UUIDv7 = z.infer<typeof uuidV7Schema>;
export const UUIDv7 = {
  new: (): UUIDv7 => uuidv7() as UUIDv7,

  fromString: (value: string): UUIDv7 => {
    return uuidV7Schema.parse(value);
  },
};
