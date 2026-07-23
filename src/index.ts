import express, { Request, Response } from 'express'

const app = express()

app.get('/', (req: Request, res: Response) => {
  const acceptHeader = Array.isArray(req.headers.accept)
    ? req.headers.accept.join(',')
    : req.headers.accept || ''
  const languageHeader = Array.isArray(req.headers['accept-language'])
    ? req.headers['accept-language'].join(',')
    : req.headers['accept-language'] || ''
  const encodingHeader = Array.isArray(req.headers['accept-encoding'])
    ? req.headers['accept-encoding'].join(',')
    : req.headers['accept-encoding'] || ''

  const tiposAceitos = acceptHeader
    .split(',')
    .map(value => value.trim())
    .filter(Boolean)
  const linguagem = languageHeader
    .split(',')
    .map(value => value.trim())
    .filter(Boolean)
  const encoding = encodingHeader
    .split(',')
    .map(value => value.trim())
    .filter(Boolean)

  res.send({
    tiposAceitos,
    linguagem,
    encoding
  })
})

app.listen(3000, () => {
  console.log('Servidor rodando em http://localhost:3000')
})