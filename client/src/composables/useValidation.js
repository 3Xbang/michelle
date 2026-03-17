import { reactive } from 'vue';

export function useValidation(rules) {
  const errors = reactive({});

  // Initialize error keys
  for (const key of Object.keys(rules)) {
    errors[key] = '';
  }

  function validateField(field, value) {
    const fieldRules = rules[field];
    if (!fieldRules) return true;

    for (const rule of fieldRules) {
      const msg = rule(value);
      if (msg) {
        errors[field] = msg;
        return false;
      }
    }
    errors[field] = '';
    return true;
  }

  function validateAll(formData) {
    let valid = true;
    for (const field of Object.keys(rules)) {
      if (!validateField(field, formData[field])) {
        valid = false;
      }
    }
    return valid;
  }

  function clearErrors() {
    for (const key of Object.keys(errors)) {
      errors[key] = '';
    }
  }

  return { errors, validateField, validateAll, clearErrors };
}

// Common validation rule factories
export function required(message) {
  return (v) => {
    if (v === null || v === undefined || String(v).trim() === '') return message;
    return '';
  };
}

export function nonNegative(message) {
  return (v) => {
    if (v !== '' && v !== null && v !== undefined && Number(v) < 0) return message;
    return '';
  };
}

export function dateAfter(getCompareDate, message) {
  return (v) => {
    const compare = getCompareDate();
    if (v && compare && v <= compare) return message;
    return '';
  };
}
