import Link from 'next/link';
import { ReactNode } from 'react';

type AppIconProps = {
  name: string;
  href: string;
  icon: ReactNode;
};

const AppIcon: React.FC<AppIconProps> = ({ name, href, icon }) => {
  return (
    <Link href={href} className="flex flex-col items-center p-2">
      <div className="flex justify-center items-center w-16 h-16 bg-gray-200 rounded-lg">
        {icon}
      </div>
      <span className="mt-2 text-center text-gray-800 font-bold">{name}</span>
    </Link>
  );
};

export default AppIcon;