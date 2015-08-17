# InMoovBrain Console
Interfaz Web para InMoovBrain Server

## Descripción
**InMoovBrain Console** es una aplicación Web para controlar tu InMoov a través del [InMoovBrain Server](https://github.com/ugogarcia/inmoovbrainserver). Este interfaz permite enviar comandos al servidor y hace uso del reconocimiento de voz de Chrome para permitir controlar tu InMoov con el habla.

## Requisitos
Para funcionar correctamente la Consola es necesario disponer en tu sistema de:

* Chrome 25 o superior (sólo necesario si deseas utilizar el reconomiento de voz)
* MAMP 3.0.6 o similar configurado para aceptar conexiones HTTPS

## Instalación
Simplemente copia la aplicación Web a tu ordenador y verifica que el servidor que tienes instalado en local (MAMP 3.0.6 por ejemplo) accede correctamente a _inmoovconsole.html_ por _https_. La conexión por HTTPS no es obligatoria, sólo es recomendable para que el navegador no te pida autorización cada vez que hag uso del micrófono para usar el reconocimiento de voz.

## Arranque
Para comenzar a utilizar la Consola sólo es necesario abrir un navegador Chrome y apuntar al archivo _inmoovconsole.html_. Si estas utilizando HTTPS será necesario que antes, abras en otra pestaña la URL del servidor InMoovBrain. Esto es así ya que si el certificado SSL usado no ha sido generado por una empresa certificadora confiable, el navegador dará errores al intentar conectarse desde la Consola. Al abrir manualmente la URL de InMoovBrain te permitirá indicar al navegador que confías en el certificado generado y funcionará sin problemas.


