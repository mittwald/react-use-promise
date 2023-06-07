interface SetValue<T> {
  readonly value: T;
  readonly isSet: true;
}

interface EmptyValue {
  readonly isSet: false;
}

export type EventualValue<T> = SetValue<T> | EmptyValue;

export const setValue = <T>(value: T): SetValue<T> =>
  Object.freeze({
    isSet: true,
    value,
  });

export const emptyValue: EmptyValue = Object.freeze({
  isSet: false,
});
