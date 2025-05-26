# GET /api/disciplina

Listar Disciplinas

---

## Autenticação


---

## Params

departamentoId

---

## Response Body

Retorna disciplinas não deletadas
Retorna em ordem alfabetica

Status code: 200

```json
[
  {
    "id": 1,
    "nome": "Algoritmos e estruturas de dados",
    "codigo": "Mata40",
    "departamentoId": 1,
    "createdAt": "2025-05-26T16:55:01.764Z",
    "updatedAt": "2025-05-26T16:55:01.764Z",
    "deletedAt": null
  },
  {
    "id": 2,
    "nome": "Teoria dos grafos",
    "codigo": "MATA41",
    "departamentoId": 2,
    "createdAt": "2025-05-26T18:12:09.168Z",
    "updatedAt": "2025-05-26T18:12:09.168Z",
    "deletedAt": null
  }
]
```  
---

## Failure

Status code: 

```json
{

}
```

---

# POST /api/disciplina

Cadastrar disciplina

---

## Authentication

Este endpoint **requer autenticação** para ser acessado. Somente administradores. 

---

## Request Body

```json
{
  "nome": "Programação Web",
  "codigo": "COMP0322",
  "departamentoId": 1
}
````

## Failure

Status code: 

```json
{

}
```