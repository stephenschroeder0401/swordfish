import React, { useEffect, useState } from "react";
import { Input } from "@chakra-ui/react";

const PhoneNumberInput = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) => {
  const [internalValue, setInternalValue] = useState(value);

  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  const formatPhoneNumber = (
    input: string,
    previousValue: string,
    actionType: string,
  ) => {
    const numbers = input.replace(/[^\d]/g, "");
    const slices = [
      numbers.slice(0, 3) ? "(" + numbers.slice(0, 3) : "",
      numbers.slice(3, 6) ? ") " + numbers.slice(3, 6) : "",
      numbers.slice(6, 10) ? "-" + numbers.slice(6, 10) : "",
    ];

    const formattedNumber = slices.filter(Boolean).join("");

    if (
      actionType === "deleteContentBackward" &&
      previousValue.endsWith(") ") &&
      formattedNumber.endsWith("(")
    ) {
      return formattedNumber.slice(0, -1);
    }

    if (
      actionType === "deleteContentBackward" &&
      previousValue.endsWith("-") &&
      formattedNumber.endsWith(") ")
    ) {
      return formattedNumber.slice(0, -2);
    }

    return formattedNumber;
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputActionType = (event.nativeEvent as InputEvent).inputType;
    const formattedInput = formatPhoneNumber(
      event.target.value,
      internalValue,
      inputActionType,
    );

    setInternalValue(formattedInput);
    if (onChange) {
      const syntheticEvent = {
        ...event,
        target: { ...event.target, value: formattedInput },
      };
      onChange(syntheticEvent as React.ChangeEvent<HTMLInputElement>);
    }
  };

  return (
    <Input
      alignSelf="center"
      width={"50%"}
      value={internalValue}
      onChange={handleChange}
      placeholder="Enter phone number"
    />
  );
};

export default PhoneNumberInput;
