// @ts-check

import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.ts"],
    rules: {
      "no-restricted-syntax": [
        "warn",
        {
          selector:
            "CallExpression[callee.property.name='deleteFrom'][parent.parent.callee.property.name!='where']",
          message: "Always use where() after deleteFrom()",
        },
        {
          selector:
            "CallExpression[callee.property.name='updateTable'][parent.parent.parent.parent.callee.property.name!='where']",
          message:
            "Always use where() after updateTable() to avoid unscoped updates.",
        },
        {
          selector:
            "CallExpression[callee.property.name='updateTable'][parent.parent.callee.property.name!='set']",
          message: "Use updateTable().set()",
        },
        {
          selector:
            "CallExpression[callee.property.name='executeTakeFirstOrThrow']:has(CallExpression[callee.property.name='selectFrom'])[callee.object.callee.property.name!='limit'][callee.object.callee.property.name!='returning']",
          message: "You must call .limit(1) before executeTakeFirstOrThrow().",
        },
        {
          selector:
            "CallExpression[callee.property.name='executeTakeFirst']:has(CallExpression[callee.property.name='selectFrom'])[callee.object.callee.property.name!='limit'][callee.object.callee.property.name!='returning']",
          message: "You must call .limit(1) before executeTakeFirst().",
        },
        {
          selector: `CallExpression[callee.property.name=/^(sum|max|min|avg)$/]:not(:has(TSTypeParameterInstantiation))[callee.parent.parent.callee.property.name!='coalesce'][callee.object.property.name='fn']`,
          message:
            'Wrap the with a coalesce() or specify the output type. Example: "eb.fn.sum<number>" or "fn.coalesce(eb.fn.sum(...), sql<number>`0`).as(...)"',
        },
        {
          selector: `CallExpression[callee.property.name=set][callee.parent.arguments] > ArrowFunctionExpression[body] > ObjectExpression[properties.0.key.name!='updatedAt']`,
          message:
            'Use "updateTable.set({ updatedAt: new Date(), ... })" to update the updatedAt field',
        },
        {
          selector: `CallExpression[callee.property.name=set][callee.parent.arguments.0.properties][callee.parent.arguments] > ObjectExpression[properties.0.key.name!='updatedAt']`,
          message:
            'Use "updateTable.set({ updatedAt: new Date(), ... })" to update the updatedAt field',
        },
        {
          selector: `CallExpression[callee.property.name=doUpdateSet][callee.parent.arguments] > ArrowFunctionExpression[body] > ObjectExpression[properties.0.key.name!='updatedAt']`,
          message:
            'Use "doUpdateSet({ updatedAt: new Date(), ... })" to update the updatedAt field',
        },
        {
          selector: `CallExpression[callee.property.name=doUpdateSet][callee.parent.arguments.0.properties][callee.parent.arguments] > ObjectExpression[properties.0.key.name!='updatedAt']`,
          message:
            'Use "doUpdateSet({ updatedAt: new Date(), ... })" to update the updatedAt field',
        },
        {
          selector: `CallExpression[callee.property.name=where][callee.parent.arguments.0.value=/^\\w+$/] > Literal`,
          message: "Use dot notation, where('user.id', '=', userId)",
        },
        {
          selector: `CallExpression[callee.property.name=select][callee.parent.arguments.0.elements] > ArrayExpression > Literal[value!=/.+\\..+/]`,
          message:
            "Use dot notation like 'user.id' to prevent ambiguous column names",
        },
        {
          selector: `CallExpression[callee.property.name=select][callee.parent.arguments.0] > Literal[value!=/.+\\..+/]`,
          message:
            "Use dot notation like 'user.id' to prevent ambiguous column names",
        },
        {
          selector: `CallExpression[callee.property.name=select][callee.parent.arguments] > ArrowFunctionExpression > ArrayExpression > Literal[value!=/.+\\..+/]`,
          message:
            "Use dot notation like 'user.id' to prevent ambiguous column names",
        },
        {
          selector: "CallExpression[callee.property.name='countAll']",
          message: `Use count() instead.`,
        },
      ],
    },
  },
]);
