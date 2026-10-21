import { useEffect, useRef, useState } from "react";

const theme = {
  "--bg": "#EBF4DD",
  "--panel": "#FFFFFF",
  "--forest": "#5A7863",
  "--sage": "#90AB8B",
  "--ink": "#3B4953",
  "--warm": "#F6A8CB",
};

const STATS = [
  {
    number: "1 in 20",
    label: "adults, worldwide",
    body: "ADHD shows up in roughly one out of every twenty adults. It's not rare, and it's not new — it's just one of the more common ways a brain can be wired.",
  },
  {
    number: "1 in 9",
    label: "kids in the U.S., growing up with it",
    body: "Roughly one in nine U.S. children has been diagnosed with ADHD at some point, per CDC survey data. If you grew up with it, you grew up alongside a lot of other kids figuring out the exact same thing.",
  },
  {
    number: "3,000+",
    label: "years on record",
    body: "Descriptions matching ADHD traits go back to ancient medical texts. This isn't a modern invention, and it isn't a diagnosis of convenience — it's a pattern people have noticed for a very long time.",
  },
  {
    number: "60%",
    label: "carry traits into adulthood",
    body: "Most kids diagnosed with ADHD keep some of those traits as adults. Growing up doesn't mean growing out of it — it means learning which environments let your brain do its best work.",
  },
  {
    number: "0",
    label: "correlation with intelligence",
    body: "ADHD affects attention regulation, not capability. Plenty of people with ADHD are exactly as sharp, capable, and creative as anyone else — sometimes more so, once the right structure is in place.",
  },
  {
    number: "9+",
    label: "well-known scientists, athletes, and creators who've talked about ADHD",
    body: "Simone Biles, Michael Phelps, Emma Watson, and Richard Branson have all spoken openly about their ADHD. Historians have also long wondered about restless, nonlinear thinkers like Einstein and Edison — impossible to confirm after the fact, but a reminder this kind of mind has always been part of how the world moves forward.",
  },
  {
    number: "2x",
    label: "more original ideas, in some creativity studies",
    body: "Several small studies on divergent thinking have found people with ADHD generating a wider range of original ideas than average. A wandering mind isn't just a distraction — it's also how it makes unexpected connections. Your ADHD isn't a flaw to manage around. It's a different engine, and it can be your superpower.",
  },
  {
    number: "66",
    label: "days — the average time a new habit takes to stick",
    body: "A widely cited UCL study found habits take anywhere from 18 to 254 days to form, averaging around 66. Consistency compounds slowly for everyone. ADHD just means you need a system that makes showing up easier — not more willpower. Consistency is your power.",
  },

  {
    number: "1",
    label: "Are you ready?",
    body: "Because you just found YOUR superpower",
  },

];
// "1 in 20" -> prefix "1 in ", target 20, suffix ""
// "3,000+"  -> prefix "",      target 3000, suffix "+", comma true


//this is not legit, I STILL HAVE TO MAKE SURE WHATS TRUE!!!
function parseStat(raw) {
  const matches = [...raw.matchAll(/\d[\d,]*/g)];
  if (matches.length === 0) {
    return { prefix: raw, target: null, suffix: "", comma: false };
  }
  const last = matches[matches.length - 1];
  const prefix = raw.slice(0, last.index);
  const suffix = raw.slice(last.index + last[0].length);
  const comma = last[0].includes(",");
  const target = parseInt(last[0].replace(/,/g, ""), 10);
  return { prefix, target, suffix, comma };
}

function formatNumber(n, comma) {
  return comma ? n.toLocaleString("en-US") : String(n);
}

// fires once when the ref enters the viewport
function useInView(threshold = 0.35) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.unobserve(node);
        }
      },
      { threshold }
    );
    io.observe(node);
    return () => io.disconnect();
  }, [threshold]);

  return [ref, inView];
}

// counts from 0 (or 5, for a target of 0) to target once `start` is true
function AnimatedNumber({ target, comma, start, duration = 1400 }) {
  const [display, setDisplay] = useState(target === 0 ? 5 : 0);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!start) return;
    const from = target === 0 ? 5 : 0;
    const to = target;
    const startTime = performance.now();

    const tick = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const value = Math.round(from + (to - from) * eased);
      setDisplay(value);
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start, target, duration]);

  return <span>{formatNumber(display, comma)}</span>;
}

function StatSection({ stat, index }) {
  const dark = index % 2 === 1;
  const [ref, inView] = useInView(0.35);
  const { prefix, target, suffix, comma } = parseStat(stat.number);

  return (
    <section
      ref={ref}
      className={`h-[100dvh] w-full flex items-center justify-center px-5 sm:px-6 py-10 snap-start snap-always overflow-y-auto ${
        dark ? "bg-[var(--forest)]" : "bg-[var(--panel)]"
      }`}
    >
      <div
        className={`max-w-xl md:max-w-2xl text-center transition-all duration-700 ease-out motion-reduce:transition-none ${
          inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <p
          className={`font-child leading-none mb-3 sm:mb-4 tabular-nums break-words ${
            dark ? "text-[var(--warm)]" : "text-[var(--forest)]"
          }`}
          style={{ fontSize: "clamp(2.75rem, 14vw, 7rem)" }}
        >
          {prefix}
          {target === null ? (
            stat.number
          ) : (
            <AnimatedNumber target={target} comma={comma} start={inView} />
          )}
          {suffix}
        </p>
        <p
          className={`text-xs sm:text-sm uppercase tracking-[0.15em] mb-4 sm:mb-6 ${
            dark ? "text-[var(--bg)]/70" : "text-[var(--sage)]"
          }`}
        >
          {stat.label}
        </p>
        <p
          className={`text-base sm:text-lg leading-relaxed mx-auto max-w-xs sm:max-w-md ${
            dark ? "text-[var(--bg)]" : "text-[var(--ink)]"
          }`}
        >
          {stat.body}
        </p>
      </div>
    </section>
  );
}

export default function CardPageTwo() {
  return (
    <div
      style={theme}
      className="relative w-full h-[100dvh] overflow-y-scroll overflow-x-hidden snap-y snap-mandatory scroll-smooth"
    >
      {STATS.map((stat, i) => (
        <StatSection key={stat.number + i} stat={stat} index={i} />
      ))}
    </div>
  );
}