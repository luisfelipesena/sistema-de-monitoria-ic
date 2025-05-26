# GET /api/aluno

Exibir aluno

---

## Autenticação

---

## Params

userId

---

## Response Body

Status code: 200

```json
[
  {
      "id": 1,
      "userId": 2,
      "nome_completo": "Ana Carolina Santos",
      "nome_social": null,
      "genero": "FEMININO",
      "especificacaoGenero": null,
      "emailInstitucional": "ana.santos@ufba.br",
      "matricula": "20221045678",
      "rg": "2578292310",
      "cpf": "11111111111",
      "cr": 9.0,
      "telefone": "71999899889",
      "enderecoId": 2,
      "cursoId": 1,
      "createdAt": "2025-05-26T18:12:09.168Z",
      "updatedAt": "2025-05-26T18:12:09.168Z"
    }
]
```  

## Failure

Status code: 

```json
{

}
```

# POST /api/aluno

Cadastrar aluno

---

## Authentication

Este endpoint **requer autenticação** para ser acessado. 

---

## Request Body

```json
{
  "userId": 92,
  "nome_completo": "Pedro Henrique Silva",
  "nome_social": null,
  "genero": "MASCULINO",
  "especificacaoGenero": null,
  "emailInstitucional": "pedro.silva@academico.exemplo.edu.br",
  "matricula": "20235078912",
  "rg": "87.654.321-0",
  "cpf": "987.654.321-00",
  "cr": 9.2,
  "telefone": "(11) 97654-3210",
  "curso_id": 3,
  "endereco": {
    "rua": "Avenida Principal",
    "numero": 456,
    "bairro": "Centro",
    "cidade": "São Paulo",
    "estado": "SP",
    "cep": "04567-890",
    "complemento": "Bloco B"
  }
}
````

---

## Response Body

status code: 201

---

## Failure

Status code: 

```json
{

}
```