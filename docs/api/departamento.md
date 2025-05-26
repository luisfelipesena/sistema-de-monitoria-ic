# GET /api/departamento

Listar departamentos

---

## 🔐 Autenticação



---

## Response Body

Status code: 200

```json
[
  {
    "id": 1,
    "unidadeUniversitaria": "Instituto de computação",
    "nome": "Departamento de ciência da computação",
    "sigla": "DCC",
    "createdAt": "2025-05-26T16:54:47.946Z",
    "updatedAt": "2025-05-26T16:54:47.945Z"
  },
  {
    "id": 2,
    "unidadeUniversitaria": "Instituto de matematica",
    "nome": "Departamento de estatistica",
    "sigla": "ES",
    "createdAt": "2025-05-26T18:08:17.748Z",
    "updatedAt": "2025-05-26T18:08:17.748Z"
  }
]
```  

## Failure

Status code: 

```json
{

}
```

# /api/departamento

Listar departamentos

---

## Authentication

Este endpoint **requer autenticação** para ser acessado. Somente administradores. 

---

## Request Body

Status code: 201

```json
{
  "unidadeUniversitaria": "Instituto de computação",
  "nome": "Departamento de ciência da computação",
  "sigla": "DCC"
}
````

## Failure

Status code: 

```json
{

}
```