
import { Link } from "react-router-dom";

import { useFolderShuffle, textfolder } from "../cardthatremindsyou";

export function Home() {
  const { currentText, shuffle } = useFolderShuffle(textfolder[0].text);

  return (
    <div className="relative overflow-hidden">
      <section
        className="relative flex min-h-[calc(100dvh-8rem)] items-center justify-center bg-cover bg-center px-6 py-16 text-center"
        style={{
          backgroundImage: `
            linear-gradient(
              rgba(255, 250, 243, 0.2),
              rgba(255, 250, 243, 0.2)
            ),
            url("/hero.png")
           
          `,
        }}
      >
        <div className="relative z-10 mx-auto max-w-2xl">
          <button
            type="button"
            onClick={shuffle}
            className="font-child min-h-[10rem] text-xl leading-tight text-[#4A2F20] sm:text-6xl"
          >
            {currentText}
          </button>

          <p className="mt-3 text-xs uppercase tracking-widest text-[#7a6a5a]">
          
          </p>

          <Link
            to="/signup"
            className="mt-10 inline-block -rotate-1 rounded-full border-[3px] border-black bg-[#6A795D] px-8 py-3 text-sm font-semibold uppercase tracking-widest text-black shadow-[4px_4px_0_#000] transition-all hover:rotate-1 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#000] active:translate-x-1 active:translate-y-1 active:shadow-none"
          >
            Get started
          </Link>
        </div>
      </section>

      {/* <CardPageTwo /> */}
    </div>
  );
}
