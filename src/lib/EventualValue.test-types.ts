import { expectType } from "tsd";
import { emptyValue, EventualValue, setValue } from "./EventualValue.js";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function testAccessingValuePropertyNeedsCheckOfIsSet() {
  const testValue = {} as EventualValue<number>;

  if (testValue.isSet) {
    expectType<number>(testValue.value);
  } else {
    // @ts-expect-error Value should not be set
    console.log(testValue.value);
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function testSetValueFnCreatesWhereValueIsSet() {
  expectType<number>(setValue(42).value);
  expectType<true>(setValue(42).isSet);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function testEmptyValueConstantIsNotSet() {
  // @ts-expect-error Value should not be set
  console.log(emptyValue.value);
  expectType<false>(emptyValue.isSet);
}
