'use client';

import { useRef, useEffect, useCallback } from 'react';
import { useLocalStorage } from 'usehooks-ts';
import type { Dispatch, SetStateAction } from 'react';

export function useTextareaAutoResize(
  input: string,
  setInput: Dispatch<SetStateAction<string>>,
) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [localStorageInput, setLocalStorageInput] = useLocalStorage('input', '');

  const adjustHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight + 2}px`;
    }
  }, []);

  const resetHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = '98px';
    }
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      const domValue = textareaRef.current.value;
      const finalValue = domValue || localStorageInput || '';
      setInput(finalValue);
      adjustHeight();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setLocalStorageInput(input);
  }, [input, setLocalStorageInput]);

  return {
    textareaRef,
    adjustHeight,
    resetHeight,
    setLocalStorageInput,
  };
}

