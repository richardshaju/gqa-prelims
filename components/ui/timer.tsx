// components/Timer.tsx
import { useEffect, useState } from "react";
import { useQuestContext } from "../context/quest";
import { Disc } from "lucide-react";

const Timer: React.FC = () => {
  const [time, setTime] = useState<number>(0);
  const [startTime] = useState<number>(Date.now());

  const q = useQuestContext();

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(Date.now() - startTime);
    }, 1); // Update every millisecond

    return () => clearInterval(interval); // Cleanup interval on component unmount
  }, [startTime]);

  // Format time to display minutes, seconds, and milliseconds
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60000);
    const seconds = Math.floor((time % 60000) / 1000);
    const milliseconds = time % 1000;
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  return (
    <div className="text-white">
      {q.mission === undefined ? (
        <Clock />
      ) : (
        <div className="w-[16rem] h-10 bg-black rounded-3xl flex items-center px-2 justify-between">
          <div className="flex gap-2">
            <Disc color="red" className="animate-pulse" />
            <Timer />
          </div>
          <div className="text-white mr-4">
            <p>The QR Room</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Timer;

const Clock: React.FC = () => {
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    const timerID = setInterval(() => tick(), 1000);
    return function cleanup() {
      clearInterval(timerID);
    };
  });

  function tick() {
    setDate(new Date());
  }

  return (
    <div className="flex justify-center flex-row gap-3 items-center w-full">
      <h1 className="text-xl">
        {date
          .toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })
          .toLocaleUpperCase()}
      </h1>
    </div>
  );
};
