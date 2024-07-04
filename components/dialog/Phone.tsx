import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";

// Styles
import "../styles/qrStyles.css";

import { useQuestContext } from "../context/quest";
import { useToast } from "../ui/use-toast";
import { useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import CalcScreen from "../ui/calcScreen";
import CalcButton from "../ui/calcButton";
import { Eraser, Phone, X } from "lucide-react";

const btnValues = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["*", "0", "#"],
];

const toLocaleString = (num: any) =>
  String(num).replace(/(?<!\..*)(\d)(?=(?:\d{3})+(?:\.|$))/g, "$1 ");

const removeSpaces = (num: any) => num.toString().replace(/\s/g, "");

const math = (a: any, b: any, sign: string) =>
  sign === "+" ? a + b : sign === "-" ? a - b : sign === "X" ? a * b : a / b;

const zeroDivisionError = "Can't divide with 0";

export function PhoneDialog({ open }: { open: boolean }) {
  const q = useQuestContext();
  const { toast } = useToast();
  const s = useSearchParams();
  const { theme } = useTheme();
  const user = q?.user;

  let [calc, setCalc] = useState<{
    sign: string;
    num: number | string;
    res: number | string;
  }>({
    sign: "",
    num: 0,
    res: 0,
  });

  const numClickHandler = (e: any) => {
    e.preventDefault();
    const value = e.target.innerHTML;
    if (removeSpaces(calc.num).length < 16) {
      setCalc({
        ...calc,
        num:
          removeSpaces(calc.num) % 1 === 0 && !calc.num.toString().includes(".")
            ? toLocaleString(Number(removeSpaces(calc.num + value)))
            : toLocaleString(calc.num + value),
        res: !calc.sign ? 0 : calc.res,
      });
    }
  };

  const comaClickHandler = (e: any) => {
    e.preventDefault();
    const value = e.target.innerHTML;

    setCalc({
      ...calc,
      num: !calc.num.toString().includes(".") ? calc.num + value : calc.num,
    });
  };

  const signClickHandler = (e: any) => {
    setCalc({
      ...calc,
      sign: e.target.innerHTML,
      res: !calc.num
        ? calc.res
        : !calc.res
        ? calc.num
        : toLocaleString(
            math(
              Number(removeSpaces(calc.res)),
              Number(removeSpaces(calc.num)),
              calc.sign
            )
          ),
      num: 0,
    });
  };

  const equalsClickHandler = () => {
    if (calc.sign && calc.num) {
      setCalc({
        ...calc,
        res:
          calc.num === "0" && calc.sign === "/"
            ? zeroDivisionError
            : toLocaleString(
                math(
                  Number(removeSpaces(calc.res)),
                  Number(removeSpaces(calc.num)),
                  calc.sign
                )
              ),
        sign: "",
        num: 0,
      });
    }
  };

  const invertClickHandler = () => {
    setCalc({
      ...calc,
      num: calc.num ? toLocaleString(removeSpaces(calc.num) * -1) : 0,
      res: calc.res ? toLocaleString(removeSpaces(calc.res) * -1) : 0,
      sign: "",
    });
  };

  const percentClickHandler = () => {
    let num = calc.num ? parseFloat(removeSpaces(calc.num)) : 0;
    let res = calc.res ? parseFloat(removeSpaces(calc.res)) : 0;
    setCalc({
      ...calc,
      num: (num * 10 ** 16) / 10 ** 18,
      res: (res * 10 ** 16) / 10 ** 18,
      sign: "",
    });
  };

  const resetClickHandler = () => {
    setCalc({
      ...calc,
      sign: "",
      num: 0,
      res: 0,
    });
  };

  const buttonClickHandler = (e: any, btn: any) => {
    btn === "C" || calc.res === zeroDivisionError
      ? resetClickHandler()
      : btn === "+-"
      ? invertClickHandler()
      : btn === "%"
      ? percentClickHandler()
      : btn === "="
      ? equalsClickHandler()
      : btn === "/" || btn === "X" || btn === "-" || btn === "+"
      ? signClickHandler(e)
      : btn === "."
      ? comaClickHandler(e)
      : numClickHandler(e);
  };

  const erase =  () =>{
    setCalc({
      ...calc,
      num: removeSpaces(calc.num).slice(0, -1),
    });
  }
  return (
    open && (
      <div
        className={`transition-all h-full w-full flex bg-[#07020bba] items-center justify-center flex-col fixed z-[50] backdrop-blur-md  `}
      >
        <div className="w-full h-full p-[10px] rounded-[10px] flex flex-col justify-center">
          <div className="w-full flex">
            <input
              className="text-center w-full text-4xl mb-5 bg-transparent text-white"
              type="text"
              value={calc.num ? calc.num : calc.res}
              readOnly
            />
          </div>
          <div className="w-full h-[calc(100% - 110px)] grid grid-cols-3 grid-rows-4 gap-[10px]">
            {btnValues.flat().map((btn, i) => {
              return (
                <CalcButton
                  key={i}
                  className={
                    btn === "="
                      ? "col-span-2 bg-[#de1a1a] hover:bg-[#de1a1ae3]"
                      : "bg-white hover:bg-[#e3e3e3cf]"
                  }
                  value={btn}
                  onClick={(e: any) => buttonClickHandler(e, btn)}
                />
              );
            })}
          </div>
          <div className="p-3 text-white flex justify-between">
            <div className="invisible mt-2 flex justify-center gap-3 p-3 rounded-full">
              <Phone className="w-5" />
            </div>
            <div className="bg-green-600 mt-2 flex justify-center gap-3 p-3 rounded-full">
              <Phone className="w-5" />
            </div>
            <div className=" mt-2 flex justify-center gap-3 p-3 rounded-full">
              <Eraser className="right-0" onClick={erase} />
            </div>
          </div>
        </div>
      </div>
    )
  );
}
