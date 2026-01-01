## DarioAI 🤖

**DarioAI** es una aplicación web de inteligencia artificial basada en una **arquitectura cliente–servidor** que consume **múltiples APIs de modelos de lenguaje (LLMs)** externos, como **Groq** y **Gemini**, utilizando un sistema de **rotación de proveedores** para la generación de respuestas.

El proyecto no ejecuta modelos localmente: todo el procesamiento pesado se delega a servicios externos mediante API, lo que permite un **bajo consumo de recursos**, **menor latencia** y **alta escalabilidad**.

### 🧠 Arquitectura
- **Frontend**: Interfaz web desde la cual el usuario envía prompts, hecha con Astro, React y TailwindCSS.
- **Backend**: Actúa como intermediario (proxy) entre el frontend y las APIs de IA.
- **APIs de IA**: Proveedores externos de LLMs (Groq, Gemini, etc.).
- **Sistema de rotación**: Selecciona dinámicamente el proveedor para cada solicitud.

Este enfoque evita dependencias de un único proveedor y mejora la tolerancia a fallos.

### ⚙️ Características técnicas
- Rotación de múltiples APIs de IA
- Comunicación mediante requests HTTP (JSON)
- Respuestas en texto (sin transferencia de modelos)
- Bajo consumo de ancho de banda
- Gestión de claves mediante variables de entorno
- Diseño modular para añadir nuevos proveedores de IA

### 📈 Escalabilidad y rendimiento
- El consumo de ancho de banda depende únicamente del tamaño de los prompts y respuestas.
- El principal cuello de botella son los **límites de tokens y requests de las APIs**, no el hosting.
- Preparado para crecer en usuarios sin cambios estructurales importantes.

### 🎯 Objetivo
Proveer una base técnica sólida para una IA web ligera, mantenible y extensible, enfocada en el uso eficiente de APIs externas y en la facilidad de escalado futuro.
