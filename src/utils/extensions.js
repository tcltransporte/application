import { format } from "date-fns"

Date.prototype.format = function (mask) {
  return format(this, mask)
}

Date.prototype.formatUTC = function () {
  return DateFormatUTC(this)
}

export const DateFormat = (value, mask) => {
  return format(value, mask)
}

export const DateFormatUTC = (value) => {
  const utcDate = new Date(value || null)
  return utcDate?.toISOString().replace('T', ' ').substring(0, 19)
}

String.prototype.toNullIfEmpty = function() {
  return this.trim() === '' ? null : this.toString();
}

Number.prototype.toNullIfEmpty = function() {
  return this == null || isNaN(this) ? null : this.valueOf();
}