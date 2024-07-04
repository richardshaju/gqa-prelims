import React from "react";
import { Textfit } from "react-textfit";

const CalcScreen = ({ value }:any) => {
  return (
    <Textfit className="screen text-end text-white mt-24" mode="single" max={70}>
      {value}
    </Textfit>
  );
};

export default CalcScreen;