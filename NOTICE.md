# Notice · Aviso

<!-- English below · Español más abajo -->

## English

### What this software is

**ManyChat MCP** is the open-source runtime: a CLI and a Model Context Protocol server
that let AI agents operate a ManyChat account. It is licensed
**[AGPL-3.0-or-later](LICENSE)**.

It is built and maintained by **Gnosix / WIZNEO**. It is **not affiliated with, endorsed
by, or sponsored by ManyChat, Inc.** "ManyChat" is a trademark of its respective owner and
is used here only to describe what this software talks to.

### What you may do

The AGPL grants you broad rights, and we mean them:

- **Run it** for anything, including commercially, inside your own company or for clients.
- **Read, modify and fork it.** Self-hosting is a first-class path, not a crippled demo.
- **Redistribute** your version.

### What the licence requires in return

AGPL-3.0 is copyleft with a network clause. Plainly:

- If you **distribute** a modified version, you must release your changes under the AGPL.
- If you **run a modified version as a network service** that other people use, you must
  offer those users the complete corresponding source of the version you are running —
  even if you never hand them a binary. That is the clause that separates the AGPL from
  the MIT licence, and it is the one we chose deliberately.

So: **you can build a business on this. You cannot build a closed one.** If you offer this
as a service, your service's source has to be open on the same terms.

### What the licence does *not* give you

A copyright licence is not a trademark licence, and the AGPL says so explicitly
(section 7). This notice reserves:

- The names **Gnosix**, **WIZNEO**, **Revenue Operator**, and our logos and visual identity.
- Any presentation of your fork that implies it is ours, is endorsed by us, or is the
  official hosted service.

Fork it, run it, sell your own service on it — under a name that is clearly yours.

### The hosted service is a separate, closed product

The paid control plane (dashboard, encrypted credential vault, MCP token issuance, quota
enforcement, billing) is **not** in this repository and is **not** under the AGPL. It is a
separate proprietary codebase. This runtime never requires it: it talks to a control plane
only over the documented HTTP contract, and only when you set
`MCP_REMOTE_AUTH=hosted_token`.

### Handling credentials

A ManyChat API key grants full access to the page it belongs to. This software reads it
from the environment or a local profile file and never transmits it anywhere except
ManyChat's own API. If you deploy the gateway, you are the data controller for whatever
passes through it. See [SECURITY.md](SECURITY.md) to report a vulnerability.

> This notice is a plain-language summary written by the maintainers, not legal advice.
> [LICENSE](LICENSE) is the authoritative text; where they differ, the licence wins.

---

## Español

### Qué es este software

**ManyChat MCP** es el runtime open source: un CLI y un servidor Model Context Protocol
que permiten a agentes de IA operar una cuenta de ManyChat. Está licenciado bajo
**[AGPL-3.0-or-later](LICENSE)**.

Lo construye y mantiene **Gnosix / WIZNEO**. **No está afiliado, avalado ni patrocinado por
ManyChat, Inc.** "ManyChat" es marca de su respectivo titular y se usa acá sólo para
describir con qué habla este software.

### Qué podés hacer

La AGPL te da derechos amplios, y son de verdad:

- **Usarlo** para lo que quieras, incluso comercialmente, en tu empresa o para clientes.
- **Leerlo, modificarlo y forkearlo.** El self-host es un camino de primera clase, no un
  demo recortado.
- **Redistribuir** tu versión.

### Qué exige la licencia a cambio

La AGPL-3.0 es copyleft con cláusula de red. En claro:

- Si **distribuís** una versión modificada, tenés que liberar tus cambios bajo AGPL.
- Si **corrés una versión modificada como servicio de red** que usan otras personas, tenés
  que ofrecerle a esos usuarios el código fuente completo de la versión que estás
  corriendo, incluso si nunca les entregás un binario. Esa es la cláusula que separa a la
  AGPL de la licencia MIT, y es la que elegimos a propósito.

Entonces: **podés hacer negocio con esto. Lo que no podés es hacerlo cerrado.** Si lo
ofrecés como servicio, el código de tu servicio tiene que estar abierto en los mismos
términos.

### Qué *no* te da la licencia

Una licencia de copyright no es una licencia de marca, y la AGPL lo dice explícitamente
(sección 7). Este aviso reserva:

- Los nombres **Gnosix**, **WIZNEO**, **Revenue Operator**, y nuestros logos e identidad
  visual.
- Cualquier presentación de tu fork que dé a entender que es nuestro, que lo avalamos, o
  que es el servicio hosted oficial.

Forkealo, correlo, vendé tu propio servicio encima — con un nombre que sea claramente tuyo.

### El servicio hosted es un producto separado y cerrado

El control plane de pago (dashboard, bóveda cifrada de credenciales, emisión de tokens MCP,
límites de plan, facturación) **no** está en este repositorio y **no** está bajo AGPL. Es un
codebase propietario aparte. Este runtime nunca lo necesita: le habla a un control plane
sólo por el contrato HTTP documentado, y sólo si seteás `MCP_REMOTE_AUTH=hosted_token`.

### Manejo de credenciales

Una API key de ManyChat da acceso total a la página a la que pertenece. Este software la
lee del entorno o de un archivo de perfil local, y nunca la transmite a ningún lado que no
sea la API de ManyChat. Si deployás el gateway, vos sos el responsable de los datos que
pasen por ahí. Ver [SECURITY.md](SECURITY.md) para reportar una vulnerabilidad.

> Este aviso es un resumen en lenguaje claro escrito por los mantenedores, no asesoría
> legal. [LICENSE](LICENSE) es el texto autoritativo; si difieren, gana la licencia.
