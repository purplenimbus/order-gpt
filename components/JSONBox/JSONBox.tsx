import React, { useEffect, useRef, useCallback, useState } from "react";

type JSONBoxProps = {
  title: string;
  text: string;
};

const JSONBox: React.FC<JSONBoxProps> = ({ title, text: text }) => {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  let json: string | undefined = undefined;

  try {
    console.log("Parsing JSON Text:", text);
    json = JSON.parse(text);
  } catch (err) {
    console.error("JSON Parsing error", err);
    json = undefined;
  }

  useEffect(() => {
    if (textAreaRef?.current && json) {
      textAreaRef.current.value = JSON.stringify(json, undefined, 2);
    }
  }, [textAreaRef, json]);

  return (
    <div className="p-4">
      <div className="p-2 text-base font-medium">{title}</div>
      <textarea
        className="overflow-auto bg-slate-800 text-sm font-mono"
        ref={textAreaRef}
        cols={40}
        rows={10}
      />
    </div>
  );
};

export default JSONBox;
