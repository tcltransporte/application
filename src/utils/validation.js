export function isValidCPF(cpf) {

  cpf = cpf.replace(/[^\d]/g, '')

  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false

  const calc = (factor) =>
    cpf
      .slice(0, factor - 1)
      .split('')
      .reduce((sum, digit, i) => sum + parseInt(digit) * (factor - i), 0)

  const digit1 = (calc(10) * 10) % 11 % 10
  const digit2 = (calc(11) * 10) % 11 % 10

  return digit1 === parseInt(cpf[9]) && digit2 === parseInt(cpf[10])

}

export function isValidCNPJ(cnpj) {

  cnpj = cnpj.replace(/[^\d]/g, '')

  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false

  const calc = (length) => {
    const numbers = cnpj.slice(0, length).split('').map(Number)
    const multipliers = length === 12
      ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
      : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]

    const sum = numbers.reduce((acc, num, i) => acc + num * multipliers[i], 0)
    const rest = sum % 11
    return rest < 2 ? 0 : 11 - rest
  }

  const digit1 = calc(12)
  const digit2 = calc(13)

  return digit1 === parseInt(cnpj[12]) && digit2 === parseInt(cnpj[13])

}