import globals from "globals";


export default [{
   files: [
      `**/*`
   ],

   languageOptions: {
      globals: {
         ...globals.node,
         ...globals.es2024
      }
   },

   rules: {
      // possible problems
      "for-direction": `error`,
      "getter-return": `error`,
      "no-class-assign": `error`,
      "no-compare-neg-zero": `error`,
      "no-cond-assign": `error`,
      "no-const-assign": `error`,
      "no-constant-binary-expression": `error`,
      "no-constant-condition": `error`,
      "no-constructor-return": `error`,
      "no-debugger": `error`,
      "no-dupe-args": `error`,
      "no-dupe-class-members": `error`,
      "no-dupe-else-if": `error`,
      "no-dupe-keys": `error`,
      "no-duplicate-case": `error`,
      "no-empty-character-class": `error`,
      "no-empty-pattern": `error`,
      "no-ex-assign": `warn`,
      "no-fallthrough": `warn`,
      "no-func-assign": `error`,
      "no-import-assign": `error`,
      "no-inner-declarations": `error`,
      "no-invalid-regexp": `error`,
      "no-irregular-whitespace": `error`,
      "no-loss-of-precision": `error`,
      "no-misleading-character-class": `error`,
      "no-new-native-nonconstructor": `error`,
      "no-obj-calls": `warn`,
      "no-promise-executor-return": `error`,
      "no-self-assign": `error`,
      "no-self-compare": `error`,
      "no-setter-return": `error`,
      "no-sparse-arrays": `warn`,
      "no-template-curly-in-string": `warn`,
      "no-this-before-super": `error`,
      "no-undef": `warn`,
      "no-unreachable-loop": `warn`,
      "no-unsafe-finally": `warn`,
      "no-unsafe-negation": `warn`,
      "no-unsafe-optional-chaining": `error`,
      "no-use-before-define": `warn`,
      "no-useless-assignment": `warn`,
      "no-useless-backreference": `warn`,
      "use-isnan": `warn`,
      "valid-typeof": `error`,

      // suggestions
      "camelcase": [ `warn`, { properties: `never` }],
      "eqeqeq": `warn`,
      "no-alert": `error`,
      "no-array-constructor": `warn`,
      "no-empty": [ `warn`, { allowEmptyCatch: true }],
      "no-eq-null": `error`,
      "no-extra-boolean-cast": `warn`,
      "no-invalid-this": `error`,
      "no-multi-assign": `warn`,
      "no-new-func": `warn`,
      "no-octal": `warn`,
      "no-octal-escape": `error`,
      "no-regex-spaces": `warn`,
      "no-return-assign": `error`,
      "no-underscore-dangle": `warn`,
      "no-unneeded-ternary": `warn`,
      "no-useless-concat": `warn`,
      "no-useless-constructor": `warn`,
      "no-useless-escape": `warn`,
      "no-useless-rename": `warn`,
      "no-useless-return": `warn`,
      "no-var": `error`,
      "no-with": `error`,
      "operator-assignment": `warn`,
      "prefer-arrow-callback": `warn`,
      "prefer-const": `warn`,
      "prefer-exponentiation-operator": `warn`,
      "prefer-numeric-literals": `warn`,
      "prefer-object-has-own": `warn`,
      "prefer-object-spread": `warn`,
      "prefer-regex-literals": `warn`,
      "prefer-rest-params": `warn`,
      "prefer-spread": `warn`,
      "prefer-template": `warn`,
      "require-await": `warn`,
      "require-yield": `warn`,
      "yoda": `warn`,

      // deprecated
      "array-bracket-spacing": [ `warn`, `always`, { arraysInArrays: false, objectsInArrays: false }],
      "arrow-parens": [ `warn`, `as-needed` ],
      "arrow-spacing": `warn`,
      "block-spacing": `warn`,
      "comma-dangle": `warn`,
      "comma-spacing": `warn`,
      "generator-star-spacing": `warn`,
      "keyword-spacing": `warn`,
      "no-trailing-spaces": `warn`,
      "object-curly-spacing": [ `warn`, `always` ],
      "semi": `warn`,
      "semi-spacing": `warn`,
      "space-in-parens": `warn`,
      "space-infix-ops": `warn`
   }
}];