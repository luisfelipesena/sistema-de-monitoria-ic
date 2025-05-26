# GET /api/projeto

Listar Projetos

---

## Autenticação



---

## Params


---

## Response Body


Status code: 200

```json
[
  {
    "id": 1,
    "titulo": "Computação Gráfica",
    "departamentoId": 1,
    "departamentoNome": "Departamento de ciência da computação",
    "professorResponsavelNome": "arthur silva",
    "disciplinas": [
      {
        "id": 1,
        "nome": "Algoritmos e estruturas de dados",
        "codigo": "Mata40"
      }
    ],
    "status": "DRAFT",
    "ano": 2025,
    "semestre": "SEMESTRE_1",
    "bolsasSolicitadas": 1,
    "voluntariosSolicitados": 1,
    "bolsasDisponibilizadas": 0,
    "totalInscritos": 2,
    "inscritosBolsista": 1,
    "inscritosVoluntario": 1,
    "createdAt": "2025-05-26T19:26:47.955Z"
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

# POST /api/projeto

Cadastrar projeto

---

## Authentication

Este endpoint **requer autenticação** para ser acessado. Somente Professores. 

---

## Request Body

```json
{
    "titulo": "Computação Gráfica",
    "departamentoId": 1,
    "disciplinas": [
        {
        "id": 1
        }
    ],
    "ano": 2025,
    "semestre": "SEMESTRE_1",
    "bolsasSolicitadas": 1,
    "voluntariosSolicitados": 1
}
````

## Failure

Status code: 

```json
{

}
```