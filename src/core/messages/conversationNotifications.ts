type DateLike = Date | string | null | undefined;
type MessageLike = {
  createdAt: DateLike;
  authorType: string;
};

const toTime = (value: DateLike) => {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
};

export function hasUnreadForTradie(
  lastCustomerMessageAt: DateLike,
  lastTradieMessageAt: DateLike
) {
  const customerTime = toTime(lastCustomerMessageAt);
  if (!customerTime) return false;
  return customerTime > toTime(lastTradieMessageAt);
}

export function hasUnreadForCustomer(
  lastTradieMessageAt: DateLike,
  lastCustomerMessageAt: DateLike
) {
  const tradieTime = toTime(lastTradieMessageAt);
  if (!tradieTime) return false;
  return tradieTime > toTime(lastCustomerMessageAt);
}

export function countUnreadByAuthor(
  messages: MessageLike[],
  authorType: "CUSTOMER" | "TRADIE",
  lastReadAt: DateLike
) {
  const lastReadTime = toTime(lastReadAt);
  return messages.reduce((count, message) => {
    if (message.authorType !== authorType) return count;
    return toTime(message.createdAt) > lastReadTime ? count + 1 : count;
  }, 0);
}
