const SHORT_DATE_TIME_FORMATTER = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
})

const LONG_DATE_TIME_FORMATTER = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
})

export function formatMeetingDateShort(date: string | Date) {
  return SHORT_DATE_TIME_FORMATTER.format(new Date(date))
}

export function formatMeetingDateLong(date: string | Date) {
  return LONG_DATE_TIME_FORMATTER.format(new Date(date))
}
