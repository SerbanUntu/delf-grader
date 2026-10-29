import Jabber from "jabber";
import { memo } from "react";

const jabber = new Jabber();

export const FakeWordList = memo(function FakeWordList({
  count,
  length,
  capitalize,
}: {
  count: number;
  length: [number, number];
  capitalize?: boolean;
}) {
  return (
    <>
      {[...Array(count)].map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length list that never reorders
        <div key={i}>
          {jabber.createWord(
            length[0] + Math.floor(Math.random() * (length[1] - length[0])),
            capitalize,
          )}
        </div>
      ))}
    </>
  );
});
