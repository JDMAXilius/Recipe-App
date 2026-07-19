// Turn whatever lands in the "paste the invite link" box into a list token.
//
// People paste more than a bare URL: messaging apps append tracking params,
// leave a trailing slash, or put the link BEFORE the sender's own words. The
// original regex only matched a token at the very END of the string, so every
// one of those cases was rejected as "that link doesn't look right" — on a
// perfectly good invite.
//
// So: find /hl/<token> anywhere in the text, and accept a bare token only when
// it is the whole input (otherwise arbitrary prose yields a junk token that
// fails later against the server, which reads as "the list is dead").

const TOKEN = "[A-Za-z0-9_-]{8,24}";
const IN_URL = new RegExp(`/hl/(${TOKEN})`);
const BARE = new RegExp(`^\\s*(${TOKEN})\\s*$`);

export const parseInviteToken = (input) => {
  const text = String(input || "");
  return (text.match(IN_URL) || text.match(BARE) || [])[1] || null;
};
