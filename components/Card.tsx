import Image from "next/image";
import React from "react";

export default function Card() {
  return (
    <div className="flex hover:bg-gray-900 active:bg-gray-800 transition-all duration-200 cursor-pointer items-center rounded-xl">
      <div className="flex flex-col px-2">
        <Image
          width={40}
          height={40}
          className="rounded-full"
          src="/favicon.ico"
          alt=""
        />
      </div>

      <div className="flex flex-col px-5 py-2">
        <span>AKM Zakaria</span>
        <p>This is a demo message...</p>
      </div>
    </div>
  );
}
