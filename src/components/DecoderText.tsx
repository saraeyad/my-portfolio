import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

// Random chars during decode — swap to ARABIC_CHARS for عربي مزخرف
const ENGLISH_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const ARABIC_CHARS = "ءآأؤإئابةتثجحخدذرزسشصضطظعغفقكلمنهوي";
const CHARACTERS = false ? ARABIC_CHARS : ENGLISH_CHARS; // set true for Arabic

function randomChar() {
  return CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
}

interface DecoderTextProps {
  text: string;
  className?: string;
  delay?: number;
  decay?: number;
}

export function DecoderText({
  text,
  className = "",
  delay = 0,
  decay = 0.8,
}: DecoderTextProps) {
  const [displayText, setDisplayText] = useState(text);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const startTime = Date.now();

    const decode = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed < delay) {
        timeout = setTimeout(decode, 50);
        return;
      }

      setDisplayText((prev) => {
        let complete = true;
        const next = text
          .split("")
          .map((char, i) => {
            if (prev[i] === char) return char;
            complete = false;
            if (Math.random() < decay) return char;
            return randomChar();
          })
          .join("");

        if (complete) return text;
        return next;
      });

      timeout = setTimeout(decode, 30);
    };

    decode();
    return () => clearTimeout(timeout);
  }, [text, delay, decay]);

  return (
    <span className={className} aria-label={text}>
      <AnimatePresence mode="wait">
        <motion.span
          key={displayText}
          initial={{ opacity: 0.8 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.05 }}
        >
          {displayText}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
