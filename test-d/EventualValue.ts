import { emptyValue, EventualValue, setValue } from "../dist/lib/EventualValue";
import { expectError, expectType } from "tsd";

function testAccessingValuePropertyNeedsCheckOfIsSet() {
  const testValue = {} as EventualValue<number>;

  if (testValue.isSet) {
    expectType<number>(testValue.value);
  } else {
    expectError(testValue.value);
  }
}

function testSetValueFnCreatesWhereValueIsSet() {
  expectType<number>(setValue(42).value);
  expectType<true>(setValue(42).isSet);
}

function testEmptyValueConstantIsNotSet() {
  expectError(emptyValue.value);
  expectType<false>(emptyValue.isSet);
}
