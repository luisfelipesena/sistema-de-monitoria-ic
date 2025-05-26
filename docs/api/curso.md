# GET /api/curso

Listar cursos

---

## Autenticação

---

## Response Body

Status code: 200

Em ordem alfabetica

```json
[
  {
    "id": 1,
    "nome": "Ciência da computação ",
    "codigo": 112,
    "createdAt": "2025-05-26T18:21:37.076Z",
    "updatedAt": "2025-05-26T18:21:37.076Z"
  },
  {
    "id": 2,
    "nome": "Estatistica",
    "codigo": 111,
    "createdAt": "2025-05-26T19:04:20.875Z",
    "updatedAt": "2025-05-26T19:04:20.876Z"
  }
]
```  

### GET /api/curso/[id]

Status code: 200

/api/curso/1

```json
{
    "id": 1,
    "nome": "Ciência da computação ",
    "codigo": 112,
    "createdAt": "2025-05-26T18:21:37.076Z",
    "updatedAt": "2025-05-26T18:21:37.076Z"
}
```  


## Failure

Status code: 

```json
{

}
```

# POST /api/curso

Cadastrar curso

---

## 🔐 Authentication

Este endpoint **requer autenticação** para ser acessado. Somente administradores. 

---

## Request Body

Status code: 201

```json
{
    "nome": "Ciência da computação ",
    "codigo": 112,
}
````

## Failure

Status code: 

```json
{

}
```