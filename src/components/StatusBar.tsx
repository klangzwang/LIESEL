import React from 'react';
import { useStatusStore } from '../store/StatusStore';

export const StatusBar: React.FC = () => {

  const text = useStatusStore(state => state.text);

  return (
    <div className="flex flex-col">
      <div className="flex w-full h-[4px] bg-[#111]" />
      <div className="flex grow h-[32px] bg-[#222] items-center justify-between text-[#777] text-[13px] tracking-wide truncate p-2">
        {text}
      </div>
    </div>
  );
};
