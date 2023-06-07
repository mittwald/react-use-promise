import { emptyValue, EventualValue, setValue } from "../dist/lib/EventualValue";
import { expectAssignable, expectError } from "tsd";

function testAccessingValuePropertyNeedsCheckOfIsSet() {
  const testValue = {} as EventualValue<number>;

  if (testValue.isSet) {
    expectAssignable<number>(testValue.value);
  } else {
    expectError(testValue.value);
  }
}

function testSetValueFnCreatesWhereValueIsSet() {
  expectAssignable<number>(setValue(42).value);
  expectAssignable<true>(setValue(42).isSet);
}

function testEmptyValueConstantIsNotSet() {
  expectError(emptyValue.value);
  expectAssignable<false>(emptyValue.isSet);
}
