// src/utils/logicEvaluator.js

/**
 * Evaluate LOGIC fields safely:
 * - Replaces variable names with their numeric values (wrapped in parentheses).
 * - Preserves unary + / - signs (so `a - (-b)` -> `a - (-(5))` -> correct).
 * - Normalizes repeated signs: -- -> +, +- -> -, -+ -> -, ++ -> +
 * - Avoids NaN by falling back to 0 when necessary.
 *
 * NOTE: This implementation still uses eval() to compute numeric result.
 * If you need complete security, consider a math parser library (mathjs) or a custom parser.
 */
export function resolveLogicFields(allFields = [], inputState = {}) {
  // copy input state so we can iteratively add computed logic values
  const output = { ...inputState };

  const getValue = (acronym) => {
    const raw = output[acronym];
    const num = Number(raw);
    return isNaN(num) ? 0 : num;
  };

  // Matches identifiers (variables) only: letters/underscore followed by letters/digits/underscore
  // This will NOT match numbers (so numeric literals like -23 remain untouched).
  const identifierRegex = /([A-Za-z_][A-Za-z0-9_]*)/g;

  // helper to normalize repeated signs after replacement
  const normalizeSigns = (expr) => {
    // apply repeated replacements until stable
    // order matters: replace '--' -> '+', then '++' -> '+', then '+-' -> '-', then '-+' -> '-'
    // use a loop to avoid chained effects
    let prev;
    let cur = expr;
    do {
      prev = cur;
      cur = cur
        .replace(/--/g, '+')
        .replace(/\+\+/g, '+')
        .replace(/\+\-/g, '-')
        .replace(/-\+/g, '-');
    } while (cur !== prev);
    return cur;
  };

  let changed = true;

  // Iterate until no logic outputs change (to resolve multi-level dependency chains)
  while (changed) {
    changed = false;

    for (const field of allFields) {
      if (field.type !== 'LOGIC' || !field.logic) continue;

      try {
        // 1) Replace identifiers with their numeric values, wrapped in parentheses.
        //    Wrapping preserves unary operators that may appear immediately before the identifier.
        const replaced = field.logic.replace(identifierRegex, (match) => {
          // If match is actually a function name you want to support later (eg ROUND) you'll need special handling.
          // For now treat all identifiers as variables.
          return `(${getValue(match)})`;
        });

        // 2) Normalize repeated signs so expressions like A - -B or 11 -(-23) behave correctly
        const normalized = normalizeSigns(replaced);

        // 3) Evaluate safely
        //    We expect the normalized expression to contain only numbers, parentheses and operators
        // eslint-disable-next-line no-eval
        let evaluated = eval(normalized);

        if (typeof evaluated !== 'number' || isNaN(evaluated)) {
          evaluated = 0;
        }

        const finalValue = parseFloat(Number(evaluated).toFixed(3));

        if (output[field.acronym] !== finalValue) {
          output[field.acronym] = finalValue;
          changed = true;
        }
      } catch (err) {
        // on any error, fallback to 0 (never set string "Error" or NaN)
        if (output[field.acronym] !== 0) {
          output[field.acronym] = 0;
          changed = true;
        }
      }
    }
  }

  return output;
}
