import React from "react";

const CalcButton = ({ className, value, onClick }:any) => {
  return (
    <button className={`${className} border-0 rounded-full  text-[24px] text-black font-bold pointer outline-none  p-4`} onClick={onClick}>
      {value}
    </button>
  );
};

export default CalcButton;