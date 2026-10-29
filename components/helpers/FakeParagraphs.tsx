import Jabber from "jabber";
import { memo } from "react";
import { Paragraph } from "../layout/paragraph";

const jabber = new Jabber();

export const FakeParagraphs = memo(function FakeParagraphs({
  count,
  words,
}: {
  count: number;
  words: number;
}) {
  return (
    <>
      {[...Array(count)].map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length list that never reorders
        <Paragraph key={i}>{jabber.createParagraph(words)}</Paragraph>
      ))}
    </>
  );
});
