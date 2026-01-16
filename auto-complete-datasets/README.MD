# JCL Dataset Autocomplete

Extensión para autocompletar nombres de datasets en archivos JCL.

## Características

- Autocompleta datasets cuando escribes después de `DSN=`
- Filtra por coincidencia parcial (contiene)
- Lee datasets desde archivo externo configurable

## Configuración

Por defecto lee desde: `D:\jcl-datasets.txt`

Puedes cambiar la ruta en Settings > Extensions > JCL Dataset Autocomplete
```

## Paso 2: Crear el archivo de datasets

Crea el archivo `D:\jcl-datasets.txt` con tus datasets (uno por línea):
```
DXXX.XX.MAESTRO
DXXX.XX.DETALLE
DXXX.XX.PROCESOS
TXXX.SAL.REGISTRO
PXXX.ENT.DATOS