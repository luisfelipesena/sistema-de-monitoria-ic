export const ADMIN_EMAILS = [
  'luis.sena@ufba.br',
  'joao.leahy@ufba.br',
  'antoniels@ufba.br',
  'caioviana@ufba.br',
  'felipecg@ufba.br',
  'paulovo@ufba.br',
  'matheus.passos@ufba.br',
  'imoreira@ufba.br',
  'icaro.baliza@ufba.br',
  'rubisleypl@ufba.br',
  'dcc@ufba.br',
  'caiomp@ufba.br',
  'luisfelipesena@gmail.com',
]

export const isAdminEmail = (email: string | null | undefined) => !!email && ADMIN_EMAILS.includes(email.toLowerCase())
