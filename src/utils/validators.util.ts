import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

/**
 * Validates that a value is a valid UUID
 */
@ValidatorConstraint({ name: 'isUUID', async: false })
export class IsUUIDConstraint implements ValidatorConstraintInterface {
  validate(value: any): boolean {
    if (typeof value !== 'string') {
      return false;
    }
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }

  defaultMessage(args: ValidationArguments): string {
    return `${args.property} must be a valid UUID`;
  }
}

export function IsUUID(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsUUIDConstraint,
    });
  };
}

/**
 * Validates that a decimal number has at most 2 decimal places
 */
@ValidatorConstraint({ name: 'isDecimal', async: false })
export class IsDecimalConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments): boolean {
    if (typeof value !== 'number') {
      return false;
    }
    const decimalPlaces = (value.toString().split('.')[1] || '').length;
    return decimalPlaces <= 2;
  }

  defaultMessage(args: ValidationArguments): string {
    return `${args.property} must have at most 2 decimal places`;
  }
}

export function IsDecimal(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsDecimalConstraint,
    });
  };
}

/**
 * Validates that a number is within a specified range
 */
@ValidatorConstraint({ name: 'isInRange', async: false })
export class IsInRangeConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments): boolean {
    if (typeof value !== 'number') {
      return false;
    }
    const [min, max] = args.constraints;
    return value >= min && value <= max;
  }

  defaultMessage(args: ValidationArguments): string {
    const [min, max] = args.constraints;
    return `${args.property} must be between ${min} and ${max}`;
  }
}

export function IsInRange(
  min: number,
  max: number,
  validationOptions?: ValidationOptions,
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [min, max],
      validator: IsInRangeConstraint,
    });
  };
}

/**
 * Validates currency code
 */
@ValidatorConstraint({ name: 'isCurrency', async: false })
export class IsCurrencyConstraint implements ValidatorConstraintInterface {
  validate(value: any): boolean {
    if (typeof value !== 'string') {
      return false;
    }
    const validCurrencies = ['USD', 'EUR', 'GBP', 'NGN', 'CAD', 'AUD'];
    return validCurrencies.includes(value.toUpperCase());
  }

  defaultMessage(args: ValidationArguments): string {
    return `${args.property} must be a valid currency code (USD, EUR, NGN, JPY, CAD, AUD)`;
  }
}

export function IsCurrency(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsCurrencyConstraint,
    });
  };
}


@ValidatorConstraint({ name: 'isValidAmount', async: false })
export class IsValidAmountConstraint implements ValidatorConstraintInterface {
  validate(value: any): boolean {
    if (typeof value !== 'number') {
      return false;
    }
    const maxAmount = 999999999.99;
    return value > 0 && value <= maxAmount;
  }

  defaultMessage(args: ValidationArguments): string {
    return `${args.property} must be a positive number and not exceed 999,999,999.99`;
  }
}

export function IsValidAmount(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidAmountConstraint,
    });
  };
}

