import { format } from "date-fns"

Date.prototype.format = function (mask) {
  return format(this, mask)
}

export const DateFormat = (value, mask) => {
  return format(value, mask)
}

Date.prototype.formatUTC = function () {
  const utcDate = new Date(this)
  return utcDate.toISOString().replace('T', ' ').substring(0, 19)
}