import Navbar from "../components/Navbar";

const AMBITIONS = [
  "Révéler de nouveaux talents.",
  "Créer du contenu fort et attractif.",
  "Donner de la visibilité aux jeunes créateurs.",
  "Valoriser la culture caribéenne.",
  "Soutenir des causes utiles à la société.",
  "Construire une marque durable, reconnue et influente dans la région.",
];

const BULLET_COLORS = ["bg-coral", "bg-lagoon", "bg-sunset"] as const;

interface Program {
  title: string;
  intro: string;
  items: string[];
}

const PROGRAM: Program[] = [
  {
    title: "Créer du contenu",
    intro:
      "Chaque participant devra produire du contenu autour de thèmes définis par la production :",
    items: [
      "Vidéos TikTok.",
      "Reels Instagram.",
      "Vlogs.",
      "Podcasts.",
      "Lives.",
      "Interviews.",
      "Défis créatifs.",
      "Contenus de groupe.",
    ],
  },
  {
    title: "Participer à des challenges",
    intro:
      "Des défis seront organisés régulièrement pour tester leur créativité, leur cohésion et leur capacité à se dépasser :",
    items: [
      "Défis sportifs.",
      "Défis culturels.",
      "Défis artistiques.",
      "Défis entrepreneuriaux.",
      "Défis de communication.",
      "Défis en équipe.",
      "Défis d'improvisation.",
    ],
  },
  {
    title: "Développer des projets",
    intro:
      "Les participants devront aussi travailler sur des actions concrètes à impact positif :",
    items: [
      "Créer une campagne de sensibilisation.",
      "Imaginer une action solidaire.",
      "Présenter un projet associatif.",
      "Monter une mini-campagne de communication.",
      "Proposer une idée d'entreprise ou de marque.",
      "Réaliser un projet collectif présenté au public.",
    ],
  },
  {
    title: "Vivre en communauté",
    intro: "La vie dans la villa fera partie intégrante du programme :",
    items: [
      "Organisation du quotidien.",
      "Répartition des tâches.",
      "Travail en équipe.",
      "Gestion des tensions.",
      "Respect des règles de vie.",
      "Développement personnel.",
      "Apprentissage de la discipline et de la responsabilité.",
    ],
  },
];

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="mt-4 space-y-2.5">
      {items.map((item, i) => (
        <li key={item} className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className={`mt-2 h-2 w-2 shrink-0 rounded-full ${
              BULLET_COLORS[i % BULLET_COLORS.length]
            }`}
          />
          <span className="text-slate-200">{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function Villa() {
  return (
    <>
      <span id="top" />
      <Navbar />

      <header
        id="intro"
        className="mx-auto max-w-3xl scroll-mt-20 px-6 pb-6 pt-28 sm:pt-32"
      >
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-lagoon">
          À l'intérieur du programme
        </p>
        <h1 className="mt-3 text-4xl font-extrabold text-white sm:text-5xl">
          La{" "}
          <span className="bg-gradient-to-r from-coral to-sunset bg-clip-text text-transparent">
            Villa
          </span>
        </h1>
      </header>

      <section
        id="ambition"
        className="mx-auto max-w-3xl scroll-mt-20 px-6 py-10"
      >
        <h2 className="text-2xl font-bold text-white sm:text-3xl">
          Notre ambition
        </h2>
        <p className="mt-3 text-slate-300">
          Faire de{" "}
          <span className="font-semibold text-white">OASIS HOUSE CARIBBEAN</span>{" "}
          une émission de référence en{" "}
          <span className="font-semibold text-sunset">Guyane</span> et dans la{" "}
          <span className="font-semibold text-sunset">Caraïbe</span>, capable
          de&nbsp;:
        </p>
        <ul className="mt-4 space-y-2.5">
          {AMBITIONS.map((item, i) => (
            <li key={item} className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className={`mt-2 h-2 w-2 shrink-0 rounded-full ${
                  BULLET_COLORS[i % BULLET_COLORS.length]
                }`}
              />
              <span className="text-slate-200">{item}</span>
            </li>
          ))}
        </ul>

        <p className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-slate-200 backdrop-blur">
          En résumé,{" "}
          <span className="font-semibold text-white">OASIS HOUSE CARIBBEAN</span>{" "}
          n'est pas seulement une émission de télé-réalité&nbsp;: c'est un projet
          de{" "}
          <span className="font-semibold text-coral">contenu</span>, de{" "}
          <span className="font-semibold text-coral">visibilité</span>,
          d'
          <span className="font-semibold text-coral">impact social</span> et de
          mise en valeur des{" "}
          <span className="font-semibold text-sunset">talents caribéens</span>.
        </p>
      </section>

      <section
        id="programme"
        className="mx-auto max-w-3xl scroll-mt-20 px-6 py-10"
      >
        <h2 className="text-2xl font-bold text-white sm:text-3xl">
          Ce qui se passe dans la villa
        </h2>
        <p className="mt-3 text-slate-300">
          Durant leur séjour, les participants auront un programme structuré
          avec des activités quotidiennes.
        </p>

        <div className="mt-8 space-y-5">
          {PROGRAM.map((p, i) => (
            <article
              key={p.title}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-coral to-sunset text-sm font-extrabold text-white shadow">
                  {i + 1}
                </span>
                <h3 className="text-lg font-bold text-white sm:text-xl">
                  {p.title}
                </h3>
              </div>
              <p className="mt-3 text-slate-300">{p.intro}</p>
              <BulletList items={p.items} />
            </article>
          ))}
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-6 pb-24 pt-6 text-center">
        <a href="/#inscription" className="btn-primary">
          Je m'inscris au casting
        </a>
      </div>
    </>
  );
}
