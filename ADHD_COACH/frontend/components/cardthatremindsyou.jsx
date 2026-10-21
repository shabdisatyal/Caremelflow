import { useState, useCallback } from 'react';

export function useFolderShuffle(text, startIndex = 0) {
  const [currentIndex, setCurrentIndex] = useState(startIndex);

  const shuffle = useCallback(() => {
    if (text.length <= 1) return; // nothing to shuffle to

    let nextIndex;
    do {
      nextIndex = Math.floor(Math.random() * text.length);
    } while (nextIndex === currentIndex); // avoid immediate repeat

    setCurrentIndex(nextIndex);
  }, [text.length, currentIndex]);

  return {
    currentText: text[currentIndex],
    currentIndex,
    shuffle,
  };
}

export const textfolder = [
  {
    label: 'motivation',
    text: [
      // calm / grounding
      'Breathe. You have time.',
      "Slow down, you're not behind",
      'One thing at a time is enough',
      "It's okay to pause",
      'Stillness is productive too',
      "You don't have to rush this",
      'Let your mind settle for a second',
      'This moment is enough',

      // focus / distraction
      'Your focus is not broken, it just wanders',
      'Come back gently, no need to scold yourself',
      'Distraction is not defeat',
      'You can start small and that still counts',
      'One tab, one task, one breath',
      'Notice the pull, then choose again',

      // self-compassion
      'You are doing better than you think',
      'Your brain works differently, not wrongly',
      'Rest is not laziness',
      'You are allowed to be gentle with yourself',
      "Progress doesn't have to be perfect",
      'You showed up, that matters',
      "Be as kind to yourself as you'd be to a friend",

      // creativity
      "Your mind makes unexpected connections, that's a gift",
      'Messy thinking can still be brilliant thinking',
      'You see things others miss',
      'Creativity thrives in the wandering mind',
      'Let your ideas surprise you',

      // permission / ease
      "You don't need to earn rest",
      "It's okay if today looks different",
      'Small steps still move you forward',
      'You are allowed to take up space, slowly',
      'There is no perfect way to do this',
      'You get to go at your own pace',
    ],
  },
];