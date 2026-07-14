import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { procedureLocale } from './content/procedure-locales.mjs';
import { procedures } from './content/procedures.mjs';

const root = path.resolve('src/content/docs');
const locales = [
  'en',
  'cs',
  'da',
  'de',
  'el',
  'es',
  'fi',
  'fr',
  'hu',
  'it',
  'ja',
  'ko',
  'nl',
  'no',
  'pl',
  'pt',
  'sv',
  'tr',
  'uk',
  'zh',
];
const verified = '2026-07-14';
const docsVersion = '0.1.0';
const commits = {
  'helmerzNL/DiscVault': '6d27c689ac2166651d2c7c74833c1ee225b37ec3',
  'helmerzNL/DiscVaultApp': '9d15ab2a339cefdb164ec0ab29ad69ddabc511c1',
  'Flux76HQ/DiscVault-AndroidApp': 'a13ef4bdbb23b6a7e52e01cdf532fa222c1b67de',
  'Flux76HQ/App-Guidance': 'da1f68d8baf33b3e2fba06684c154755cd261a48',
};

// The first entries provide localized headings and page titles. Procedure-specific facts and
// translated action/term data live in scripts/content/ and are validated independently.
const l10n = {
  en: [
    'Goal and result',
    'Applies to',
    'Prerequisites',
    'Procedure',
    'Expected result',
    'Safety and rollback',
    'Next step',
    'Source and status',
    'Follow this focused procedure to complete',
    'The page states the release channel for every command. Stable and beta use the same DiscVault v26 PostgreSQL topology; only the image tag differs.',
    'Record the current image and configuration, and make the required backup before changing anything.',
    'Apply the configuration below exactly, replacing example host paths and domains with your own values.',
    'Run the checks shown below and stop if any check fails.',
    'The procedure is complete when the service reports healthy and the described result is visible.',
    'Stop the affected service, restore the saved configuration and matching data, then start the previous known-good image.',
    'Overview',
    'Installation routes',
    'Persistent data and PostgreSQL',
    'Reverse proxy and passkeys',
    'First start and health check',
    'Backup',
    'Restore',
    'Container update',
    'Image rollback',
    'DiscVault 26 migration',
    'Environment variables',
    'Authentication and RBAC',
    'Plugins and metadata',
    'Install the PWA',
    'Library and search',
    'Offline behavior',
    'Setup',
    'Daily use and sync limits',
    'Features and status',
    'Logs, jobs, and security',
    'Integrations overview',
    'MCP and REST API',
    'Plex and Jellyfin',
    'Troubleshooting',
    'Reference',
  ],
  cs: [
    'Cíl a výsledek',
    'Platí pro',
    'Požadavky',
    'Postup',
    'Očekávaný výsledek',
    'Bezpečnost a návrat',
    'Další krok',
    'Zdroj a stav',
    'Použijte tento konkrétní postup pro',
    'Na stránce je u každého příkazu uveden kanál vydání. Stabilní i beta kanál používají stejnou topologii DiscVault v26 s PostgreSQL; liší se pouze tag obrazu.',
    'Před změnou si poznamenejte aktuální obraz a konfiguraci a vytvořte požadovanou zálohu.',
    'Použijte přesně níže uvedenou konfiguraci a nahraďte ukázkové cesty a domény vlastními hodnotami.',
    'Spusťte uvedené kontroly a při jakékoli chybě se zastavte.',
    'Postup je dokončen, když služba hlásí zdravý stav a je vidět popsaný výsledek.',
    'Zastavte dotčenou službu, obnovte uloženou konfiguraci a odpovídající data a spusťte předchozí funkční obraz.',
    'Přehled',
    'Možnosti instalace',
    'Trvalá data a PostgreSQL',
    'Reverzní proxy a přístupové klíče',
    'První spuštění a kontrola stavu',
    'Záloha',
    'Obnovení',
    'Aktualizace kontejneru',
    'Návrat obrazu',
    'Migrace na DiscVault 26',
    'Proměnné prostředí',
    'Ověřování a RBAC',
    'Pluginy a metadata',
    'Instalace PWA',
    'Knihovna a hledání',
    'Chování offline',
    'Nastavení',
    'Běžné používání a omezení synchronizace',
    'Funkce a stav',
    'Protokoly, úlohy a zabezpečení',
    'Přehled integrací',
    'MCP a REST API',
    'Plex a Jellyfin',
    'Řešení potíží',
    'Reference',
  ],
  da: [
    'Mål og resultat',
    'Gælder for',
    'Forudsætninger',
    'Fremgangsmåde',
    'Forventet resultat',
    'Sikkerhed og tilbagerulning',
    'Næste trin',
    'Kilde og status',
    'Følg denne målrettede vejledning for at fuldføre',
    'Siden angiver udgivelseskanalen for hver kommando. Stabil og beta bruger samme DiscVault v26-topologi med PostgreSQL; kun image-tagget er forskelligt.',
    'Notér det aktuelle image og konfigurationen, og opret den krævede sikkerhedskopi før ændringer.',
    'Anvend konfigurationen nedenfor nøjagtigt, og erstat eksempelstier og domæner med dine egne værdier.',
    'Kør de viste kontroller, og stop hvis en kontrol fejler.',
    'Proceduren er færdig, når tjenesten melder sund, og det beskrevne resultat er synligt.',
    'Stop den berørte tjeneste, gendan den gemte konfiguration og de tilsvarende data, og start det tidligere fungerende image.',
    'Oversigt',
    'Installationsmuligheder',
    'Vedvarende data og PostgreSQL',
    'Omvendt proxy og adgangsnøgler',
    'Første start og sundhedskontrol',
    'Sikkerhedskopi',
    'Gendannelse',
    'Containeropdatering',
    'Tilbagerulning af image',
    'Migrering til DiscVault 26',
    'Miljøvariabler',
    'Godkendelse og RBAC',
    'Plugins og metadata',
    'Installer PWA',
    'Bibliotek og søgning',
    'Offlineadfærd',
    'Opsætning',
    'Daglig brug og synkroniseringsgrænser',
    'Funktioner og status',
    'Logfiler, job og sikkerhed',
    'Oversigt over integrationer',
    'MCP og REST API',
    'Plex og Jellyfin',
    'Fejlfinding',
    'Reference',
  ],
  de: [
    'Ziel und Ergebnis',
    'Gültig für',
    'Voraussetzungen',
    'Vorgehen',
    'Erwartetes Ergebnis',
    'Sicherheit und Rollback',
    'Nächster Schritt',
    'Quelle und Status',
    'Führe dieses gezielte Verfahren aus für',
    'Die Seite kennzeichnet für jeden Befehl den Release-Kanal. Stable und Beta verwenden dieselbe DiscVault-v26-Topologie mit PostgreSQL; nur das Image-Tag unterscheidet sich.',
    'Notiere vor Änderungen das aktuelle Image und die Konfiguration und erstelle die erforderliche Sicherung.',
    'Wende die folgende Konfiguration exakt an und ersetze Beispielpfade und Domains durch eigene Werte.',
    'Führe die gezeigten Prüfungen aus und stoppe bei jedem Fehler.',
    'Das Verfahren ist abgeschlossen, wenn der Dienst den Status gesund meldet und das beschriebene Ergebnis sichtbar ist.',
    'Stoppe den betroffenen Dienst, stelle Konfiguration und passende Daten wieder her und starte das vorherige funktionierende Image.',
    'Übersicht',
    'Installationswege',
    'Persistente Daten und PostgreSQL',
    'Reverse-Proxy und Passkeys',
    'Erster Start und Zustandsprüfung',
    'Sicherung',
    'Wiederherstellung',
    'Container-Update',
    'Image-Rollback',
    'Migration zu DiscVault 26',
    'Umgebungsvariablen',
    'Authentifizierung und RBAC',
    'Plugins und Metadaten',
    'PWA installieren',
    'Bibliothek und Suche',
    'Offlineverhalten',
    'Einrichtung',
    'Tägliche Nutzung und Synchronisationsgrenzen',
    'Funktionen und Status',
    'Protokolle, Jobs und Sicherheit',
    'Integrationsübersicht',
    'MCP und REST-API',
    'Plex und Jellyfin',
    'Fehlerbehebung',
    'Referenz',
  ],
  el: [
    'Στόχος και αποτέλεσμα',
    'Ισχύει για',
    'Προϋποθέσεις',
    'Διαδικασία',
    'Αναμενόμενο αποτέλεσμα',
    'Ασφάλεια και επαναφορά',
    'Επόμενο βήμα',
    'Πηγή και κατάσταση',
    'Ακολουθήστε αυτή τη συγκεκριμένη διαδικασία για',
    'Η σελίδα δηλώνει το κανάλι έκδοσης για κάθε εντολή. Τα κανάλια stable και beta χρησιμοποιούν την ίδια τοπολογία DiscVault v26 με PostgreSQL· διαφέρει μόνο η ετικέτα εικόνας.',
    'Καταγράψτε την τρέχουσα εικόνα και ρύθμιση και δημιουργήστε το απαιτούμενο αντίγραφο πριν από αλλαγές.',
    'Εφαρμόστε ακριβώς την παρακάτω ρύθμιση, αντικαθιστώντας τις ενδεικτικές διαδρομές και τους τομείς με δικές σας τιμές.',
    'Εκτελέστε τους ελέγχους που εμφανίζονται και σταματήστε αν αποτύχει κάποιος.',
    'Η διαδικασία ολοκληρώνεται όταν η υπηρεσία αναφέρει καλή λειτουργία και εμφανίζεται το περιγραφόμενο αποτέλεσμα.',
    'Σταματήστε την επηρεαζόμενη υπηρεσία, επαναφέρετε την αποθηκευμένη ρύθμιση και τα αντίστοιχα δεδομένα και εκκινήστε την προηγούμενη λειτουργική εικόνα.',
    'Επισκόπηση',
    'Διαδρομές εγκατάστασης',
    'Μόνιμα δεδομένα και PostgreSQL',
    'Αντίστροφος διακομιστής μεσολάβησης και κλειδιά πρόσβασης',
    'Πρώτη εκκίνηση και έλεγχος υγείας',
    'Αντίγραφο ασφαλείας',
    'Επαναφορά',
    'Ενημέρωση περιέκτη',
    'Επαναφορά εικόνας',
    'Μετεγκατάσταση στο DiscVault 26',
    'Μεταβλητές περιβάλλοντος',
    'Ταυτοποίηση και RBAC',
    'Πρόσθετα και μεταδεδομένα',
    'Εγκατάσταση PWA',
    'Βιβλιοθήκη και αναζήτηση',
    'Λειτουργία εκτός σύνδεσης',
    'Ρύθμιση',
    'Καθημερινή χρήση και όρια συγχρονισμού',
    'Λειτουργίες και κατάσταση',
    'Αρχεία καταγραφής, εργασίες και ασφάλεια',
    'Επισκόπηση ενσωματώσεων',
    'MCP και REST API',
    'Plex και Jellyfin',
    'Αντιμετώπιση προβλημάτων',
    'Αναφορά',
  ],
  es: [
    'Objetivo y resultado',
    'Aplicable a',
    'Requisitos previos',
    'Procedimiento',
    'Resultado esperado',
    'Seguridad y reversión',
    'Siguiente paso',
    'Fuente y estado',
    'Sigue este procedimiento específico para completar',
    'La página indica el canal de publicación de cada comando. Estable y beta usan la misma topología de DiscVault v26 con PostgreSQL; solo cambia la etiqueta de imagen.',
    'Anota la imagen y la configuración actuales y crea la copia necesaria antes de cambiar nada.',
    'Aplica exactamente la configuración siguiente y sustituye las rutas y dominios de ejemplo por tus valores.',
    'Ejecuta las comprobaciones indicadas y detente si falla alguna.',
    'El procedimiento termina cuando el servicio indica un estado correcto y el resultado descrito es visible.',
    'Detén el servicio afectado, restaura la configuración y los datos correspondientes y arranca la imagen anterior que funcionaba.',
    'Resumen',
    'Opciones de instalación',
    'Datos persistentes y PostgreSQL',
    'Proxy inverso y claves de acceso',
    'Primer inicio y comprobación de estado',
    'Copia de seguridad',
    'Restauración',
    'Actualización del contenedor',
    'Reversión de imagen',
    'Migración a DiscVault 26',
    'Variables de entorno',
    'Autenticación y RBAC',
    'Complementos y metadatos',
    'Instalar la PWA',
    'Biblioteca y búsqueda',
    'Comportamiento sin conexión',
    'Configuración',
    'Uso diario y límites de sincronización',
    'Funciones y estado',
    'Registros, tareas y seguridad',
    'Resumen de integraciones',
    'MCP y API REST',
    'Plex y Jellyfin',
    'Solución de problemas',
    'Referencia',
  ],
  fi: [
    'Tavoite ja tulos',
    'Koskee',
    'Edellytykset',
    'Toimenpiteet',
    'Odotettu tulos',
    'Turvallisuus ja palautus',
    'Seuraava vaihe',
    'Lähde ja tila',
    'Noudata tätä kohdennettua ohjetta suorittaaksesi',
    'Sivu ilmoittaa jokaisen komennon julkaisukanavan. Vakaa ja beta käyttävät samaa PostgreSQL-pohjaista DiscVault v26 -topologiaa; vain image-tunniste vaihtuu.',
    'Kirjaa nykyinen levykuva ja määritys ja tee vaadittu varmuuskopio ennen muutoksia.',
    'Käytä alla olevaa määritystä täsmälleen ja korvaa esimerkkipolut ja verkkotunnukset omilla arvoillasi.',
    'Suorita näytetyt tarkistukset ja pysähdy, jos jokin niistä epäonnistuu.',
    'Toimenpide on valmis, kun palvelu ilmoittaa olevansa kunnossa ja kuvattu tulos näkyy.',
    'Pysäytä kyseinen palvelu, palauta tallennettu määritys ja vastaavat tiedot ja käynnistä edellinen toimiva levykuva.',
    'Yleiskatsaus',
    'Asennusvaihtoehdot',
    'Pysyvät tiedot ja PostgreSQL',
    'Käänteinen välityspalvelin ja pääsyavaimet',
    'Ensimmäinen käynnistys ja kuntotarkistus',
    'Varmuuskopiointi',
    'Palautus',
    'Säilön päivitys',
    'Levykuvan palautus',
    'Siirtyminen DiscVault 26:een',
    'Ympäristömuuttujat',
    'Todennus ja RBAC',
    'Liitännäiset ja metatiedot',
    'PWA:n asennus',
    'Kirjasto ja haku',
    'Toiminta ilman verkkoa',
    'Määritys',
    'Päivittäinen käyttö ja synkronoinnin rajat',
    'Ominaisuudet ja tila',
    'Lokit, työt ja turvallisuus',
    'Integraatioiden yleiskatsaus',
    'MCP ja REST API',
    'Plex ja Jellyfin',
    'Vianmääritys',
    'Viite',
  ],
  fr: [
    'Objectif et résultat',
    'S’applique à',
    'Prérequis',
    'Procédure',
    'Résultat attendu',
    'Sécurité et retour arrière',
    'Étape suivante',
    'Source et état',
    'Suivez cette procédure ciblée pour effectuer',
    'La page indique le canal de publication de chaque commande. Stable et bêta utilisent la même topologie DiscVault v26 avec PostgreSQL ; seul le tag de l’image change.',
    'Notez l’image et la configuration actuelles et créez la sauvegarde requise avant toute modification.',
    'Appliquez exactement la configuration ci-dessous en remplaçant les chemins et domaines d’exemple par vos valeurs.',
    'Exécutez les contrôles indiqués et arrêtez-vous si l’un d’eux échoue.',
    'La procédure est terminée lorsque le service est déclaré sain et que le résultat décrit est visible.',
    'Arrêtez le service concerné, restaurez la configuration et les données correspondantes, puis démarrez l’image précédente fonctionnelle.',
    'Vue d’ensemble',
    'Méthodes d’installation',
    'Données persistantes et PostgreSQL',
    'Proxy inverse et clés d’accès',
    'Premier démarrage et contrôle d’état',
    'Sauvegarde',
    'Restauration',
    'Mise à jour du conteneur',
    'Retour à une image',
    'Migration vers DiscVault 26',
    'Variables d’environnement',
    'Authentification et RBAC',
    'Extensions et métadonnées',
    'Installer la PWA',
    'Bibliothèque et recherche',
    'Comportement hors ligne',
    'Configuration',
    'Utilisation quotidienne et limites de synchronisation',
    'Fonctions et état',
    'Journaux, tâches et sécurité',
    'Vue d’ensemble des intégrations',
    'MCP et API REST',
    'Plex et Jellyfin',
    'Dépannage',
    'Référence',
  ],
  hu: [
    'Cél és eredmény',
    'Érvényesség',
    'Előfeltételek',
    'Eljárás',
    'Várt eredmény',
    'Biztonság és visszaállítás',
    'Következő lépés',
    'Forrás és állapot',
    'Kövesse ezt a célzott eljárást a következőhöz:',
    'Az oldal minden parancsnál megadja a kiadási csatornát. A stabil és a béta ugyanazt a PostgreSQL-alapú DiscVault v26 topológiát használja; csak az image tagje tér el.',
    'Jegyezze fel a jelenlegi lemezképet és beállítást, majd a módosítás előtt készítse el a szükséges mentést.',
    'Pontosan alkalmazza az alábbi beállítást, és cserélje a mintául szolgáló útvonalakat és tartományokat saját értékeire.',
    'Futtassa a bemutatott ellenőrzéseket, és bármely hiba esetén álljon meg.',
    'Az eljárás akkor kész, ha a szolgáltatás egészséges állapotot jelez, és a leírt eredmény látható.',
    'Állítsa le az érintett szolgáltatást, állítsa vissza a mentett beállítást és adatokat, majd indítsa el az előző működő lemezképet.',
    'Áttekintés',
    'Telepítési lehetőségek',
    'Tartós adatok és PostgreSQL',
    'Fordított proxy és hozzáférési kulcsok',
    'Első indítás és állapotellenőrzés',
    'Biztonsági mentés',
    'Visszaállítás',
    'Konténerfrissítés',
    'Lemezkép visszaállítása',
    'Átállás DiscVault 26-ra',
    'Környezeti változók',
    'Hitelesítés és RBAC',
    'Bővítmények és metaadatok',
    'A PWA telepítése',
    'Könyvtár és keresés',
    'Offline működés',
    'Beállítás',
    'Mindennapi használat és szinkronizálási korlátok',
    'Funkciók és állapot',
    'Naplók, feladatok és biztonság',
    'Integrációk áttekintése',
    'MCP és REST API',
    'Plex és Jellyfin',
    'Hibaelhárítás',
    'Referencia',
  ],
  it: [
    'Obiettivo e risultato',
    'Si applica a',
    'Prerequisiti',
    'Procedura',
    'Risultato previsto',
    'Sicurezza e ripristino',
    'Passaggio successivo',
    'Fonte e stato',
    'Segui questa procedura mirata per completare',
    'La pagina indica il canale di rilascio per ogni comando. Stabile e beta usano la stessa topologia DiscVault v26 con PostgreSQL; cambia solo il tag dell’immagine.',
    'Annota l’immagine e la configurazione correnti e crea il backup richiesto prima delle modifiche.',
    'Applica esattamente la configurazione seguente sostituendo percorsi e domini di esempio con i tuoi valori.',
    'Esegui i controlli indicati e fermati se uno di essi non riesce.',
    'La procedura è completa quando il servizio risulta integro e il risultato descritto è visibile.',
    'Arresta il servizio interessato, ripristina configurazione e dati corrispondenti, quindi avvia l’immagine precedente funzionante.',
    'Panoramica',
    'Modalità di installazione',
    'Dati persistenti e PostgreSQL',
    'Proxy inverso e chiavi di accesso',
    'Primo avvio e controllo dello stato',
    'Backup',
    'Ripristino',
    'Aggiornamento del contenitore',
    'Ripristino dell’immagine',
    'Migrazione a DiscVault 26',
    'Variabili di ambiente',
    'Autenticazione e RBAC',
    'Plugin e metadati',
    'Installare la PWA',
    'Libreria e ricerca',
    'Comportamento offline',
    'Configurazione',
    'Uso quotidiano e limiti di sincronizzazione',
    'Funzioni e stato',
    'Registri, processi e sicurezza',
    'Panoramica delle integrazioni',
    'MCP e API REST',
    'Plex e Jellyfin',
    'Risoluzione dei problemi',
    'Riferimenti',
  ],
  ja: [
    '目的と結果',
    '対象',
    '前提条件',
    '手順',
    '期待される結果',
    '安全性とロールバック',
    '次の手順',
    '情報源と状態',
    '次の作業には、この具体的な手順を使用します：',
    '各コマンドのリリースチャンネルをページ内に明記しています。stable と beta は同じ PostgreSQL ベースの DiscVault v26 トポロジーを使用し、異なるのはイメージタグだけです。',
    '変更前に現在のイメージと設定を記録し、必要なバックアップを作成します。',
    '以下の設定を正確に適用し、例のパスとドメインを自分の値に置き換えます。',
    '示された確認を実行し、いずれかが失敗したら停止します。',
    'サービスが正常と報告し、説明された結果が表示されれば手順は完了です。',
    '対象サービスを停止し、保存した設定と対応するデータを復元して、以前の正常なイメージを起動します。',
    '概要',
    'インストール方法',
    '永続データと PostgreSQL',
    'リバースプロキシとパスキー',
    '初回起動とヘルスチェック',
    'バックアップ',
    '復元',
    'コンテナの更新',
    'イメージのロールバック',
    'DiscVault 26 への移行',
    '環境変数',
    '認証と RBAC',
    'プラグインとメタデータ',
    'PWA のインストール',
    'ライブラリと検索',
    'オフライン動作',
    '設定',
    '日常利用と同期の制限',
    '機能と状態',
    'ログ、ジョブ、セキュリティ',
    '連携の概要',
    'MCP と REST API',
    'Plex と Jellyfin',
    'トラブルシューティング',
    'リファレンス',
  ],
  ko: [
    '목표 및 결과',
    '적용 대상',
    '사전 요구 사항',
    '절차',
    '예상 결과',
    '안전 및 롤백',
    '다음 단계',
    '출처 및 상태',
    '다음 작업은 이 구체적인 절차를 따르세요:',
    '페이지는 각 명령의 릴리스 채널을 표시합니다. stable과 beta는 동일한 PostgreSQL 기반 DiscVault v26 토폴로지를 사용하며 이미지 태그만 다릅니다.',
    '변경 전에 현재 이미지와 구성을 기록하고 필요한 백업을 만드세요.',
    '아래 구성을 정확히 적용하고 예시 경로와 도메인을 자신의 값으로 바꾸세요.',
    '표시된 검사를 실행하고 하나라도 실패하면 중지하세요.',
    '서비스가 정상 상태를 보고하고 설명된 결과가 보이면 절차가 완료됩니다.',
    '해당 서비스를 중지하고 저장한 구성과 일치하는 데이터를 복원한 다음 이전의 정상 이미지를 시작하세요.',
    '개요',
    '설치 방법',
    '영구 데이터 및 PostgreSQL',
    '리버스 프록시 및 패스키',
    '첫 시작 및 상태 검사',
    '백업',
    '복원',
    '컨테이너 업데이트',
    '이미지 롤백',
    'DiscVault 26 마이그레이션',
    '환경 변수',
    '인증 및 RBAC',
    '플러그인 및 메타데이터',
    'PWA 설치',
    '라이브러리 및 검색',
    '오프라인 동작',
    '설정',
    '일상 사용 및 동기화 제한',
    '기능 및 상태',
    '로그, 작업 및 보안',
    '통합 개요',
    'MCP 및 REST API',
    'Plex 및 Jellyfin',
    '문제 해결',
    '참조',
  ],
  nl: [
    'Doel en resultaat',
    'Van toepassing op',
    'Vereisten',
    'Procedure',
    'Verwacht resultaat',
    'Veiligheid en terugdraaien',
    'Volgende stap',
    'Bron en status',
    'Volg deze gerichte procedure voor',
    'De pagina vermeldt bij elke opdracht het releasekanaal. Stabiel en bèta gebruiken dezelfde PostgreSQL-topologie van DiscVault v26; alleen de imagetag verschilt.',
    'Noteer vóór wijzigingen de huidige image en configuratie en maak de vereiste back-up.',
    'Pas de onderstaande configuratie exact toe en vervang voorbeeldpaden en domeinen door je eigen waarden.',
    'Voer de getoonde controles uit en stop als een controle mislukt.',
    'De procedure is voltooid wanneer de service gezond meldt en het beschreven resultaat zichtbaar is.',
    'Stop de getroffen service, herstel de opgeslagen configuratie en bijpassende gegevens en start de vorige werkende image.',
    'Overzicht',
    'Installatieroutes',
    'Blijvende gegevens en PostgreSQL',
    'Reverse proxy en passkeys',
    'Eerste start en statuscontrole',
    'Back-up',
    'Herstellen',
    'Container bijwerken',
    'Image terugdraaien',
    'Migratie naar DiscVault 26',
    'Omgevingsvariabelen',
    'Authenticatie en RBAC',
    'Plug-ins en metadata',
    'De PWA installeren',
    'Bibliotheek en zoeken',
    'Offlinegedrag',
    'Instellen',
    'Dagelijks gebruik en synchronisatiebeperkingen',
    'Functies en status',
    'Logs, taken en beveiliging',
    'Integratieoverzicht',
    'MCP en REST-API',
    'Plex en Jellyfin',
    'Problemen oplossen',
    'Referentie',
  ],
  no: [
    'Mål og resultat',
    'Gjelder for',
    'Forutsetninger',
    'Fremgangsmåte',
    'Forventet resultat',
    'Sikkerhet og tilbakerulling',
    'Neste trinn',
    'Kilde og status',
    'Følg denne målrettede fremgangsmåten for å fullføre',
    'Siden angir utgivelseskanalen for hver kommando. Stabil og beta bruker samme PostgreSQL-baserte DiscVault v26-topologi; bare image-taggen er forskjellig.',
    'Noter gjeldende image og konfigurasjon, og lag den nødvendige sikkerhetskopien før endringer.',
    'Bruk konfigurasjonen nedenfor nøyaktig, og erstatt eksempelstier og domener med egne verdier.',
    'Kjør kontrollene som vises, og stopp hvis en kontroll mislykkes.',
    'Fremgangsmåten er fullført når tjenesten melder frisk og det beskrevne resultatet er synlig.',
    'Stopp den berørte tjenesten, gjenopprett lagret konfigurasjon og tilhørende data, og start forrige fungerende image.',
    'Oversikt',
    'Installasjonsmåter',
    'Varige data og PostgreSQL',
    'Omvendt proxy og tilgangsnøkler',
    'Første oppstart og tilstandskontroll',
    'Sikkerhetskopi',
    'Gjenoppretting',
    'Containeroppdatering',
    'Tilbakerulling av image',
    'Migrering til DiscVault 26',
    'Miljøvariabler',
    'Autentisering og RBAC',
    'Programtillegg og metadata',
    'Installer PWA',
    'Bibliotek og søk',
    'Frakoblet virkemåte',
    'Oppsett',
    'Daglig bruk og synkroniseringsgrenser',
    'Funksjoner og status',
    'Logger, jobber og sikkerhet',
    'Integrasjonsoversikt',
    'MCP og REST API',
    'Plex og Jellyfin',
    'Feilsøking',
    'Referanse',
  ],
  pl: [
    'Cel i rezultat',
    'Dotyczy',
    'Wymagania wstępne',
    'Procedura',
    'Oczekiwany rezultat',
    'Bezpieczeństwo i wycofanie',
    'Następny krok',
    'Źródło i stan',
    'Wykonaj tę ukierunkowaną procedurę, aby ukończyć',
    'Strona podaje kanał wydania przy każdym poleceniu. Kanały stabilny i beta używają tej samej topologii DiscVault v26 z PostgreSQL; różni się tylko tag obrazu.',
    'Przed zmianami zanotuj bieżący obraz i konfigurację oraz wykonaj wymaganą kopię.',
    'Zastosuj dokładnie poniższą konfigurację, zastępując przykładowe ścieżki i domeny własnymi wartościami.',
    'Uruchom pokazane kontrole i zatrzymaj się, jeśli którakolwiek zakończy się błędem.',
    'Procedura jest ukończona, gdy usługa zgłasza prawidłowy stan i widać opisany rezultat.',
    'Zatrzymaj daną usługę, przywróć zapisaną konfigurację i odpowiadające dane, a następnie uruchom poprzedni działający obraz.',
    'Przegląd',
    'Sposoby instalacji',
    'Trwałe dane i PostgreSQL',
    'Odwrotny serwer proxy i klucze dostępu',
    'Pierwsze uruchomienie i kontrola stanu',
    'Kopia zapasowa',
    'Przywracanie',
    'Aktualizacja kontenera',
    'Wycofanie obrazu',
    'Migracja do DiscVault 26',
    'Zmienne środowiskowe',
    'Uwierzytelnianie i RBAC',
    'Wtyczki i metadane',
    'Instalacja PWA',
    'Biblioteka i wyszukiwanie',
    'Działanie offline',
    'Konfiguracja',
    'Codzienne użycie i ograniczenia synchronizacji',
    'Funkcje i stan',
    'Dzienniki, zadania i bezpieczeństwo',
    'Przegląd integracji',
    'MCP i REST API',
    'Plex i Jellyfin',
    'Rozwiązywanie problemów',
    'Dokumentacja',
  ],
  pt: [
    'Objetivo e resultado',
    'Aplicável a',
    'Pré-requisitos',
    'Procedimento',
    'Resultado esperado',
    'Segurança e reversão',
    'Próximo passo',
    'Fonte e estado',
    'Siga este procedimento específico para concluir',
    'A página indica o canal de lançamento de cada comando. Estável e beta usam a mesma topologia do DiscVault v26 com PostgreSQL; apenas muda a tag da imagem.',
    'Registe a imagem e a configuração atuais e crie a cópia necessária antes de qualquer alteração.',
    'Aplique exatamente a configuração abaixo e substitua os caminhos e domínios de exemplo pelos seus valores.',
    'Execute as verificações apresentadas e pare se alguma falhar.',
    'O procedimento termina quando o serviço indica um estado saudável e o resultado descrito fica visível.',
    'Pare o serviço afetado, restaure a configuração e os dados correspondentes e inicie a imagem anterior funcional.',
    'Visão geral',
    'Métodos de instalação',
    'Dados persistentes e PostgreSQL',
    'Proxy inverso e chaves de acesso',
    'Primeiro arranque e verificação de estado',
    'Cópia de segurança',
    'Restauro',
    'Atualização do contentor',
    'Reversão da imagem',
    'Migração para DiscVault 26',
    'Variáveis de ambiente',
    'Autenticação e RBAC',
    'Extensões e metadados',
    'Instalar a PWA',
    'Biblioteca e pesquisa',
    'Comportamento offline',
    'Configuração',
    'Utilização diária e limites de sincronização',
    'Funcionalidades e estado',
    'Registos, tarefas e segurança',
    'Visão geral das integrações',
    'MCP e API REST',
    'Plex e Jellyfin',
    'Resolução de problemas',
    'Referência',
  ],
  sv: [
    'Mål och resultat',
    'Gäller för',
    'Förutsättningar',
    'Procedur',
    'Förväntat resultat',
    'Säkerhet och återställning',
    'Nästa steg',
    'Källa och status',
    'Följ den här riktade proceduren för att slutföra',
    'Sidan anger utgivningskanalen för varje kommando. Stabil och beta använder samma PostgreSQL-baserade DiscVault v26-topologi; endast image-taggen skiljer sig.',
    'Anteckna aktuell image och konfiguration och skapa den nödvändiga säkerhetskopian före ändringar.',
    'Tillämpa konfigurationen nedan exakt och ersätt exempelvägar och domäner med egna värden.',
    'Kör kontrollerna som visas och stoppa om någon kontroll misslyckas.',
    'Proceduren är klar när tjänsten rapporterar god status och det beskrivna resultatet syns.',
    'Stoppa den berörda tjänsten, återställ sparad konfiguration och motsvarande data och starta föregående fungerande image.',
    'Översikt',
    'Installationsvägar',
    'Beständiga data och PostgreSQL',
    'Omvänd proxy och åtkomstnycklar',
    'Första start och hälsokontroll',
    'Säkerhetskopia',
    'Återställning',
    'Containeruppdatering',
    'Återställning av image',
    'Migrering till DiscVault 26',
    'Miljövariabler',
    'Autentisering och RBAC',
    'Insticksprogram och metadata',
    'Installera PWA',
    'Bibliotek och sökning',
    'Offlinebeteende',
    'Konfiguration',
    'Daglig användning och synkroniseringsgränser',
    'Funktioner och status',
    'Loggar, jobb och säkerhet',
    'Integrationsöversikt',
    'MCP och REST API',
    'Plex och Jellyfin',
    'Felsökning',
    'Referens',
  ],
  tr: [
    'Amaç ve sonuç',
    'Geçerli olduğu alan',
    'Ön koşullar',
    'Prosedür',
    'Beklenen sonuç',
    'Güvenlik ve geri alma',
    'Sonraki adım',
    'Kaynak ve durum',
    'Şunu tamamlamak için bu odaklı prosedürü izleyin:',
    'Sayfa her komutun yayın kanalını belirtir. Kararlı ve beta aynı PostgreSQL tabanlı DiscVault v26 topolojisini kullanır; yalnızca imaj etiketi farklıdır.',
    'Değişiklikten önce mevcut imajı ve yapılandırmayı kaydedin ve gerekli yedeği oluşturun.',
    'Aşağıdaki yapılandırmayı aynen uygulayın; örnek yolları ve alan adlarını kendi değerlerinizle değiştirin.',
    'Gösterilen kontrolleri çalıştırın ve herhangi biri başarısız olursa durun.',
    'Hizmet sağlıklı durum bildirdiğinde ve açıklanan sonuç göründüğünde prosedür tamamlanır.',
    'Etkilenen hizmeti durdurun, kaydedilen yapılandırmayı ve eşleşen verileri geri yükleyin, ardından önceki çalışan imajı başlatın.',
    'Genel bakış',
    'Kurulum yolları',
    'Kalıcı veriler ve PostgreSQL',
    'Ters vekil ve geçiş anahtarları',
    'İlk başlatma ve sağlık kontrolü',
    'Yedekleme',
    'Geri yükleme',
    'Kapsayıcı güncellemesi',
    'İmajı geri alma',
    'DiscVault 26 geçişi',
    'Ortam değişkenleri',
    'Kimlik doğrulama ve RBAC',
    'Eklentiler ve meta veriler',
    'PWA kurulumu',
    'Kitaplık ve arama',
    'Çevrimdışı davranış',
    'Kurulum',
    'Günlük kullanım ve eşitleme sınırları',
    'Özellikler ve durum',
    'Günlükler, işler ve güvenlik',
    'Entegrasyonlara genel bakış',
    'MCP ve REST API',
    'Plex ve Jellyfin',
    'Sorun giderme',
    'Başvuru',
  ],
  uk: [
    'Мета й результат',
    'Застосовується до',
    'Передумови',
    'Процедура',
    'Очікуваний результат',
    'Безпека й відкочування',
    'Наступний крок',
    'Джерело й стан',
    'Виконайте цю цільову процедуру, щоб завершити',
    'На сторінці вказано канал випуску для кожної команди. Стабільний і бета-канали використовують однакову топологію DiscVault v26 з PostgreSQL; відрізняється лише тег образу.',
    'Перед змінами запишіть поточний образ і конфігурацію та створіть потрібну резервну копію.',
    'Точно застосуйте наведену конфігурацію, замінивши приклади шляхів і доменів власними значеннями.',
    'Виконайте наведені перевірки й зупиніться, якщо будь-яка з них завершиться помилкою.',
    'Процедуру завершено, коли служба повідомляє про справний стан і видно описаний результат.',
    'Зупиніть відповідну службу, відновіть збережену конфігурацію й відповідні дані та запустіть попередній справний образ.',
    'Огляд',
    'Способи встановлення',
    'Постійні дані та PostgreSQL',
    'Зворотний проксі та ключі доступу',
    'Перший запуск і перевірка стану',
    'Резервне копіювання',
    'Відновлення',
    'Оновлення контейнера',
    'Відкочування образу',
    'Міграція до DiscVault 26',
    'Змінні середовища',
    'Автентифікація та RBAC',
    'Плагіни й метадані',
    'Встановлення PWA',
    'Бібліотека й пошук',
    'Робота без мережі',
    'Налаштування',
    'Щоденне використання й обмеження синхронізації',
    'Функції та стан',
    'Журнали, завдання й безпека',
    'Огляд інтеграцій',
    'MCP і REST API',
    'Plex і Jellyfin',
    'Усунення проблем',
    'Довідник',
  ],
  zh: [
    '目标和结果',
    '适用范围',
    '前提条件',
    '操作步骤',
    '预期结果',
    '安全与回滚',
    '下一步',
    '来源和状态',
    '请按照此专项步骤完成',
    '页面会为每条命令标明发布通道。稳定版与测试版使用相同的 PostgreSQL 支持的 DiscVault v26 拓扑；只有镜像标签不同。',
    '更改前请记录当前镜像和配置，并创建所需备份。',
    '请严格应用以下配置，并将示例路径和域名替换为您自己的值。',
    '运行所示检查；任何一项失败都应停止。',
    '当服务报告健康且可见所述结果时，操作即告完成。',
    '停止受影响的服务，恢复已保存的配置和匹配数据，然后启动上一个已知正常镜像。',
    '概览',
    '安装方式',
    '持久数据和 PostgreSQL',
    '反向代理和通行密钥',
    '首次启动和健康检查',
    '备份',
    '恢复',
    '容器更新',
    '镜像回滚',
    '迁移到 DiscVault 26',
    '环境变量',
    '身份验证和 RBAC',
    '插件和元数据',
    '安装 PWA',
    '媒体库和搜索',
    '离线行为',
    '设置',
    '日常使用和同步限制',
    '功能和状态',
    '日志、任务和安全',
    '集成概览',
    'MCP 和 REST API',
    'Plex 和 Jellyfin',
    '故障排除',
    '参考',
  ],
};

const categoryNames = {
  start: [
    'Start',
    'Začít',
    'Start',
    'Start',
    'Έναρξη',
    'Inicio',
    'Aloitus',
    'Démarrer',
    'Kezdés',
    'Inizio',
    '開始',
    '시작',
    'Start',
    'Start',
    'Start',
    'Começar',
    'Start',
    'Başlangıç',
    'Початок',
    '开始',
  ],
  install: [
    'Install',
    'Instalace',
    'Installation',
    'Installation',
    'Εγκατάσταση',
    'Instalación',
    'Asennus',
    'Installation',
    'Telepítés',
    'Installazione',
    'インストール',
    '설치',
    'Installeren',
    'Installasjon',
    'Instalacja',
    'Instalação',
    'Installation',
    'Kurulum',
    'Встановлення',
    '安装',
  ],
  update: [
    'Update and migrate',
    'Aktualizace a migrace',
    'Opdatering og migrering',
    'Update und Migration',
    'Ενημέρωση και μετεγκατάσταση',
    'Actualización y migración',
    'Päivitys ja siirto',
    'Mise à jour et migration',
    'Frissítés és migrálás',
    'Aggiornamento e migrazione',
    '更新と移行',
    '업데이트 및 마이그레이션',
    'Bijwerken en migreren',
    'Oppdatering og migrering',
    'Aktualizacja i migracja',
    'Atualização e migração',
    'Uppdatering och migrering',
    'Güncelleme ve geçiş',
    'Оновлення й міграція',
    '更新和迁移',
  ],
  configure: [
    'Configure',
    'Konfigurace',
    'Konfiguration',
    'Konfiguration',
    'Ρύθμιση',
    'Configuración',
    'Määritys',
    'Configuration',
    'Konfigurálás',
    'Configurazione',
    '設定',
    '구성',
    'Configureren',
    'Konfigurasjon',
    'Konfiguracja',
    'Configuração',
    'Konfiguration',
    'Yapılandırma',
    'Налаштування',
    '配置',
  ],
  pwa: Array(20).fill('PWA'),
  ios: Array(20).fill('iOS/iPadOS'),
  android: Array(20).fill('Android'),
  admin: [
    'Admin',
    'Správa',
    'Administration',
    'Administration',
    'Διαχείριση',
    'Administración',
    'Ylläpito',
    'Administration',
    'Adminisztráció',
    'Amministrazione',
    '管理',
    '관리',
    'Beheer',
    'Administrasjon',
    'Administracja',
    'Administração',
    'Administration',
    'Yönetim',
    'Адміністрування',
    '管理',
  ],
  integrations: [
    'Integrations',
    'Integrace',
    'Integrationer',
    'Integrationen',
    'Ενσωματώσεις',
    'Integraciones',
    'Integraatiot',
    'Intégrations',
    'Integrációk',
    'Integrazioni',
    '連携',
    '통합',
    'Integraties',
    'Integrasjoner',
    'Integracje',
    'Integrações',
    'Integrationer',
    'Entegrasyonlar',
    'Інтеграції',
    '集成',
  ],
  troubleshooting: [
    'Troubleshooting',
    'Řešení potíží',
    'Fejlfinding',
    'Fehlerbehebung',
    'Αντιμετώπιση προβλημάτων',
    'Solución de problemas',
    'Vianmääritys',
    'Dépannage',
    'Hibaelhárítás',
    'Risoluzione dei problemi',
    'トラブルシューティング',
    '문제 해결',
    'Problemen oplossen',
    'Feilsøking',
    'Rozwiązywanie problemów',
    'Resolução de problemas',
    'Felsökning',
    'Sorun giderme',
    'Усунення проблем',
    '故障排除',
  ],
  reference: [
    'Reference',
    'Reference',
    'Reference',
    'Referenz',
    'Αναφορά',
    'Referencia',
    'Viite',
    'Référence',
    'Referencia',
    'Riferimenti',
    'リファレンス',
    '참조',
    'Referentie',
    'Referanse',
    'Dokumentacja',
    'Referência',
    'Referens',
    'Referans',
    'Довідник',
    '参考',
  ],
};

const S = 'helmerzNL/DiscVault';
const pages = [
  {
    path: 'start/index',
    category: 'start',
    topic: 15,
    channel: ['stable', 'beta'],
    products: ['server', 'pwa', 'ios', 'android'],
    platforms: ['all'],
    version: 'DiscVault v26',
    source: [S, 'helmerzNL/DiscVaultApp', 'Flux76HQ/DiscVault-AndroidApp'],
    pre: ['Docker Engine 24+', 'iOS/iPadOS 17+', 'Android API 26+'],
    command: 'Server: /install/\nPWA: /pwa/\niOS/iPadOS: /ios/\nAndroid: /android/',
    intro:
      'Choose the server, PWA, iOS/iPadOS, or Android route without mixing their availability claims.',
    scope:
      'The DiscVault v26 server and PWA are available through stable `:latest` and beta `:beta`; native app pages carry their own release status.',
    expected:
      'You reach a platform-specific procedure and know its release channel before changing data.',
    rollback: 'No system change is made on this route page.',
    next: 'install/index',
  },
  {
    path: 'start/requirements',
    category: 'start',
    topic: 15,
    channel: ['stable', 'beta'],
    products: ['server', 'pwa', 'ios', 'android'],
    platforms: ['all'],
    version: 'DiscVault v26',
    source: [S],
    pre: ['Docker Engine 24+', 'Docker Compose v2', '2 GB RAM', 'HTTPS DNS name'],
    command: 'docker version\ndocker compose version\ncurl --version',
    intro: 'Confirm host, browser, storage, and native-platform requirements before installation.',
    scope:
      'DiscVault v26 stable and beta use the same PostgreSQL-backed service topology and host requirements.',
    expected:
      'Docker and Compose return versions, the host has a writable backup destination, and HTTPS DNS is planned.',
    rollback: 'This is a read-only check; correct missing prerequisites before continuing.',
    next: 'install/index',
  },
  {
    path: 'install/index',
    category: 'install',
    topic: 16,
    channel: ['stable', 'beta'],
    products: ['server'],
    platforms: ['docker', 'unraid'],
    version: 'DiscVault v26',
    source: [S],
    pre: ['Docker Engine 24+', 'Docker Compose v2'],
    command:
      'Recommended for both channels: /install/docker-compose/\nAdvanced complete equivalent: /install/docker-run/\nPersistence: /install/storage-postgresql/\nUnraid: /install/unraid/',
    intro:
      'Install one DiscVault v26 architecture and select stable or beta with one image variable.',
    scope:
      '`ghcr.io/helmerznl/discvault:latest` is DiscVault v26 stable and `ghcr.io/helmerznl/discvault:beta` is DiscVault v26 beta. Both use PostgreSQL, API, worker, MCP, and persistent `/data`; only `DISCVAULT_IMAGE` differs. The `:dev` tag remains engineering-only.',
    expected:
      'You choose one image channel for the shared v26 Compose topology and identify both persistent stores.',
    rollback:
      'Review release notes and create a matched PostgreSQL and filesystem backup before switching tags or digests.',
    next: 'install/docker-compose',
  },
  {
    path: 'install/docker-run',
    category: 'install',
    topic: 'Docker run',
    channel: ['stable', 'beta'],
    products: ['server'],
    platforms: ['docker'],
    version: 'DiscVault v26',
    source: [S],
    pre: ['Docker Engine 24+', 'OpenSSL', 'advanced multi-container operations'],
    command:
      'Run PostgreSQL 17, API, worker, and MCP on one Docker network. Set DATABASE_URL for API and worker, mount persistent PostgreSQL and /data paths, and map host 6080 to API port 5000.',
    intro:
      'Use raw Docker commands only as an advanced, complete equivalent of the recommended v26 Compose stack.',
    scope:
      'Set `DISCVAULT_IMAGE` to `ghcr.io/helmerznl/discvault:latest` for DiscVault v26 stable or `ghcr.io/helmerznl/discvault:beta` for DiscVault v26 beta. Both require PostgreSQL, `DATABASE_URL`, API, worker, MCP, and persistent `/data`.',
    expected:
      'All four containers are running, PostgreSQL is healthy, and `http://localhost:6080/api/next/health` succeeds through host port 6080 mapped to internal API port 5000.',
    rollback:
      'Remove only the four containers and network; preserve both `/srv/discvault-postgres` and `/srv/discvault` for recovery.',
    next: 'install/first-start-health',
  },
  {
    path: 'install/docker-compose',
    category: 'install',
    topic: 'Docker Compose',
    channel: ['stable', 'beta'],
    products: ['server'],
    platforms: ['docker'],
    version: 'DiscVault v26',
    source: [S],
    pre: ['Docker Compose v2', 'OpenSSL', 'persistent PostgreSQL and /data paths'],
    command:
      'Use one compose.yaml with postgres, next-api, next-worker, and next-mcp. Set DISCVAULT_IMAGE to ghcr.io/helmerznl/discvault:latest or ghcr.io/helmerznl/discvault:beta.',
    intro:
      'Deploy the recommended DiscVault v26 topology with PostgreSQL, API, worker, MCP, and persistent filesystem data.',
    scope:
      'Derived from `app/deploy/next/docker-compose.yml` at the verified source commit, this Compose file is identical for DiscVault v26 stable and beta. `DISCVAULT_IMAGE` is the only channel selector. The `next-*` service names and `/api/next` path are source-defined v26 names in both channels. The `6080:5000` mapping exposes host port 6080 to Gunicorn on internal API port 5000.',
    expected:
      'Compose reports PostgreSQL healthy and API, worker, and MCP running; PostgreSQL and `/data` remain on their configured host paths.',
    rollback:
      'Run `docker compose down` without deleting data, then restore the matched PostgreSQL and `/data` backup before recreating the previous image digest.',
    next: 'install/first-start-health',
  },
  {
    path: 'install/unraid',
    category: 'install',
    topic: 'Unraid',
    channel: ['stable', 'beta'],
    products: ['server'],
    platforms: ['unraid'],
    version: 'DiscVault v26',
    source: [S],
    pre: ['Unraid 6.12+', 'Compose Manager', '/mnt/user/appdata/discvault'],
    command:
      'Default DISCVAULT_IMAGE: ghcr.io/helmerznl/discvault:latest\nOptional beta: ghcr.io/helmerznl/discvault:beta\nAPI port: 6080 → 5000\nMCP port: 6090 → 6090\nData path: /mnt/user/appdata/discvault/data → /data\nPostgreSQL path: /mnt/user/appdata/discvault/postgres → /var/lib/postgresql/data',
    intro:
      'Deploy the same DiscVault v26 Compose topology through Unraid Compose Manager with explicit PostgreSQL and filesystem persistence.',
    scope:
      'Use `:latest` for DiscVault v26 stable by default or `:beta` for DiscVault v26 beta. Both channels run PostgreSQL, API, worker, and MCP with the same mounts and internal ports.',
    expected:
      'PostgreSQL, API, worker, and MCP start, and both appdata paths remain intact after container recreation.',
    rollback:
      'Stop the stack, preserve both appdata paths, restore their matched backup, and recreate the previous image digest.',
    next: 'install/first-start-health',
  },
  {
    path: 'install/storage-postgresql',
    category: 'install',
    topic: 17,
    channel: ['stable', 'beta'],
    products: ['server'],
    platforms: ['docker', 'unraid'],
    version: 'DiscVault v26',
    source: [S],
    pre: ['running DiscVault v26 Compose stack', 'PostgreSQL 17', 'separate backup destination'],
    command:
      'DISCVAULT_POSTGRES_DATA=/srv/discvault-postgres\nDISCVAULT_DATA_DIR=/srv/discvault\nPostgreSQL mount: /var/lib/postgresql/data\nFilesystem mount: /data',
    intro: 'Operate the two persistent stores used by every DiscVault v26 release channel.',
    scope:
      'For both `:latest` and `:beta`, application records live in PostgreSQL at `DISCVAULT_POSTGRES_DATA`; media, profiles, plugins, and file assets live at `DISCVAULT_DATA_DIR`, mounted as `/data`. Back up both in one stopped-writer window.',
    expected:
      'PostgreSQL is healthy, all v26 services run, and both persistent host paths are verified.',
    rollback:
      'Restore the PostgreSQL dump and `/data` archive from the same backup set before starting the matching image digest.',
    next: 'install/reverse-proxy-passkeys',
  },
  {
    path: 'install/reverse-proxy-passkeys',
    category: 'install',
    topic: 18,
    channel: ['stable', 'beta'],
    products: ['server'],
    platforms: ['docker', 'web'],
    version: 'DiscVault v26',
    source: [S],
    pre: ['public DNS', 'TLS certificate', 'WebSocket-capable reverse proxy'],
    command:
      'RP_ID=discvault.example.com\nRP_ORIGINS=https://discvault.example.com\nProxy upstream: http://127.0.0.1:6080\nHealth: https://discvault.example.com/api/next/health',
    intro:
      'Terminate HTTPS at a reverse proxy and keep passkey relying-party values aligned with the public origin.',
    scope:
      'DiscVault v26 stable and beta both use `RP_ID`, `RP_ORIGINS`, and `/api/next/health`. The proxy connects to host port 6080, which maps to API container port 5000. `RP_ID` is the hostname only.',
    expected:
      'The applicable public health URL succeeds and a passkey can be registered and used from the same HTTPS hostname.',
    rollback:
      'Restore the prior proxy configuration and RP values together. A hostname change can make existing passkeys unusable, so keep an owner recovery path.',
    next: 'install/first-start-health',
  },
  {
    path: 'install/first-start-health',
    category: 'install',
    topic: 19,
    channel: ['stable', 'beta'],
    products: ['server'],
    platforms: ['docker', 'web'],
    version: 'DiscVault v26',
    source: [S],
    pre: ['running container', 'browser on configured origin'],
    command:
      'docker compose --env-file /opt/discvault/.env -p discvault -f /opt/discvault/compose.yaml ps\ncurl --fail http://localhost:6080/api/next/health\ncurl --fail http://localhost:6080/api/next/auth/status',
    intro:
      'Verify startup and create the first owner only after the correct channel reports healthy.',
    scope:
      'Both release channels expose the v26 API with the `6080:5000` host-to-container mapping and use the same health and authentication endpoints.',
    expected:
      'Health returns success, the configured origin opens, and the first account becomes owner. Subsequent registration follows invite/auth settings.',
    rollback:
      'If owner creation fails, do not reset data blindly. Save logs and restore the pre-start data backup with the same image.',
    next: 'update/backup',
  },
  {
    path: 'update/index',
    category: 'update',
    topic: 15,
    channel: ['stable', 'beta'],
    products: ['server'],
    platforms: ['docker', 'unraid'],
    version: 'DiscVault v26',
    source: [S],
    pre: ['verified backup', 'recorded image digest'],
    command:
      '1. /update/backup/\n2. /update/restore/\n3. /update/update/\n4. /update/rollback/\nExisting-data import only: /update/migration/',
    intro: 'Use a gated sequence for backup, update, verification, and rollback.',
    scope:
      'Stable and beta use the same v26 PostgreSQL-backed topology. Change only `DISCVAULT_IMAGE`; review release notes and keep a matched PostgreSQL and `/data` backup before any update or channel switch.',
    expected: 'A backup is tested before pull/recreate, then health and data are verified.',
    rollback:
      'The previous image reference and matching database/filesystem backup are retained until acceptance.',
    next: 'update/backup',
  },
  {
    path: 'update/backup',
    category: 'update',
    topic: 20,
    channel: ['stable', 'beta'],
    products: ['server'],
    platforms: ['docker', 'unraid'],
    version: 'DiscVault v26',
    source: [S],
    pre: ['backup destination outside /data', 'free disk space'],
    command:
      'Stop API, worker, and MCP writers; capture the running image digest; create a PostgreSQL custom-format dump and a /data archive in the same maintenance window.',
    intro: 'Create a consistent backup before update, migration, or configuration changes.',
    scope:
      'DiscVault v26 stable and beta both require a PostgreSQL dump and the host `/data` directory from the same stopped-writer window.',
    expected:
      'Backup files are non-empty, stored outside the live data path, and can be listed or restored in a rehearsal.',
    rollback: 'If any backup command fails, restart the unchanged services and cancel the update.',
    next: 'update/restore',
  },
  {
    path: 'update/restore',
    category: 'update',
    topic: 21,
    channel: ['stable', 'beta'],
    products: ['server'],
    platforms: ['docker', 'unraid'],
    version: 'DiscVault v26',
    source: [S],
    pre: ['matching backup', 'matching image tag', 'maintenance window'],
    command:
      'The executable v26 restore block is generated from scripts/content/procedures.mjs and applies to both release channels.',
    intro:
      'Restore the complete data set for the selected channel rather than copying only one database file.',
    scope:
      'For both release channels, restore the matching `/data` archive and PostgreSQL dump before starting the recorded image digest.',
    expected:
      'The original image starts healthy and library counts and media files match the backup.',
    rollback:
      'Keep the failed directory and untouched backup copies until verification. If filesystem extraction or `pg_restore --exit-on-error` fails, the container, API, workers, and MCP must remain stopped while you retry.',
    next: 'update/update',
  },
  {
    path: 'update/update',
    category: 'update',
    topic: 22,
    channel: ['stable', 'beta'],
    products: ['server'],
    platforms: ['docker', 'unraid'],
    version: 'DiscVault v26',
    source: [S],
    pre: ['successful backup', 'release notes', 'previous image digest'],
    command:
      'Set DISCVAULT_IMAGE to ghcr.io/helmerznl/discvault:latest or ghcr.io/helmerznl/discvault:beta, validate the same Compose file, pull the three app services, and recreate without deleting persistent data.',
    intro: 'Pull and recreate one channel only, then verify health and representative data.',
    scope:
      '`ghcr.io/helmerznl/discvault:latest` is DiscVault v26 stable and `ghcr.io/helmerznl/discvault:beta` is DiscVault v26 beta. Both use the same service graph and data schema path. Record the resolved digest because release tags can move.',
    expected:
      'The intended image digest is running, health succeeds, and owner login, library count, and one media asset work.',
    rollback:
      'On any failed acceptance check, execute the image rollback with the pre-update data backup available.',
    next: 'update/rollback',
  },
  {
    path: 'update/rollback',
    category: 'update',
    topic: 23,
    channel: ['stable', 'beta'],
    products: ['server'],
    platforms: ['docker', 'unraid'],
    version: 'DiscVault v26',
    source: [S],
    pre: ['previous image digest or tag', 'pre-update backup'],
    command:
      'The executable DiscVault v26 rollback block is generated from scripts/content/procedures.mjs for both channels.',
    intro:
      'Return to the exact previous image and restore matching data whenever a schema or migration ran.',
    scope:
      'Use the recorded previous digest with its matching PostgreSQL dump and `/data` archive. A channel switch is allowed only after release-note review and a matched backup.',
    expected:
      'The recorded previous image is running and the restored library passes health and data checks.',
    rollback:
      'Restore matching data before the previous image starts. If filesystem extraction or `pg_restore --exit-on-error` fails, keep the container, API, workers, and MCP stopped and retry from untouched backup copies.',
    next: 'update/migration',
  },
  {
    path: 'update/migration',
    category: 'update',
    topic: 24,
    channel: ['stable', 'beta'],
    products: ['server'],
    platforms: ['docker', 'web'],
    version: 'DiscVault v26',
    source: [S],
    pre: ['legacy source backup', 'current PostgreSQL and /data backup', 'owner access'],
    command:
      'The migration assistant reads an existing legacy /data/discvault.db source and writes imported records to the current PostgreSQL runtime. It is available in DiscVault v26 stable and beta.',
    intro:
      'Import an existing SQLite collection into DiscVault 26 through the guarded migration assistant.',
    scope:
      'This page is only for importing existing legacy data. In both DiscVault v26 channels, `/data/discvault.db` is a read-only migration source, never the current runtime database; imported records are written to PostgreSQL.',
    expected:
      'Readiness is confirmed, migration finishes without failed records, and collection counts and sampled media match.',
    rollback:
      'Stop v26 writers, preserve logs, restore the matching PostgreSQL and `/data` backup, and restart the recorded image digest. Never repeat an import into a partially populated database.',
    next: 'configure/environment',
  },
  {
    path: 'configure/index',
    category: 'configure',
    topic: 15,
    channel: ['stable', 'beta'],
    products: ['server'],
    platforms: ['docker', 'web'],
    version: 'DiscVault v26',
    source: [S],
    pre: ['owner access', 'configuration backup'],
    command:
      'Environment: /configure/environment/\nAuthentication: /configure/auth-rbac/\nPlugins: /configure/plugins-metadata/',
    intro:
      'Configure runtime values, authentication, roles, and providers without exposing secrets.',
    scope:
      'The same v26 configuration model applies to stable and beta; only `DISCVAULT_IMAGE` selects the release channel.',
    expected: 'You reach the focused configuration procedure for your channel.',
    rollback: 'Change one subsystem at a time and retain the previous value.',
    next: 'configure/environment',
  },
  {
    path: 'configure/environment',
    category: 'configure',
    topic: 25,
    channel: ['stable', 'beta'],
    products: ['server'],
    platforms: ['docker', 'unraid'],
    version: 'DiscVault v26',
    source: [S],
    pre: ['private environment file', 'restart window'],
    command:
      'DISCVAULT_IMAGE=<:latest-or-:beta>\nDISCVAULT_DATA_DIR=/srv/discvault\nDISCVAULT_POSTGRES_DATA=/srv/discvault-postgres\nDISCVAULT_API_PORT=6080\nDISCVAULT_MCP_PORT=6090\nRP_ID=discvault.example.com\nRP_ORIGINS=https://discvault.example.com',
    intro:
      'Set runtime environment variables in the deployment environment, not in this documentation repository.',
    scope:
      'DiscVault v26 stable and beta use the same `.env` keys, PostgreSQL variables, `RP_ORIGINS`, ports, and persistent paths. Only `DISCVAULT_IMAGE` differs. Generate passwords and JWT secrets into a mode-600 file.',
    expected:
      '`docker compose config` resolves required non-secret values and the selected channel starts healthy.',
    rollback:
      'On failure, keep services stopped, restore the prior private environment file, validate it with `docker compose config --quiet`, and recreate the same image. Do not rotate `JWT_SECRET` or `POSTGRES_PASSWORD` during ordinary rollback.',
    next: 'configure/auth-rbac',
  },
  {
    path: 'configure/auth-rbac',
    category: 'configure',
    topic: 26,
    channel: ['stable', 'beta'],
    products: ['server'],
    platforms: ['web'],
    version: 'DiscVault v26',
    source: [S],
    pre: ['owner passkey', 'HTTPS origin', 'second recovery method'],
    command:
      'Admin → Security → Enable authentication\nAdmin → Users → Create 48-hour invite\nAdmin → Roles → Basic or Advanced\nGET /api/next/auth/status\nGET /api/next/auth/rbac',
    intro:
      'Enable passkeys, invites, users, groups, and role-based access without locking out the owner.',
    scope:
      'DiscVault v26 provides the same WebAuthn and RBAC functions in stable and beta. Basic roles are owner, administrator, media editor, media fan, and media viewer.',
    expected:
      'Owner login works, invite-only registration behaves as selected, and a test user receives only assigned permissions.',
    rollback:
      'Keep the owner session open while testing. Revert role assignments before disabling a user; never delete the only owner or last usable passkey.',
    next: 'configure/plugins-metadata',
  },
  {
    path: 'configure/plugins-metadata',
    category: 'configure',
    topic: 27,
    channel: ['stable', 'beta'],
    products: ['server'],
    platforms: ['web', 'docker'],
    version: 'DiscVault v26',
    source: [S],
    pre: ['owner or admin session', 'provider credentials'],
    command:
      'curl --fail http://localhost:6080/api/next/plugins/registry\ncurl --fail http://localhost:6080/api/next/metadata/plugins\nInstalled plugins persist under /data/plugins; add credentials through Admin → Plugins.',
    intro: 'Discover, configure, order, and health-check metadata and digital-source plugins.',
    scope:
      'DiscVault v26 stable and beta include the same plugin runtime. Bundled plugins are read-only; installed plugins persist under `/data/plugins`.',
    expected:
      'The registry lists the provider, its health check succeeds, and a dry-run lookup returns expected metadata.',
    rollback:
      'Disable the provider before removing it. Back up `/data/plugins` and configuration; do not edit files inside the image.',
    next: 'integrations/plex-jellyfin',
  },
  {
    path: 'pwa/index',
    category: 'pwa',
    topic: 15,
    channel: ['stable', 'beta'],
    products: ['pwa'],
    platforms: ['web'],
    version: 'DiscVault v26',
    source: [S],
    pre: ['supported Chromium, Safari, or Firefox', 'healthy HTTPS server'],
    command: 'Install: /pwa/install/\nLibrary: /pwa/library-search/\nOffline: /pwa/offline/',
    intro: 'Use the released web application and understand what remains server-dependent.',
    scope:
      'The same DiscVault v26 PWA is served by stable `:latest` and beta `:beta`; availability is not inferred from the channel name.',
    expected: 'The PWA opens from the configured server and routes to focused usage guidance.',
    rollback:
      'Browser installation does not alter server data; remove only the installed shell if needed.',
    next: 'pwa/install',
  },
  {
    path: 'pwa/install',
    category: 'pwa',
    topic: 28,
    channel: ['stable', 'beta'],
    products: ['pwa'],
    platforms: ['web', 'ios', 'android'],
    version: 'DiscVault v26',
    source: [S],
    pre: ['HTTPS or localhost', 'successful browser login'],
    command:
      'Desktop Chromium: address bar → Install DiscVault\niOS/iPadOS Safari: Share → Add to Home Screen\nAndroid Chromium: menu → Install app\nOpen the new icon and confirm the same server origin.',
    intro: 'Install the PWA on desktop, iOS/iPadOS, or Android from the trusted server origin.',
    scope:
      'DiscVault v26 stable and beta use the same PWA installation flow and exact HTTPS origin configured for passkeys.',
    expected:
      'DiscVault launches in a standalone window and owner login works from the installed icon.',
    rollback:
      'Remove the installed app from the operating system; this does not delete server data.',
    next: 'pwa/library-search',
  },
  {
    path: 'pwa/library-search',
    category: 'pwa',
    topic: 29,
    channel: ['stable', 'beta'],
    products: ['pwa'],
    platforms: ['web'],
    version: 'DiscVault v26',
    source: [S],
    pre: ['signed-in account', 'collection permission'],
    command:
      'Library → Search\nLibrary → Filter → Format / Genre / Group\nLibrary → View → Posters / List\nTitle → Details → Watchlist / Watched',
    intro:
      'Browse, search, filter, and update titles, containers, box sets, collections, watchlist, and history.',
    scope:
      'In both DiscVault v26 channels, available actions are permission-scoped; viewers cannot perform editor or administrator changes.',
    expected:
      'Search and filters return expected records and an allowed watchlist change persists after reload.',
    rollback:
      'Cancel edits before saving. For an incorrect saved change, restore the field in the UI; use a server backup only for bulk corruption.',
    next: 'pwa/offline',
  },
  {
    path: 'pwa/offline',
    category: 'pwa',
    topic: 30,
    channel: ['stable', 'beta'],
    products: ['pwa'],
    platforms: ['web', 'ios', 'android'],
    version: 'DiscVault v26',
    source: [S],
    pre: ['installed PWA', 'one successful online load'],
    command:
      '1. Open the library while online.\n2. Put the device in airplane mode.\n3. Reopen DiscVault and inspect cached views.\n4. Reconnect before relying on writes or recently changed records.',
    intro: 'Understand cached shell behavior, deep links, and the limits of offline data.',
    scope:
      'DiscVault v26 has limited offline PWA behavior in both channels. Cached screens may open, but server-backed writes, fresh searches, authentication, and synchronization require connectivity.',
    expected:
      'Previously loaded shell content may open offline; after reconnection a reload shows current server data.',
    rollback:
      'If the cache is stale, reconnect, close all DiscVault windows, clear site data for only the DiscVault origin, and sign in again.',
    next: 'troubleshooting/index',
  },
  {
    path: 'ios/index',
    category: 'ios',
    topic: 31,
    channel: ['beta'],
    products: ['ios'],
    platforms: ['ios'],
    version: 'iOS/iPadOS 17+',
    source: ['helmerzNL/DiscVaultApp', S],
    pre: ['iOS/iPadOS 17+', 'TestFlight or approved build source', 'camera permission'],
    command:
      'Launch → Onboarding → Create local library\nLibrary → + → Scan barcode or Enter manually\nSettings → App Lock',
    intro: 'Set up the native offline-first iOS/iPadOS app from a verified distribution source.',
    scope:
      'Beta source implementation. Local SwiftData library, scanning, lists, details, notifications, and app lock are verified in source; public App Store availability is not assumed.',
    expected:
      'Onboarding completes and a manually added or scanned title remains after restarting the app.',
    rollback:
      'Delete only a test item first. Before reinstalling the app, export or otherwise preserve any local library data available in the build.',
    next: 'ios/use-sync-limits',
  },
  {
    path: 'ios/use-sync-limits',
    category: 'ios',
    topic: 32,
    channel: ['beta'],
    products: ['ios'],
    platforms: ['ios'],
    version: 'iOS/iPadOS 17+',
    source: ['helmerzNL/DiscVaultApp', S],
    pre: ['completed onboarding', 'local backup or test library'],
    command:
      'Library → Search / Scan / Add manually\nLists → Create list → Add title\nSettings → App Lock\nSettings → Server connection',
    intro:
      'Use the local library, lists, scanning, notifications, app lock, and optional server connection without assuming unsupported synchronization.',
    scope:
      'Beta. Local/offline use is verified. The native source previously contained placeholder `/api/v1` sync routes; only the server connection behavior confirmed by the installed build should be trusted.',
    expected:
      'Local edits persist offline. Any sync test clearly reports success and produces matching records on both sides before broader use.',
    rollback:
      'Disable the server connection after sync errors and keep the local library authoritative until compatibility is confirmed. Do not repeatedly retry duplicate-producing sync.',
    next: 'android/index',
  },
  {
    path: 'android/index',
    category: 'android',
    topic: 31,
    channel: ['beta'],
    products: ['android'],
    platforms: ['android'],
    version: 'Android 8 / API 26+',
    source: ['Flux76HQ/DiscVault-AndroidApp', S],
    pre: ['Android 8.0+', 'verified APK or test distribution', 'camera permission'],
    command:
      'Launch → Onboarding\nLibrary → Add → Scan barcode or Manual entry\nSettings → Server connection',
    intro: 'Set up the Android offline-first foundation from a verified test distribution.',
    scope:
      'Beta foundation/MVP in source. Store availability is not assumed. Local Room storage, library, add flow, and settings must be verified in the installed build.',
    expected: 'Onboarding completes and a test title survives app restart and an offline launch.',
    rollback:
      'Do not uninstall while the app contains the only copy of a local library. Preserve/export data when the build offers that action.',
    next: 'android/use-status',
  },
  {
    path: 'android/use-status',
    category: 'android',
    topic: 33,
    channel: ['beta'],
    products: ['android'],
    platforms: ['android'],
    version: 'Android 8 / API 26+',
    source: ['Flux76HQ/DiscVault-AndroidApp', S],
    pre: ['test library', 'network optional'],
    command:
      'Verified in source: local library, search/filter/sort, manual add, settings\nVerify in installed build: CameraX / ML Kit barcode scan, lists, WorkManager sync\nNot a release claim: store publication or full iOS/PWA parity',
    intro:
      'Use available Android functions while treating incomplete parity and distribution as explicit status, not released behavior.',
    scope:
      'Beta. Local-library functions are the supported test path; optional server sync and remaining parity must be validated per build. Roadmap features are unavailable until implemented and released.',
    expected:
      'Every used function is present in the installed build and local changes remain available offline.',
    rollback:
      'Disable optional sync after conflict or duplicate errors. Keep a test library until bidirectional behavior is confirmed.',
    next: 'troubleshooting/index',
  },
  {
    path: 'admin/index',
    category: 'admin',
    topic: 34,
    channel: ['stable', 'beta'],
    products: ['server'],
    platforms: ['docker', 'unraid', 'web'],
    version: 'DiscVault v26',
    source: [S],
    pre: ['owner access', 'external backup destination'],
    command:
      'docker compose --env-file /opt/discvault/.env -p discvault -f /opt/discvault/compose.yaml logs --tail=200 next-api next-worker next-mcp postgres\ncurl --fail http://localhost:6080/api/next/jobs\ncurl --fail http://localhost:6080/api/next/health',
    intro:
      'Monitor health, logs, operations, background jobs, plugin failures, and account security.',
    scope:
      'Stable and beta use the same v26 service names and endpoints. Logs can contain titles and user identifiers; redact them before sharing.',
    expected:
      'Health succeeds, failed jobs have an actionable error, backups are current, and no default or exposed secret remains.',
    rollback:
      'Pause workers before retrying destructive jobs. Restore configuration and matched data rather than clearing queues or accounts without a backup.',
    next: 'troubleshooting/index',
  },
  {
    path: 'integrations/index',
    category: 'integrations',
    topic: 35,
    channel: ['stable', 'beta'],
    products: ['server'],
    platforms: ['web', 'docker'],
    version: 'DiscVault v26',
    source: [S],
    pre: ['personal API key or admin session', 'HTTPS endpoint'],
    command: 'MCP/API: /integrations/mcp-api/\nDigital sources: /integrations/plex-jellyfin/',
    intro: 'Choose an integration by channel and grant only the permissions it needs.',
    scope:
      'DiscVault v26 stable and beta both provide MCP/API access, the plugin registry, and digital-source workflows.',
    expected:
      'You reach the matching v26 procedure and grant only the permissions required by that integration.',
    rollback: 'Revoke test credentials and disable the integration before removing configuration.',
    next: 'integrations/mcp-api',
  },
  {
    path: 'integrations/mcp-api',
    category: 'integrations',
    topic: 36,
    channel: ['stable', 'beta'],
    products: ['server'],
    platforms: ['web', 'docker'],
    version: 'DiscVault v26',
    source: [S],
    pre: ['personal API key', 'HTTPS DiscVault origin', 'MCP streamable HTTP client'],
    command: `{\n  "mcpServers": {\n    "discvault": {\n      "transport": "streamable-http",\n      "url": "https://discvault.example.com/mcp",\n      "headers": { "Authorization": "Bearer <personal-api-key>" }\n    }\n  }\n}\n# Health: curl --fail https://discvault.example.com/api/next/health`,
    intro: 'Connect an MCP client or REST consumer with a personal, user-scoped API key.',
    scope:
      'DiscVault v26 stable and beta expose MCP on the web origin or direct port 6090 and use the same API service. Never place a real key in documentation, logs, or source control.',
    expected:
      'The client lists DiscVault tools and returns only the key owner’s collection, groups, watchlist, and history.',
    rollback:
      'Revoke the personal key in profile settings and remove it from the client. Create a new key rather than reusing an exposed one.',
    next: 'integrations/plex-jellyfin',
  },
  {
    path: 'integrations/plex-jellyfin',
    category: 'integrations',
    topic: 37,
    channel: ['stable', 'beta'],
    products: ['server'],
    platforms: ['web', 'docker'],
    version: 'DiscVault v26',
    source: [S],
    pre: ['Plex token or Jellyfin API key', 'reachable server URL', 'admin session'],
    command:
      'Admin → Plugins → Plex or Jellyfin → Configure\nAdmin → Plugins → Health check\nAdmin → Plugins → Discover (dry run)\nGET /api/next/digital-sources\nGET /api/next/digital-items?limit=200',
    intro:
      'Connect a digital media source, validate credentials, and dry-run discovery before queuing synchronization.',
    scope:
      'The DiscVault v26 plugin workflow is available in stable and beta. Provider secrets are stored as secret settings and are not returned by the API.',
    expected:
      'Health succeeds, dry-run discovery returns expected items, and matched records identify the correct source.',
    rollback:
      'Disable the plugin and revoke its provider credential. Review dry-run output before deleting imported digital links.',
    next: 'troubleshooting/index',
  },
  {
    path: 'troubleshooting/index',
    category: 'troubleshooting',
    topic: 38,
    channel: ['stable', 'beta'],
    products: ['server', 'pwa', 'ios', 'android'],
    platforms: ['all'],
    version: 'DiscVault v26',
    source: [S, 'helmerzNL/DiscVaultApp', 'Flux76HQ/DiscVault-AndroidApp'],
    pre: ['deployment channel', 'timestamp', 'redacted logs', 'current image digest'],
    command:
      'docker compose --env-file /opt/discvault/.env -p discvault -f /opt/discvault/compose.yaml ps\ncurl --fail http://localhost:6080/api/next/health\ndocker compose --env-file /opt/discvault/.env -p discvault -f /opt/discvault/compose.yaml logs --tail=200 next-api next-worker next-mcp postgres',
    intro:
      'Diagnose container startup, reverse proxy/passkeys, PWA cache, native permissions, migration, and data recovery in a safe order.',
    scope:
      'Identify the image tag first, then use the shared v26 service graph. A 502 suggests host port 6080 or internal port 5000 health; passkey errors suggest HTTPS, `RP_ID`, or `RP_ORIGINS` mismatch.',
    expected:
      'The failing layer is isolated to container, proxy, browser/app, provider, or data and the matching health check is recorded.',
    rollback:
      'Do not delete volumes, `/data`, browser credentials, or app storage as a first step. Preserve redacted logs and restore a matched backup when data changed.',
    next: 'reference/index',
  },
  {
    path: 'reference/index',
    category: 'reference',
    topic: 39,
    channel: ['stable', 'beta'],
    products: ['server', 'pwa', 'ios', 'android'],
    platforms: ['all'],
    version: 'DiscVault v26',
    source: [S],
    pre: ['selected release channel'],
    command:
      'DiscVault v26 stable: ghcr.io/helmerznl/discvault:latest\nDiscVault v26 beta: ghcr.io/helmerznl/discvault:beta\nEngineering only: ghcr.io/helmerznl/discvault:dev\nBoth release channels: PostgreSQL 17 + /data; postgres + next-api + next-worker + next-mcp; API 6080 → 5000; MCP 6090 → 6090; GET /api/next/health; RP_ID + RP_ORIGINS',
    intro:
      'Look up image channels, ports, endpoints, persistent data locations, and channel-specific environment keys.',
    scope:
      '`ghcr.io/helmerznl/discvault:latest` is DiscVault v26 stable and `ghcr.io/helmerznl/discvault:beta` is DiscVault v26 beta. They share one PostgreSQL-backed architecture; only the image tag differs. `:dev` is engineering-only.',
    expected:
      'An operator can identify the running channel and all data that must be backed up before a change.',
    rollback:
      'Reference information makes no changes. Return to the focused procedure for commands and checks.',
    next: 'start/index',
  },
];

const quote = (value) => `'${String(value).replaceAll("'", "''")}'`;
const yamlArray = (items) => `[${items.map(quote).join(', ')}]`;
const localeIndex = (locale) => locales.indexOf(locale);
const prefix = (locale) => (locale === 'en' ? '' : `/${locale}`);
const titleFor = (page, locale) => {
  const i = localeIndex(locale);
  const topic = typeof page.topic === 'number' ? l10n[locale][page.topic] : page.topic;
  return page.category === 'troubleshooting' || page.category === 'reference'
    ? categoryNames[page.category][i]
    : `${categoryNames[page.category][i]}: ${topic}`;
};
const routeFor = (pagePath, locale) =>
  `${prefix(locale)}/${pagePath.replace(/\/index$/, '')}/`.replace('//', '/');
const sourceLinks = (page, locale) =>
  page.source
    .map(
      (source) =>
        `- [\`${source}@${commits[source].slice(0, 12)}\`](https://github.com/${source}/commit/${commits[source]})`,
    )
    .join('\n') +
  `\n- ${locale === 'en' ? 'Verified' : l10n[locale][7]}: \`${verified}\`\n- DiscVault Docs: \`${docsVersion}\``;

const visibleTechnicalToken =
  /`[^`\n]+`|\b(?:DiscVault(?: Docs)?|Docker(?: Compose| Engine| run)?|PostgreSQL|SQLite|PWA|HTTPS|HTTP|TLS|DNS|MCP|REST|API|iOS(?:\/iPadOS)?|Android|SwiftData|Room|CameraX|ML Kit|WorkManager|Plex|Jellyfin|OpenSSL|WebSocket|WebAuthn|Unraid|TestFlight|RBAC|JSON)\b|App Lock|Service Worker|→|≠|\b\d+(?:\.\d+)?(?:\+| GB| hours?)?\b/gi;

function technicalFragment(value, locale) {
  if (locale === 'en') return value;
  return [...value.matchAll(visibleTechnicalToken)].map((match) => match[0]).join(' ');
}

function renderPart(part, locale) {
  const ui = procedureLocale[locale];
  if (typeof part === 'string') return technicalFragment(part, locale);
  if (part?.term) return ui.terms[part.term] ?? '';
  if (part?.ui) return ui.uiPaths[part.ui] ?? '';
  if (part?.route) {
    const target = pages.find((candidate) => candidate.path === part.route);
    return target ? `[${titleFor(target, locale)}](${routeFor(target.path, locale)})` : '';
  }
  return '';
}

function renderItem(parts, locale, fallback = '') {
  const rendered = parts.map((part) => renderPart(part, locale)).filter(Boolean);
  return rendered.join(' · ') || fallback;
}

function markerFor(spec, index, locale) {
  const marker = spec.markers[index % spec.markers.length];
  return locale === 'en' ? marker : technicalFragment(marker, locale);
}

function markersFor(spec, locale) {
  const markers = spec.markers
    .map((marker) => (locale === 'en' ? marker : technicalFragment(marker, locale)))
    .filter(Boolean);
  return markers.length ? markers : ['DiscVault'];
}

function platformFor(page, locale) {
  const ui = procedureLocale[locale];
  const platformNames = {
    docker: 'Docker',
    unraid: 'Unraid',
    web: ui.webPlatform,
    ios: 'iOS',
    android: 'Android',
    all: ui.allPlatforms,
  };
  return page.platforms.map((platform) => platformNames[platform] ?? platform).join(' · ');
}

function versionFor(page) {
  return page.version;
}

function channelLabelFor(page, channel, locale) {
  const ui = procedureLocale[locale];
  if (page.version === 'DiscVault v26' && channel === 'stable') return ui.v26Stable;
  if (page.version === 'DiscVault v26' && channel === 'beta') return ui.v26Beta;
  return ui[channel];
}

function renderChannelScope(page, spec, locale) {
  const ui = procedureLocale[locale];
  const channelFacts = page.channel.flatMap((channel) =>
    (spec.channels[channel] ?? []).map((parts, index) =>
      renderItem(parts, locale, markerFor(spec, index, locale) || 'DiscVault'),
    ),
  );
  const summary =
    locale === 'en'
      ? page.scope
      : `${ui.scopeFor} **${titleFor(page, locale)}** (${platformFor(page, locale)}). ${ui.scopeFacts} ${channelFacts.join('; ')}. ${ui.semanticBoundary} ${markersFor(spec, locale).join(' · ')}.`;
  const sections = [summary];
  for (const channel of page.channel) {
    sections.push(`### ${channelLabelFor(page, channel, locale)}`);
    const facts = spec.channels[channel] ?? [];
    sections.push(
      facts
        .map(
          (parts, index) =>
            `- ${renderItem(parts, locale, markerFor(spec, index, locale) || 'DiscVault')}`,
        )
        .join('\n'),
    );
  }
  return sections.join('\n\n');
}

function renderBlocks(page, spec, locale) {
  const ui = procedureLocale[locale];
  const sections = [];
  let previousChannel;
  for (const block of spec.blocks) {
    if (block.type === 'routes') {
      sections.push(`### ${ui.routesTitle}`);
      sections.push(
        block.entries
          .map(([targetPath, detail], index) => {
            const target = pages.find((candidate) => candidate.path === targetPath);
            const title = target ? titleFor(target, locale) : targetPath;
            const href = target ? routeFor(target.path, locale) : routeFor(targetPath, locale);
            const renderedDetail =
              technicalFragment(detail, locale) || markerFor(spec, index, locale) || 'DiscVault';
            return `- [${title}](${href}) — ${renderedDetail}`;
          })
          .join('\n'),
      );
      previousChannel = undefined;
      continue;
    }
    if (block.type === 'code') {
      if (sections.length === 0 || previousChannel === undefined) {
        sections.push(`### ${ui.commandsTitle}`);
      }
      if (block.channel !== previousChannel) {
        sections.push(`#### ${channelLabelFor(page, block.channel, locale)}`);
        previousChannel = block.channel;
      }
      sections.push(`\`\`\`${block.language}\n${block.value}\n\`\`\``);
    }
  }
  return sections.join('\n\n');
}

function procedureBody(page, locale) {
  const labels = l10n[locale];
  const ui = procedureLocale[locale];
  const spec = procedures[page.path];
  if (!spec) throw new Error(`Missing page-specific procedure model for ${page.path}.`);
  const nextPage = pages.find((candidate) => candidate.path === page.next) ?? pages[0];
  const goal =
    locale === 'en'
      ? page.intro
      : `${ui.goalLead} **${titleFor(page, locale)}**. ${ui.evidenceLead} ${markersFor(spec, locale).join(' · ')}.`;
  const prerequisites = spec.prerequisites
    .map(
      (parts, index) =>
        `- ${renderItem(parts, locale, markerFor(spec, index, locale) || 'DiscVault')}`,
    )
    .join('\n');
  const steps = spec.steps
    .map(
      ({ action, parts }, index) =>
        `${index + 1}. **${ui.actions[action]}:** ${renderItem(
          parts,
          locale,
          markerFor(spec, index, locale) || 'DiscVault',
        )}`,
    )
    .join('\n');
  const blocks = renderBlocks(page, spec, locale);
  const expected =
    locale === 'en'
      ? `${page.expected}\n\n${spec.outcomes
          .map((parts, index) => `- ${renderItem(parts, locale, spec.markers[index])}`)
          .join('\n')}`
      : `${ui.expectedFor} **${titleFor(page, locale)}** ${ui.expectedFacts} ${spec.outcomes
          .map((parts, index) =>
            renderItem(parts, locale, markerFor(spec, index, locale) || 'DiscVault'),
          )
          .join('; ')}. ${ui.semanticBoundary} ${markersFor(spec, locale).join(' · ')}.

${spec.outcomes
  .map(
    (parts, index) =>
      `- ${renderItem(parts, locale, markerFor(spec, index, locale) || 'DiscVault')}`,
  )
  .join('\n')}`;
  const safety =
    locale === 'en'
      ? `${page.rollback}\n\n${spec.safety
          .map((parts, index) => `- ${renderItem(parts, locale, spec.markers[index])}`)
          .join('\n')}`
      : `${ui.safetyFor} **${titleFor(page, locale)}** ${ui.safetyFacts} ${spec.safety
          .map((parts, index) =>
            renderItem(parts, locale, markerFor(spec, index, locale) || 'DiscVault'),
          )
          .join('; ')}. ${ui.semanticBoundary} ${markersFor(spec, locale).join(' · ')}.

${spec.safety
  .map(
    (parts, index) =>
      `- ${renderItem(parts, locale, markerFor(spec, index, locale) || 'DiscVault')}`,
  )
  .join('\n')}`;

  return `## ${labels[0]}

${goal}

## ${labels[1]}

${renderChannelScope(page, spec, locale)}

## ${labels[2]}

${prerequisites}

## ${labels[3]}

${steps}

${blocks}

## ${labels[4]}

${expected}

## ${labels[5]}

:::caution
${safety}
:::

## ${labels[6]}

[${titleFor(nextPage, locale)}](${routeFor(nextPage.path, locale)})

## ${labels[7]}

${sourceLinks(page, locale)}
`;
}

function frontmatter(page, locale) {
  const title = titleFor(page, locale);
  const spec = procedures[page.path];
  const description =
    locale === 'en'
      ? page.intro
      : `${procedureLocale[locale].descriptionLead} ${title}: ${markersFor(spec, locale).join(' · ')}.`;
  return `---
title: ${quote(title)}
description: ${quote(description)}
pageId: ${quote(page.path.replaceAll('/', '-'))}
products: ${yamlArray(page.products)}
platforms: ${yamlArray(page.platforms)}
channels: ${yamlArray(page.channel)}
minVersion: ${quote(page.version)}
sourceRepos: ${yamlArray(page.source)}
lastVerified: '${verified}'
---
`;
}

function pageDocument(page, locale) {
  const depth = page.path.split('/').length;
  const componentPrefix = '../'.repeat(depth + (locale === 'en' ? 1 : 2));
  return `${frontmatter(page, locale)}
import PageMeta from '${componentPrefix}components/PageMeta.astro';

<PageMeta channels="${page.channel.join(',')}" platform="${platformFor(page, locale)}" version="${versionFor(page)}" source="${page.source.join(' · ')}" verified="${verified}" />

${procedureBody(page, locale)}`;
}

function homepage(locale) {
  const i = localeIndex(locale);
  const title = locale === 'en' ? 'DiscVault documentation' : `${categoryNames.start[i]} DiscVault`;
  const componentPrefix = locale === 'en' ? '../../' : '../../../';
  const start = routeFor('start/index', locale);
  return `---
title: ${quote(title)}
description: ${quote(`${procedureLocale[locale].descriptionLead} DiscVault — ${categoryNames.install[i]} · PWA · iOS/iPadOS · Android.`)}
pageId: 'home'
products: ['docs']
platforms: ['all']
channels: ['stable', 'beta']
minVersion: 'DiscVault v26'
sourceRepos: ['Flux76HQ/App-Guidance']
lastVerified: '${verified}'
template: splash
hero:
  title: ${quote(title)}
  tagline: ${quote(`${categoryNames.install[i]} · PWA · iOS/iPadOS · Android`)}
  image:
    file: ${locale === 'en' ? '../../' : '../../../'}assets/discvault-logo.svg
  actions: [{ text: ${quote(procedureLocale[locale].startAction)}, link: ${start}, icon: right-arrow, variant: primary }]
---

import RouteGrid from '${componentPrefix}components/RouteGrid.astro';

<RouteGrid />
`;
}

await rm(root, { recursive: true, force: true });
await mkdir(root, { recursive: true });
for (const locale of locales) {
  const localeRoot = locale === 'en' ? root : path.join(root, locale);
  await mkdir(localeRoot, { recursive: true });
  await writeFile(path.join(localeRoot, 'index.mdx'), homepage(locale), 'utf8');
  for (const page of pages) {
    const target = path.join(localeRoot, `${page.path}.mdx`);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, pageDocument(page, locale), 'utf8');
  }
}

console.log(`Generated ${pages.length + 1} pages × ${locales.length} locales.`);
