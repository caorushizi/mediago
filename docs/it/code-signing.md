---
layout: doc
outline: deep
---

# Code signing policy

Aggiornata il 24 ottobre 2026.

MediaGo sta preparando la richiesta a [SignPath Foundation](https://signpath.org/) per la firma Windows. Approvazione e integrazione sono **in attesa**: non dichiariamo che SignPath firmi già MediaGo. I pacchetti Windows precedenti non firmati, incluso 3.6.0-beta.1, restano tali. La firma e notarizzazione macOS sono separate.

La prima versione firmata sarà identificata nella pagina di download e nelle note di rilascio, con identità verificata dell’editore e istruzioni. Una firma non certifica l’assenza di difetti.

## Origine e approvazione

Gli artefatti devono essere riconducibili a sorgenti revisionati di [mediago-dev/mediago](https://github.com/mediago-dev/mediago) e a build ospitate da GitHub. Firma di produzione e pubblicazione richiedono approvazione umana; l’automazione di manutenzione non approva le firme di produzione.

Il manutentore e contatto iniziale per l’approvazione è [caorushizi](https://github.com/caorushizi). Autori e revisori sono i manutentori autorizzati. I ruoli di firma devono essere assegnati esplicitamente e usare MFA su GitHub e SignPath. Le modifiche al processo di firma richiedono revisione.

## Ambito e verifica

La politica riguarda solo gli artefatti MediaGo approvati. Gli strumenti di terzi mantengono origine e licenze upstream: includerli non li rende software scritto da MediaGo o prova che ogni file sia firmato. Vedi gli [avvisi di terzi](https://github.com/mediago-dev/mediago/blob/master/THIRD_PARTY_NOTICES.md).

Il processo previsto dovrà verificare editore Authenticode, marca temporale e artefatti finali, rifiutando aggiornamenti non firmati, modificati o di un editore diverso. Non inventeremo publisherName né disattiveremo i controlli. Le firme di test non sono firme pubblicamente attendibili. Per i vecchi client non firmati sarà documentata la prima installazione attendibile.

## Privacy e contatti

L’[informativa privacy](./privacy.md) descrive il consenso facoltativo a TalkingData. La firma non abilita le statistiche. Contatto: [84996057@qq.com](mailto:84996057@qq.com); non inviare chiavi private, password o token.

L’attribuzione a SignPath sarà aggiunta solo dopo approvazione e distribuzione realmente firmata, secondo le [condizioni della fondazione](https://signpath.org/terms).
