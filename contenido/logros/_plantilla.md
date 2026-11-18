---
# Copiar este archivo a logros/<dominio>/<id>.md. Los archivos que empiezan con "_" se ignoran.
id: dominio-nombre-corto        # permanente, igual al nombre del archivo
dominio: agua                   # id de dominios.yaml
tipo: habilidad                 # habilidad | equipo
titulo: Título visible del logro
descripcion: Una línea que dice qué hay que saber hacer o tener.
profundidad: 1                  # 1 = raíz. Define el XP base (10 / 25 / 50 / 100)
# xpBase: 30                    # opcional: reemplaza el XP de la profundidad
prerrequisitos: []              # ids de logros: [agua-potabilizar]
itemsRequeridos: []             # equipo: lo que hay que tener. Habilidad: lo que hace falta para intentarlo
#  - item: bidon-agua           #   id de items.yaml
#    cantidad: 2
metodosPermitidos: [autodeclaracion, cuestionario]   # equipo: []. Salud: [cuestionario]
video: https://www.youtube.com/watch?v=XXXXXXXXXXX    # opcional
cuestionario:                   # obligatorio si metodosPermitidos incluye cuestionario
  umbral: 0.7                   # proporción de respuestas correctas para aprobar
  preguntas:
    - enunciado: ¿Pregunta?
      opciones: [Opción A, Opción B, Opción C]
      correcta: 0               # índice de la opción correcta, empieza en 0
---

Acá va la guía de la pestaña "Aprendé", en Markdown.

## Qué necesitás

## Paso a paso

## Errores comunes

En Salud y Seguridad: solo conocimiento, sin procedimientos de riesgo, y siempre derivar a un curso presencial.
